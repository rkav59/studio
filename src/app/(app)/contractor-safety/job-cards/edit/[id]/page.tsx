
"use client";

import { useRouter, useParams } from 'next/navigation';
import { JobCardForm, type JobCardFormValues } from "@/components/contractor-safety/job-card-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseISO } from 'date-fns';
import type { JobCard, Contractor } from '@/lib/types';
import { ArrowLeft, ClipboardCheck, Loader2 } from 'lucide-react';

const JOB_CARDS_COLLECTION = 'jobCards';
const CONTRACTORS_COLLECTION = 'contractors';

export default function EditJobCardPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const jobCardId = params.id as string;

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

  const { data: jobCardToEdit, isLoading: isLoadingJobCard, error: jobCardError } = useQuery<JobCard | null>({
    queryKey: [JOB_CARDS_COLLECTION, jobCardId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !jobCardId) return null;
      const jobCardRef = doc(db, JOB_CARDS_COLLECTION, jobCardId);
      const jobCardSnap = await getDoc(jobCardRef);
      if (jobCardSnap.exists() && jobCardSnap.data().userId === user.uid) {
        const data = jobCardSnap.data();
        return { 
          id: jobCardSnap.id, 
          ...data,
          workDate: (data.workDate as Timestamp)?.toDate().toISOString(),
        } as JobCard;
      }
      return null;
    },
    enabled: !!user?.uid && !!jobCardId,
  });

  const updateJobCardMutation = useMutation({
    mutationFn: async (updatedJobCardData: Omit<JobCard, 'id' | 'userId'>) => {
      if (!user?.uid || !jobCardId) throw new Error("Missing user or Job Card ID.");
      const jobCardRef = doc(db, JOB_CARDS_COLLECTION, jobCardId);
      const dataForDb = {
        ...updatedJobCardData,
        userId: user.uid,
        workDate: Timestamp.fromDate(parseISO(updatedJobCardData.workDate)),
      };
      await updateDoc(jobCardRef, dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOB_CARDS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [JOB_CARDS_COLLECTION, jobCardId, user?.uid] });
      toast({ title: "Job Card Updated", description: `Job Card "${jobCardToEdit?.jobCardNumber || ''}" has been successfully updated.` });
      router.push('/contractor-safety');
    },
    onError: (error: Error) => {
      toast({ title: "Error Updating Job Card", description: "An unexpected error occurred.", variant: "destructive" });
    },
  });

  const handleSaveJobCard = (data: JobCardFormValues) => {
    updateJobCardMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/contractor-safety');
  };

  if (isLoadingContractors || isLoadingJobCard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
      </div>
    );
  }

  if (contractorsError || jobCardError || !jobCardToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Job Card Not Found</CardTitle></CardHeader>
          <CardContent><p>The Job Card could not be found or you don't have permission to edit it.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Contractor Safety">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <ClipboardCheck className="h-6 w-6 text-indigo-500" /> Edit Job Card: {jobCardToEdit.jobCardNumber}
            </h1>
        </div>
      <JobCardForm 
        contractors={contractors}
        initialData={jobCardToEdit}
        onSave={handleSaveJobCard} 
        onCancel={handleCancel}
        isSubmitting={updateJobCardMutation.isPending}
      />
    </div>
  );
}
