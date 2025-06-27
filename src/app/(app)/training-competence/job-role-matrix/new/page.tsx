
"use client";

import { useRouter } from 'next/navigation';
import { TrainingJobRoleMatrixForm, type TrainingJobRoleMatrixFormValues } from "@/components/training-competence/training-job-role-matrix-form";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TrainingCourse, TrainingJobRoleMatrixEntry } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TRAINING_JOB_ROLE_MATRIX_COLLECTION = 'trainingJobRoleMatrix';
const COURSES_COLLECTION = 'trainingCourses';

export default function NewTrainingJobRoleMatrixPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const addJobRoleEntryMutation = useMutation({
    mutationFn: (newEntryData: Omit<TrainingJobRoleMatrixEntry, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataToSave = { ...newEntryData, userId: user.uid };
      return addDoc(collection(db, TRAINING_JOB_ROLE_MATRIX_COLLECTION), dataToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRAINING_JOB_ROLE_MATRIX_COLLECTION, user?.uid] });
      toast({ title: "Job Role Requirements Defined", description: "The new job role matrix entry has been saved." });
      router.push('/training-competence');
    },
    onError: (e: Error) => toast({ title: "Error Defining Job Role", description: "An unexpected error occurred.", variant: "destructive" }),
  });

  const handleSaveJobRoleEntry = (data: TrainingJobRoleMatrixFormValues) => {
    addJobRoleEntryMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/training-competence');
  };

  if (isLoadingCourses) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (coursesError) {
    return <div className="text-red-500 text-center py-10">Error loading courses. Please try again later.</div>;
  }

  if (courses.length === 0 && !isLoadingCourses) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4"><Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Training & Competence"><ArrowLeft className="h-4 w-4" /></Button></div>
        <Card><CardHeader><CardTitle>Cannot Define Job Role</CardTitle><CardDescription>There are no courses in the catalog. Please add courses before defining job role requirements.</CardDescription></CardHeader>
          <CardContent><Button onClick={() => router.push('/training-competence/courses/new')}>Add New Course</Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Training & Competence"><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Briefcase className="h-6 w-6 text-indigo-600" /> Define New Job Role Requirements</h1>
      </div>
      <TrainingJobRoleMatrixForm
        courses={courses}
        onSave={handleSaveJobRoleEntry}
        onCancel={handleCancel}
        isSubmitting={addJobRoleEntryMutation.isPending}
      />
    </div>
  );
}
