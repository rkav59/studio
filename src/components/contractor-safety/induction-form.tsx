
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { Contractor, InductionRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from 'next/navigation';

const INDUCTION_RECORDS_COLLECTION = 'inductionRecords';
const CONTRACTORS_COLLECTION = 'contractors';

const quizQuestions = [
    { id: 'q1', text: 'What is the first action to take upon hearing a continuous fire alarm?', correct: 'evacuate' },
    { id: 'q2', text: 'Which of the following requires a hot work permit?', correct: 'welding' },
    { id: 'q3', text: 'Who is responsible for ensuring your work area is clean and safe?', correct: 'self' },
    { id: 'q4', text: 'When must high-visibility clothing be worn?', correct: 'all_times' },
];

const quizOptions: Record<string, { value: string; label: string }[]> = {
    q1: [ { value: 'finish_task', label: 'Finish the current task quickly' }, { value: 'evacuate', label: 'Evacuate immediately via the nearest safe exit' }, { value: 'find_source', label: 'Look for the source of the alarm' } ],
    q2: [ { value: 'drilling', label: 'Drilling into concrete' }, { value: 'welding', label: 'Welding or using an angle grinder' }, { value: 'painting', label: 'Painting with a brush' } ],
    q3: [ { value: 'cleaner', label: 'The designated cleaning staff' }, { value: 'supervisor', label: 'Your supervisor' }, { value: 'self', label: 'You are responsible for your own work area' } ],
    q4: [ { value: 'night_only', label: 'Only during hours of darkness' }, { value: 'all_times', label: 'At all times while on site, outside of office areas' }, { value: 'when_remember', label: 'When you remember to put it on' } ],
};

const formSchema = z.object({
  contractorId: z.string({ required_error: "Please select your company." }),
  traineeName: z.string().min(2, "Please enter your full name."),
  q1: z.string({ required_error: "Please answer question 1." }),
  q2: z.string({ required_error: "Please answer question 2." }),
  q3: z.string({ required_error: "Please answer question 3." }),
  q4: z.string({ required_error: "Please answer question 4." }),
});

type InductionFormValues = z.infer<typeof formSchema>;

interface InductionFormProps {
  contractors: Contractor[];
}

export function InductionForm({ contractors }: InductionFormProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const router = useRouter();

    const form = useForm<InductionFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            traineeName: "",
        },
    });

    const recordInductionMutation = useMutation({
        mutationFn: async (data: { inductionRecord: Omit<InductionRecord, 'id'>, contractorId: string }) => {
            if (!user?.uid) throw new Error("User not authenticated.");
            
            const inductionRef = await addDoc(collection(db, INDUCTION_RECORDS_COLLECTION), data.inductionRecord);
            const contractorRef = doc(db, CONTRACTORS_COLLECTION, data.contractorId);
            await updateDoc(contractorRef, {
                inductionCompleted: true,
                inductionDate: data.inductionRecord.inductionDate,
            });
            return inductionRef;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, user?.uid] });
        },
        onError: (error: Error) => {
             toast({
                title: 'Error Saving Induction',
                description: "An unexpected error occurred. Please try again or contact support.",
                variant: 'destructive',
            });
        }
    });

    const onSubmit = (data: InductionFormValues) => {
        let score = 0;
        const answers = [data.q1, data.q2, data.q3, data.q4];
        answers.forEach((answer, index) => {
            if (answer === quizQuestions[index].correct) {
                score++;
            }
        });

        const passingScore = 3;
        if (score >= passingScore) {
            const selectedContractor = contractors.find(c => c.id === data.contractorId);
            if (!selectedContractor) {
                toast({ title: 'Error', description: 'Selected company not found.', variant: 'destructive'});
                return;
            }

            const inductionRecordData: Omit<InductionRecord, 'id'> = {
                userId: user?.uid || "unknown",
                organizationId: user?.uid || "unknown", // Placeholder until org is fully implemented
                contractorId: data.contractorId,
                contractorName: selectedContractor.companyName,
                traineeName: data.traineeName,
                inductionDate: new Date().toISOString(),
                quizAnswers: quizQuestions.map(q => ({ questionId: q.id, answer: data[q.id as keyof InductionFormValues] }))
            };

            recordInductionMutation.mutate({ inductionRecord: inductionRecordData, contractorId: data.contractorId }, {
                onSuccess: () => {
                     toast({
                        title: `Induction Passed! (Score: ${score}/${quizQuestions.length})`,
                        description: `Thank you, ${data.traineeName}. Your safety induction for ${selectedContractor.companyName} is now complete.`,
                        variant: 'default',
                        duration: 10000,
                    });
                    router.push('/contractor-safety');
                }
            });

        } else {
             toast({
                title: `Induction Failed (Score: ${score}/${quizQuestions.length})`,
                description: 'You did not meet the passing score. Please review the material and retake the quiz.',
                variant: 'destructive',
                duration: 10000,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Site Safety Rules & Quiz</CardTitle>
                <CardDescription>Please read the following safety information carefully before taking the quiz.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="prose dark:prose-invert max-w-none mb-6 p-4 border rounded-md">
                    <h3>General Safety Rules</h3>
                    <ul>
                        <li>All personnel must sign in upon arrival and sign out upon departure.</li>
                        <li>High-visibility clothing is mandatory at all times in operational areas.</li>
                        <li>Safety helmets and safety footwear are required outside of designated office areas.</li>
                        <li>Report all incidents, injuries, and near misses immediately to your site supervisor.</li>
                        <li>Follow all posted safety signs and warnings.</li>
                    </ul>
                    <h3>Emergency Procedures</h3>
                    <p>Upon hearing a continuous fire alarm, cease all work and evacuate to the designated assembly point via the nearest safe route. Do not use lifts. Upon discovering a fire, activate the nearest fire alarm call point.</p>
                    <h3>Permit-to-Work</h3>
                    <p>A valid Permit-to-Work is required for all high-risk activities, including but not limited to: hot work (welding, cutting, grinding), confined space entry, and electrical work on live systems. Do not commence work without a fully authorized permit.</p>
                    <h3>Housekeeping</h3>
                    <p>You are responsible for maintaining a clean and tidy work area. All tools, equipment, and waste materials must be properly stored or disposed of, ensuring walkways and access routes remain clear.</p>
                </div>
                
                <Separator/>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contractorId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Your Company</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select your company..." /></SelectTrigger></FormControl>
                                            <SelectContent>{contractors.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="traineeName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Full Name</FormLabel>
                                        <FormControl><Input placeholder="Enter your name" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Card>
                            <CardHeader><CardTitle>Induction Quiz</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                {quizQuestions.map((q, index) => (
                                    <FormField
                                        key={q.id}
                                        control={form.control}
                                        name={q.id as keyof InductionFormValues}
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>{index + 1}. {q.text}</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                                        {quizOptions[q.id].map(opt => (
                                                            <FormItem key={opt.value} className="flex items-center space-x-3 space-y-0">
                                                                <FormControl><RadioGroupItem value={opt.value} /></FormControl>
                                                                <FormLabel className="font-normal">{opt.label}</FormLabel>
                                                            </FormItem>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        <Button type="submit" className="w-full" disabled={recordInductionMutation.isPending}>
                            {recordInductionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Submit Quiz & Complete Induction
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
