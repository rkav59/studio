
"use client";

import { useRouter } from 'next/navigation';
import { TrainingRecordForm, type TrainingRecordFormValues } from "@/components/training-competence/training-record-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TrainingCourse, TrainingRecord, TrainingRecordStatus, TrainingJobRoleMatrixEntry } from '@/lib/types';
import { parseISO } from 'date-fns';
import { ArrowLeft, UserCheck } from 'lucide-react';

const COURSES_COLLECTION = 'trainingCourses';
const RECORDS_COLLECTION = 'trainingRecords';
const TRAINING_JOB_ROLE_MATRIX_COLLECTION = 'trainingJobRoleMatrix';

export default function NewTrainingRecordPage() {
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
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as TrainingCourse));
    },
    enabled: !!user?.uid,
  });

  const { data: trainingJobRoleMatrix = [], isLoading: isLoadingJobRoleMatrix, error: jobRoleMatrixError } = useQuery<TrainingJobRoleMatrixEntry[]>({
    queryKey: [TRAINING_JOB_ROLE_MATRIX_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, TRAINING_JOB_ROLE_MATRIX_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingJobRoleMatrixEntry));
    },
    enabled: !!user?.uid,
  });

  const addRecordMutation = useMutation({
    mutationFn: async (recordData: {
        employeeName: string;
        jobRole?: string;
        courseId: string;
        trainingDate: string; // ISO string
        expiryDate: string | null; // ISO string or null
        trainer?: string;
        status: 'Planned' | 'Completed';
        certificateUrl?: string;
        notes?: string;
    }) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...recordData,
        userId: user.uid,
        trainingDate: Timestamp.fromDate(parseISO(recordData.trainingDate)),
        expiryDate: recordData.expiryDate ? Timestamp.fromDate(parseISO(recordData.expiryDate)) : null,
      };
      return addDoc(collection(db, RECORDS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_COLLECTION, user?.uid] });
      toast({ title: "Training Record Created", description: "The new training record has been added." });
      router.push('/training-competence');
    },
    onError: (e: Error) => toast({ title: "Error Creating Record", description: e.message, variant: "destructive" }),
  });

  // Adjusted to match the form's expectation for onSave
  const handleSaveRecord = (data: Omit<TrainingRecord, 'id' | 'status' | 'userId'>, currentFormStatus: TrainingRecordStatus) => {
    // The 'status' here is the one selected in the form ('Planned' or 'Completed')
    // The actual derived status ('Expired', 'Requires Renewal') is for display only.
    addRecordMutation.mutate({ ...data, status: currentFormStatus });
  };


  const handleCancel = () => {
    router.push('/training-competence');
  };

  if (isLoadingCourses || isLoadingJobRoleMatrix) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-0">
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (coursesError || jobRoleMatrixError) {
     return <div className="text-red-500 text-center py-10">Error loading data: {coursesError?.message || jobRoleMatrixError?.message}</div>;
  }
  
  if (courses.length === 0 && !isLoadingCourses) {
    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Training & Competence">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <UserCheck className="h-6 w-6 text-accent" /> Add New Training Record
                </h1>
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Cannot Add Record</CardTitle>
                    <CardDescription>There are no courses defined in the catalog. Please add a course before logging a training record.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/training-competence/courses/new')}>Add New Course</Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Training & Competence">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <UserCheck className="h-6 w-6 text-accent" /> Add New Training Record
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Select a course and enter the employee's training details.
          </CardDescription>
        </CardHeader>
        <TrainingRecordForm 
          courses={courses}
          trainingJobRoleMatrix={trainingJobRoleMatrix}
          onSave={handleSaveRecord} 
          onCancel={handleCancel}
          isSubmitting={addRecordMutation.isPending}
        />
      </Card>
    </div>
  );
}
