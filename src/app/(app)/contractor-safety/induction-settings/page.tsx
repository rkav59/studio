
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { InductionQuestion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, ArrowLeft, Settings, Edit, Trash, HelpCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { InductionQuestionForm } from '@/components/contractor-safety/induction-question-form';

const INDUCTION_QUESTIONS_COLLECTION = 'inductionQuestions';

export default function InductionSettingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<InductionQuestion | null>(null);

    const { data: questions = [], isLoading, error } = useQuery<InductionQuestion[]>({
        queryKey: [INDUCTION_QUESTIONS_COLLECTION, user?.uid],
        queryFn: async () => {
            if (!user?.uid) return [];
            const q = query(collection(db, INDUCTION_QUESTIONS_COLLECTION), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InductionQuestion));
        },
        enabled: !!user?.uid,
    });

    const addMutation = useMutation({
        mutationFn: async (newQuestion: Omit<InductionQuestion, 'id' | 'userId'>) => {
            if (!user?.uid) throw new Error("User not authenticated");
            return addDoc(collection(db, INDUCTION_QUESTIONS_COLLECTION), { ...newQuestion, userId: user.uid });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [INDUCTION_QUESTIONS_COLLECTION, user?.uid] });
            toast({ title: "Question Added", description: "The new induction question has been saved." });
            setIsFormOpen(false);
            setEditingQuestion(null);
        },
        onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
    
    const updateMutation = useMutation({
        mutationFn: async (questionToUpdate: InductionQuestion) => {
            const { id, ...data } = questionToUpdate;
            await updateDoc(doc(db, INDUCTION_QUESTIONS_COLLECTION, id), data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [INDUCTION_QUESTIONS_COLLECTION, user?.uid] });
            toast({ title: "Question Updated", description: "The induction question has been updated." });
            setIsFormOpen(false);
            setEditingQuestion(null);
        },
        onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: (questionId: string) => deleteDoc(doc(db, INDUCTION_QUESTIONS_COLLECTION, questionId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [INDUCTION_QUESTIONS_COLLECTION, user?.uid] });
            toast({ title: "Question Deleted" });
        },
        onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const handleSaveQuestion = (data: Omit<InductionQuestion, 'id' | 'userId'>) => {
        if (editingQuestion) {
            updateMutation.mutate({ ...editingQuestion, ...data });
        } else {
            addMutation.mutate(data);
        }
    };

    if (isLoading) return <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="text-red-500">Error loading questions: {error.message}</div>;

    if (isFormOpen) {
        return <InductionQuestionForm 
            initialData={editingQuestion} 
            onSave={handleSaveQuestion} 
            onCancel={() => { setIsFormOpen(false); setEditingQuestion(null); }}
            isSubmitting={addMutation.isPending || updateMutation.isPending}
        />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/contractor-safety')} aria-label="Back to Contractor Safety"><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Settings className="h-6 w-6 text-primary" /> Contractor Induction Setup
                    </h1>
                </div>
                 <Button onClick={() => { setEditingQuestion(null); setIsFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>Add Question</Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Induction Quiz Questions</CardTitle>
                    <CardDescription>Manage the questions for the contractor online induction quiz. These questions will replace the default set.</CardDescription>
                </CardHeader>
                <CardContent>
                    {questions.length > 0 ? (
                        <div className="space-y-3">
                            {questions.map((q, index) => (
                                <Card key={q.id} className="p-4 flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{index + 1}. {q.text}</p>
                                        <ul className="text-sm text-muted-foreground list-disc list-inside pl-4 mt-1">
                                            {q.options.map(opt => (
                                                <li key={opt.id} className={cn(q.correctAnswerId === opt.id && "font-semibold text-green-600")}>{opt.text} {q.correctAnswerId === opt.id && "(Correct)"}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingQuestion(q); setIsFormOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash className="h-4 w-4"/></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the question: "{q.text.substring(0, 50)}...". This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteMutation.mutate(q.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <HelpCircle className="mx-auto h-8 w-8 mb-2"/>
                            <p>No custom questions found.</p>
                            <p className="text-xs">If no custom questions are set up, the system will not present a quiz until they are added.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
