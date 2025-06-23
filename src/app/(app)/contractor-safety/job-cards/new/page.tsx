
"use client";

import { useRouter } from 'next/navigation';
import { JobCardForm, type JobCardFormValues } from "@/components/contractor-safety/job-card-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JobCard, Contractor } from '@/lib/types';
import { ArrowLeft, ClipboardCheck, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { parseISO } from 'date-fns';

const JOB_CARDS_COLLECTION = 'jobCards';
const CONTRACTORS_COLLECTION = 'contractors';

export default function NewJobCardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contractors = [], isLoading: isLoadingContractors, error: contractorsError } = useQuery<Contractor[]>({
    queryKey: [CONTRACTORS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, CONTRACTORS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Contractor));
    },
    enabled: !!user?.uid,
  });

  const addJobCardMutation = useMutation({
    mutationFn: async (newJobCardData: Omit<JobCard, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newJobCardData,
        userId: user.uid,
        workDate: Timestamp.fromDate(parseISO(newJobCardData.workDate)),
      };
      return addDoc(collection(db, JOB_CARDS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOB_CARDS_COLLECTION, user?.uid] });
      toast({ title: "Job Card Created", description: "The new job card has been successfully created." });
      router.push('/contractor-safety');
    },
    onError: (e: Error) => toast({ title: "Error Creating Job Card", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveJobCard = (data: JobCardFormValues) => {
    addJobCardMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/contractor-safety');
  };
  
  if (isLoadingContractors) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
      </div>
    );
  }

  if (contractorsError) {
     return <div className="text-red-500 text-center py-10">Error loading contractors. Please try again later.</div>;
  }
  
  if (contractors.length === 0 && !isLoadingContractors) {
    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Contractor Safety"><ArrowLeft className="h-4 w-4" /></Button>
            </div>
            <Card>
                <CardHeader><CardTitle>Cannot Create Job Card</CardTitle><CardDescription>There are no contractors registered. Please add a contractor before creating a Job Card.</CardDescription></CardHeader>
                <CardContent><Button onClick={() => router.push('/contractor-safety/contractors/new')}>Add Contractor</Button></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Contractor Safety"><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <ClipboardCheck className="h-6 w-6 text-indigo-500" /> Create New Job Card
            </h1>
        </div>
      <JobCardForm 
        contractors={contractors} 
        onSave={handleSaveJobCard} 
        onCancel={handleCancel}
        isSubmitting={addJobCardMutation.isPending}
      />
    </div>
  );
}
