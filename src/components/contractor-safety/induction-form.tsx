
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertTriangle, HelpCircle } from "lucide-react";
import type { Contractor, InductionRecord, InductionQuestion } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from 'next/navigation';

const INDUCTION_RECORDS_COLLECTION = 'inductionRecords';
const CONTRACTORS_COLLECTION = 'contractors';
const INDUCTION_QUESTIONS_COLLECTION = 'inductionQuestions';

// Default content remains for display
const inductionContent = {
    title: 'Site Safety Rules & Quiz',
    description: 'Please read the following safety information carefully before taking the quiz.',
    sections: [
        { title: '1. Introduction & Site Entry', content: 'Welcome to our site. Your safety is our top priority. All contractors and visitors must complete this induction before commencing any work. Upon arrival, all personnel must sign in at the security gate or main office and sign out upon departure. This is critical for emergency accountability.' },
        { title: '2. General Site Safety Rules', items: ['Personal Protective Equipment (PPE): Hard hats, high-visibility clothing, and safety footwear are mandatory in all operational areas. Additional task-specific PPE (e.g., gloves, safety glasses, hearing protection) must be used as required by your risk assessment.', 'Safe Conduct: Running, horseplay, and operating any equipment without authorization are strictly prohibited.', 'Mobile Phones: Use of mobile phones is forbidden in operational areas and while operating machinery. Move to a designated safe area for calls.', 'Incident Reporting: Report ALL incidents, injuries, and near misses to your site supervisor immediately, no matter how minor they seem.', 'Signage: Obey all safety signs and warnings. Do not enter restricted areas without authorization.'] },
        { title: '3. High-Risk Work Requirements', preamble: 'All high-risk activities require a specific Permit-to-Work (PTW) issued by an authorized person before work begins. This includes, but is not limited to:', items: ['Hot Work: Any work involving flames or sparks (welding, cutting, grinding). A designated fire watch and appropriate fire extinguishers are required.', 'Confined Space Entry: Entry into any space with limited access and potential for hazardous atmospheres requires a specific permit, atmospheric testing, and a standby person.', 'Working at Height: Any work where a fall is possible requires a risk assessment and appropriate fall protection (e.g., scaffolding with guardrails, fall arrest harnesses). Mobile elevated work platforms (MEWPs) must only be operated by trained and certified personnel.', 'Excavations: No excavation shall begin without a permit and underground service clearance. Shoring or benching is required for excavations deeper than 1.2 meters.'] },
        { title: '4. Emergency Procedures', items: ['Fire: Upon discovering a fire, activate the nearest fire alarm. Upon hearing a continuous alarm, cease all work and evacuate immediately to the designated assembly point via the nearest safe exit. Do not use lifts.', 'Medical Emergency: Contact your site supervisor or the designated first aider immediately. Do not move an injured person unless they are in immediate danger.', 'Spills: In case of a chemical or oil spill, contain the spill using the nearest spill kit if safe to do so. Report it to your supervisor immediately.'] },
        { title: '5. Environmental & Housekeeping', content: 'You are responsible for maintaining a clean and tidy work area. All tools, equipment, and waste materials must be properly segregated and disposed of in the designated bins. Ensure walkways and access routes remain clear of obstructions at all times to prevent trip hazards.' },
        { title: '6. Consequences of Non-Compliance', content: 'Violation of site safety rules, especially critical rules related to high-risk work, will result in immediate stoppage of work and may lead to removal from the site. Your safety and the safety of others is our collective responsibility.' }
    ]
};

const PASSING_SCORE_PERCENTAGE = 80;


// Base schema for user details
const baseSchema = z.object({
  contractorId: z.string({ required_error: "Please select your company." }),
  traineeName: z.string().min(2, "Please enter your full name."),
});


interface InductionFormProps {
  contractors: Contractor[];
}

