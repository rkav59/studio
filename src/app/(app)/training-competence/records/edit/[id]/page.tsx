"use client";

import { useRouter, useParams } from 'next/navigation';
import { TrainingRecordForm, type TrainingRecordFormValues } from "@/components/training-competence/training-record-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TrainingCourse, TrainingRecord, TrainingRecordStatus } from '@/lib/types';
import { parseISO, format } from 'date-fns';
import { ArrowLeft, UserCheck } from 'lucide-react';

const COURSES_COLLECTION = 'trainingCourses';
const RECORDS_COLLECTION = 'trainingRecords';

export default function EditTrainingRecordPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const recordId = params.id as string;

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

  const { data: recordToEdit, isLoading: isLoadingRecord, error: recordError } = useQuery<TrainingRecord | null>({
    queryKey: [RECORDS_COLLECTION, recordId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !recordId) return null;
      const recordRef = doc(db, RECORDS_COLLECTION, recordId);
      const recordSnap = await getDoc(recordRef);
      if (recordSnap.exists() && recordSnap.data().userId === user.uid) {
        const data = recordSnap.data();
        return { 
          id: recordSnap.id, 
          ...data,
          trainingDate: (data.trainingDate as Timestamp)?.toDate().toISOString(),
          expiryDate: data.expiryDate ? (data.expiryDate as Timestamp).toDate().toISOString() : null,
        } as TrainingRecord;
      }
      return null;
    },
    enabled: !!user?.uid && !!recordId,
  });

  const updateRecordMutation = useMutation({
    mutationFn: async (updatedRecordData: TrainingRecord) => {
      if (!user?.uid || !updatedRecordData.id) throw new Error("Missing user or record ID.");
      const { id, ...dataToUpdate } = updatedRecordData;
      const recordRef = doc(db, RECORDS_COLLECTION, id);
      const dataForDb = {
        ...dataToUpdate,
        userId: user.uid, 
        trainingDate: Timestamp.fromDate(parseISO(dataToUpdate.trainingDate as string)),
        expiryDate: dataToUpdate.expiryDate ? Timestamp.fromDate(parseISO(dataToUpdate.expiryDate as string)) : null,
      };
      await updateDoc(recordRef, dataForDb);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [RECORDS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Record Updated", description: `Training record for ${variables.employeeName} has been updated.` });
      router.push('/training-competence');
    },
    onError: (e: Error) => toast({ title: "Error Updating Record", description: e.message, variant: "destructive" }),
  });

  const handleSaveRecord = (formData: Omit<TrainingRecord, 'id' | 'status' | 'userId'>, currentFormStatus: TrainingRecordStatus) => {
    if (!recordToEdit) return;
    const recordDataToSave: TrainingRecord = {
        ...recordToEdit, // Spread existing data like id and userId
        ...formData, // Spread form values
        status: currentFormStatus, // Use the status from the form
    };
    updateRecordMutation.mutate(recordDataToSave);
  };

  const handleCancel = () => {
    router.push('/training-competence');
  };

  if (isLoadingCourses || isLoadingRecord) {
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

  if (coursesError || recordError || !recordToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Training Record Not Found</CardTitle></CardHeader>
          <CardContent><p>{coursesError?.message || recordError?.message || "The record could not be found or you don't have permission to edit it."}</p></CardContent>
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
                 <UserCheck className="h-6 w-6 text-accent" /> Edit Training Record: {recordToEdit.employeeName}
            </h1>
        </div>
      <Card className="shadow-lg">
         <CardHeader>
          <CardDescription>
            Modify the details for this training record.
          </CardDescription>
        </CardHeader>
        <TrainingRecordForm 
            courses={courses}
            initialData={recordToEdit} 
            onSave={handleSaveRecord} 
            onCancel={handleCancel}
            isSubmitting={updateRecordMutation.isPending}
        />
      </Card>
    </div>
  );
}
