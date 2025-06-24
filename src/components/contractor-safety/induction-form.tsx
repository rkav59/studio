
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
    { id: 'q5', text: 'When is a safety harness required for working at height?', correct: 'all_work_at_height'},
    { id: 'q6', text: 'What should you do if you witness an incident, even if no one is hurt (a near miss)?', correct: 'report_immediately'},
    { id: 'q7', text: 'You notice a small, manageable oil leak from your equipment. What is the correct action?', correct: 'contain_report'},
    { id: 'q8', text: 'What is the immediate consequence of violating a critical safety rule like bypassing a guard?', correct: 'stop_work'}
];

const quizOptions: Record<string, { value: string; label: string }[]> = {
    q1: [ { value: 'finish_task', label: 'Finish the current task quickly' }, { value: 'evacuate', label: 'Evacuate immediately via the nearest safe exit' }, { value: 'find_source', label: 'Look for the source of the alarm' } ],
    q2: [ { value: 'drilling', label: 'Drilling into concrete' }, { value: 'welding', label: 'Welding or using an angle grinder' }, { value: 'painting', label: 'Painting with a brush' } ],
    q3: [ { value: 'cleaner', label: 'The designated cleaning staff' }, { value: 'supervisor', label: 'Your supervisor' }, { value: 'self', label: 'You are responsible for your own work area' } ],
    q4: [ { value: 'night_only', label: 'Only during hours of darkness' }, { value: 'all_times', label: 'At all times while on site, outside of office areas' }, { value: 'when_remember', label: 'When you remember to put it on' } ],
    q5: [ { value: 'over_3_meters', label: 'Only when working above 3 meters' }, { value: 'all_work_at_height', label: 'For all work at height where there is a risk of falling' }, { value: 'if_feel_unsafe', label: 'Only if you feel unsafe' } ],
    q6: [ { value: 'ignore_it', label: 'Ignore it, as no one was hurt' }, { value: 'discuss_with_colleague', label: 'Discuss it with a colleague to see what they think' }, { value: 'report_immediately', label: 'Report it to your supervisor immediately' } ],
    q7: [ { value: 'ignore_it_small', label: 'Ignore it because it\'s small' }, { value: 'contain_report', label: 'Contain the spill with a spill kit and report it to your supervisor' }, { value: 'wash_it_away', label: 'Wash it away with water into a drain' } ],
    q8: [ { value: 'a_warning', label: 'A verbal warning at the end of the day' }, { value: 'stop_work', label: 'Immediate stoppage of work and removal from the task' }, { value: 'a_fine', label: 'A fine deducted from your payment' } ],
};

const formSchema = z.object({
  contractorId: z.string({ required_error: "Please select your company." }),
  traineeName: z.string().min(2, "Please enter your full name."),
  q1: z.string({ required_error: "Please answer question 1." }),
  q2: z.string({ required_error: "Please answer question 2." }),
  q3: z.string({ required_error: "Please answer question 3." }),
  q4: z.string({ required_error: "Please answer question 4." }),
  q5: z.string({ required_error: "Please answer question 5." }),
  q6: z.string({ required_error: "Please answer question 6." }),
  q7: z.string({ required_error: "Please answer question 7." }),
  q8: z.string({ required_error: "Please answer question 8." }),
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
        const answers = [data.q1, data.q2, data.q3, data.q4, data.q5, data.q6, data.q7, data.q8];
        answers.forEach((answer, index) => {
            if (answer === quizQuestions[index].correct) {
                score++;
            }
        });

        const passingScore = 7;
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
                description: `You did not meet the passing score of ${passingScore}/${quizQuestions.length}. Please review the material and retake the quiz.`,
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
                <div className="prose dark:prose-invert max-w-none mb-6 p-4 border rounded-md bg-secondary/30">
                    <h3>1. Introduction & Site Entry</h3>
                    <p>Welcome to our site. Your safety is our top priority. All contractors and visitors must complete this induction before commencing any work. Upon arrival, all personnel must sign in at the security gate or main office and sign out upon departure. This is critical for emergency accountability.</p>
                    
                    <h3>2. General Site Safety Rules</h3>
                    <ul>
                        <li><strong>Personal Protective Equipment (PPE):</strong> Hard hats, high-visibility clothing, and safety footwear are mandatory in all operational areas. Additional task-specific PPE (e.g., gloves, safety glasses, hearing protection) must be used as required by your risk assessment.</li>
                        <li><strong>Safe Conduct:</strong> Running, horseplay, and operating any equipment without authorization are strictly prohibited.</li>
                        <li><strong>Mobile Phones:</strong> Use of mobile phones is forbidden in operational areas and while operating machinery. Move to a designated safe area for calls.</li>
                        <li><strong>Incident Reporting:</strong> Report ALL incidents, injuries, and near misses to your site supervisor immediately, no matter how minor they seem.</li>
                        <li><strong>Signage:</strong> Obey all safety signs and warnings. Do not enter restricted areas without authorization.</li>
                    </ul>

                    <h3>3. High-Risk Work Requirements</h3>
                    <p>All high-risk activities require a specific Permit-to-Work (PTW) issued by an authorized person before work begins. This includes, but is not limited to:</p>
                    <ul>
                        <li><strong>Hot Work:</strong> Any work involving flames or sparks (welding, cutting, grinding). A designated fire watch and appropriate fire extinguishers are required.</li>
                        <li><strong>Confined Space Entry:</strong> Entry into any space with limited access and potential for hazardous atmospheres requires a specific permit, atmospheric testing, and a standby person.</li>
                        <li><strong>Working at Height:</strong> Any work where a fall is possible requires a risk assessment and appropriate fall protection (e.g., scaffolding with guardrails, fall arrest harnesses). Mobile elevated work platforms (MEWPs) must only be operated by trained and certified personnel.</li>
                        <li><strong>Excavations:</strong> No excavation shall begin without a permit and underground service clearance. Shoring or benching is required for excavations deeper than 1.2 meters.</li>
                    </ul>

                    <h3>4. Emergency Procedures</h3>
                    <ul>
                        <li><strong>Fire:</strong> Upon discovering a fire, activate the nearest fire alarm. Upon hearing a continuous alarm, cease all work and evacuate immediately to the designated assembly point via the nearest safe exit. Do not use lifts.</li>
                        <li><strong>Medical Emergency:</strong> Contact your site supervisor or the designated first aider immediately. Do not move an injured person unless they are in immediate danger.</li>
                        <li><strong>Spills:</strong> In case of a chemical or oil spill, contain the spill using the nearest spill kit if safe to do so. Report it to your supervisor immediately.</li>
                    </ul>

                    <h3>5. Environmental & Housekeeping</h3>
                    <p>You are responsible for maintaining a clean and tidy work area. All tools, equipment, and waste materials must be properly segregated and disposed of in the designated bins. Ensure walkways and access routes remain clear of obstructions at all times to prevent trip hazards.</p>
                    
                     <h3>6. Consequences of Non-Compliance</h3>
                    <p>Violation of site safety rules, especially critical rules related to high-risk work, will result in immediate stoppage of work and may lead to removal from the site. Your safety and the safety of others is our collective responsibility.</p>
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
