
"use client";

import { useRouter, useParams } from 'next/navigation';
import { TrainingJobRoleMatrixForm, type TrainingJobRoleMatrixFormValues } from "@/components/training-competence/training-job-role-matrix-form";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TrainingCourse, TrainingJobRoleMatrixEntry } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Briefcase } from 'lucide-react';

const TRAINING_JOB_ROLE_MATRIX_COLLECTION = 'trainingJobRoleMatrix';
const COURSES_COLLECTION = 'trainingCourses';

export default function EditTrainingJobRoleMatrixPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const entryId = params.id as string;

  const { data: courses = [], isLoading: isLoadingCourses, error: coursesError } = useQuery<TrainingCourse[]>({
    queryKey: [COURSES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, COURSES_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingCourse));
    },
    enabled: !!user?.uid,
  });

  const { data: entryToEdit, isLoading: isLoadingEntry, error: entryError } = useQuery<TrainingJobRoleMatrixEntry | null>({
    queryKey: [TRAINING_JOB_ROLE_MATRIX_COLLECTION, entryId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !entryId) return null;
      const entryRef = doc(db, TRAINING_JOB_ROLE_MATRIX_COLLECTION, entryId);
      const entrySnap = await getDoc(entryRef);
      if (entrySnap.exists() && entrySnap.data().userId === user.uid) {
        return { id: entrySnap.id, ...entrySnap.data() } as TrainingJobRoleMatrixEntry;
      }
      return null;
    },
    enabled: !!user?.uid && !!entryId,
  });

  const updateJobRoleEntryMutation = useMutation({
    mutationFn: async (entryToUpdate: TrainingJobRoleMatrixEntry) => {
      if (!user?.uid || !entryToUpdate.id) throw new Error("Missing user or entry ID.");
      const { id, ...data } = entryToUpdate;
      const dataForFirestore = { ...data, userId: user.uid };
      await updateDoc(doc(db, TRAINING_JOB_ROLE_MATRIX_COLLECTION, id), dataForFirestore);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TRAINING_JOB_ROLE_MATRIX_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [TRAINING_JOB_ROLE_MATRIX_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Job Role Requirements Updated", description: `Requirements for "${variables.jobRole}" updated.` });
      router.push('/training-competence');
    },
    onError: (e: Error) => toast({ title: "Error Updating Job Role", description: e.message, variant: "destructive" }),
  });

  const handleSaveJobRoleEntry = (data: TrainingJobRoleMatrixFormValues) => {
    if (!entryToEdit) return;
    const updatedEntry: TrainingJobRoleMatrixEntry = {
      ...entryToEdit,
      ...data,
    };
    updateJobRoleEntryMutation.mutate(updatedEntry);
  };

  const handleCancel = () => {
    router.push('/training-competence');
  };

  const isLoading = isLoadingCourses || isLoadingEntry;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (entryError || coursesError || !entryToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card><CardHeader><CardTitle>Record Not Found</CardTitle></CardHeader><CardContent><p>The job role could not be found or you don't have permission to edit it.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Training & Competence"><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Briefcase className="h-6 w-6 text-indigo-600" /> Edit Job Role Requirements: {entryToEdit.jobRole}</h1>
      </div>
      <TrainingJobRoleMatrixForm
        courses={courses}
        initialData={entryToEdit}
        onSave={handleSaveJobRoleEntry}
        onCancel={handleCancel}
        isSubmitting={updateJobRoleEntryMutation.isPending}
      />
    </div>
  );
}