export function InductionForm({ contractors }: InductionFormProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<InductionQuestion[]>({
        queryKey: [INDUCTION_QUESTIONS_COLLECTION, user?.uid],
        queryFn: async () => {
            if (!user?.uid) return [];
            const q = query(collection(db, INDUCTION_QUESTIONS_COLLECTION), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InductionQuestion));
        },
        enabled: !!user?.uid,
    });

    // Dynamically generate the Zod schema for the quiz questions
    const dynamicQuizSchema = useMemo(() => {
        const shape: Record<string, z.ZodString> = {};
        if (questions.length > 0) {
            questions.forEach(q => {
                shape[q.id] = z.string({ required_error: `Please answer the question: "${q.text.substring(0, 30)}..."` });
            });
        }
        return z.object(shape);
    }, [questions]);
    
    const formSchema = baseSchema.merge(dynamicQuizSchema);
    type InductionFormValues = z.infer<typeof formSchema>;

    const form = useForm<InductionFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            traineeName: "",
        },
    });

    const recordInductionMutation = useMutation({
        mutationFn: async (data: { inductionRecord: Omit<InductionRecord, 'id'>, contractorId: string }) => {
            if (!user?.uid) throw new Error("User not authenticated.");
            const inductionRef = await addDoc(collection(db, INDUCTION_RECORDS_COLLECTION), { ...data.inductionRecord, userId: user.uid });
            const contractorRef = doc(db, CONTRACTORS_COLLECTION, data.contractorId);
            await updateDoc(contractorRef, { inductionCompleted: true, inductionDate: new Date() }); // Store as Timestamp
            return inductionRef;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, user?.uid] });
        },
        onError: (error: Error) => {
             toast({ title: 'Error Saving Induction', description: "An unexpected error occurred. Please try again or contact support.", variant: 'destructive' });
        }
    });

    const onSubmit = (data: InductionFormValues) => {
        if (questions.length === 0) return;

        let score = 0;
        const quizAnswersForRecord: { questionId: string; answer: string; }[] = [];

        questions.forEach(q => {
            const userAnswerId = data[q.id as keyof InductionFormValues];
            if (userAnswerId === q.correctAnswerId) {
                score++;
            }
            quizAnswersForRecord.push({ questionId: q.id, answer: userAnswerId });
        });

        const passingScore = Math.ceil((PASSING_SCORE_PERCENTAGE / 100) * questions.length);
        if (score >= passingScore) {
            const selectedContractor = contractors.find(c => c.id === data.contractorId);
            if (!selectedContractor) {
                toast({ title: 'Error', description: 'Selected company not found.', variant: 'destructive'});
                return;
            }

            const inductionRecordData: Omit<InductionRecord, 'id'> = {
                userId: user?.uid || "unknown",
                organizationId: user?.uid || "unknown",
                contractorId: data.contractorId,
                contractorName: selectedContractor.companyName,
                traineeName: data.traineeName,
                inductionDate: new Date().toISOString(),
                quizAnswers: quizAnswersForRecord
            };

            recordInductionMutation.mutate({ inductionRecord: inductionRecordData, contractorId: data.contractorId }, {
                onSuccess: () => {
                     toast({ title: `Induction Passed! (Score: ${score}/${questions.length})`, description: `Thank you, ${data.traineeName}. Your safety induction for ${selectedContractor.companyName} is now complete.`, variant: 'default', duration: 10000 });
                    router.push('/contractor-safety');
                }
            });

        } else {
             toast({ title: `Induction Failed (Score: ${score}/${questions.length})`, description: `You did not meet the passing score of ${passingScore}/${questions.length}. Please review the material and retake the quiz.`, variant: 'destructive', duration: 10000 });
        }
    };

    if (isLoadingQuestions) {
        return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{inductionContent.title}</CardTitle>
                <CardDescription>{inductionContent.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="prose dark:prose-invert max-w-none mb-6 p-4 border rounded-md bg-secondary/30">
                    {inductionContent.sections.map(section => (
                        <div key={section.title}>
                            <h3>{section.title}</h3>
                            {section.content && <p>{section.content}</p>}
                            {section.preamble && <p>{section.preamble}</p>}
                            {section.items && <ul>{section.items.map((item, index) => <li key={index}>{item}</li>)}</ul>}
                        </div>
                    ))}
                </div>
                
                <Separator/>
                
                {questions.length === 0 ? (
                     <div className="text-center py-10 text-muted-foreground">
                        <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-orange-500"/>
                        <p className="font-semibold">Induction Quiz Not Ready</p>
                        <p className="text-sm">The administrator has not set up any induction questions yet. Please contact them for assistance.</p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="contractorId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Your Company</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your company..." /></SelectTrigger></FormControl>
                                            <SelectContent>{contractors.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="traineeName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Full Name</FormLabel>
                                        <FormControl><Input placeholder="Enter your name" {...field} /></FormControl><FormMessage />
                                    </FormItem>
                                )}/>
                            </div>

                            <Card>
                                <CardHeader><CardTitle>Induction Quiz</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    {questions.map((q, index) => (
                                        <FormField
                                            key={q.id}
                                            control={form.control}
                                            name={q.id as keyof InductionFormValues}
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel>{index + 1}. {q.text}</FormLabel>
                                                    <FormControl>
                                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                                            {q.options.map(opt => (
                                                                <FormItem key={opt.id} className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl><RadioGroupItem value={opt.id} /></FormControl>
                                                                    <FormLabel className="font-normal">{opt.text}</FormLabel>
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
                )}
            </CardContent>
        </Card>
    );
}
