
"use client";

import { useRouter, useParams } from 'next/navigation';
import { MedicalTestForm, type MedicalTestFormValues } from "@/components/health-monitoring/medical-test-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SimilarExposureGroup, MedicalTestRecord } from '@/lib/types';
import { parseISO, format } from 'date-fns';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const MEDICAL_TESTS_COLLECTION = 'medicalTestRecords';
const SEGS_COLLECTION = 'similarExposureGroups';

export default function EditMedicalTestPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const recordId = params.id as string;

  const { data: segs = [], isLoading: isLoadingSegs, error: segsError } = useQuery<SimilarExposureGroup[]>({
    queryKey: [SEGS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, SEGS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SimilarExposureGroup));
    },
    enabled: !!user?.uid,
  });

  const { data: recordToEdit, isLoading: isLoadingRecord, error: recordError } = useQuery<MedicalTestRecord | null>({
    queryKey: [MEDICAL_TESTS_COLLECTION, recordId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !recordId) return null;
      const recordRef = doc(db, MEDICAL_TESTS_COLLECTION, recordId);
      const recordSnap = await getDoc(recordRef);
      if (recordSnap.exists() && recordSnap.data().userId === user.uid) {
        const data = recordSnap.data();
        return { 
          id: recordSnap.id, 
          ...data,
          testDate: (data.testDate as Timestamp)?.toDate().toISOString(),
          certificateExpiryDate: data.certificateExpiryDate ? (data.certificateExpiryDate as Timestamp).toDate().toISOString() : null,
        } as MedicalTestRecord;
      }
      return null;
    },
    enabled: !!user?.uid && !!recordId,
  });

  const updateMedicalTestMutation = useMutation({
    mutationFn: async (updatedRecordData: MedicalTestRecord) => { 
      if (!user?.uid || !updatedRecordData.id) throw new Error("User or record ID missing.");
      const { id, ...dataToUpdate } = updatedRecordData; 
      const recordRef = doc(db, MEDICAL_TESTS_COLLECTION, id);
      const dataForDb = { 
        ...dataToUpdate, 
        userId: user.uid, 
        testDate: Timestamp.fromDate(parseISO(dataToUpdate.testDate as string)),
        certificateExpiryDate: dataToUpdate.certificateExpiryDate ? Timestamp.fromDate(parseISO(dataToUpdate.certificateExpiryDate as string)) : null,
      };
      await updateDoc(recordRef, dataForDb); 
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MEDICAL_TESTS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [MEDICAL_TESTS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Medical Test Updated", description: `Record for "${variables.employeeName}" has been updated.` });
      router.push('/health-monitoring');
    },
    onError: (e: Error) => toast({ title: "Error Updating Medical Test", description: e.message, variant: "destructive" }),
  });

  const handleSaveMedicalTest = (formData: MedicalTestFormValues) => {
    if (!recordToEdit) return;
    const recordDataToSave: MedicalTestRecord = {
      ...recordToEdit, 
      ...formData,
      testDate: parseISO(formData.testDate).toISOString(), 
      certificateExpiryDate: formData.certificateExpiryDate ? parseISO(formData.certificateExpiryDate).toISOString() : null,
    };
    updateMedicalTestMutation.mutate(recordDataToSave);
  };

  const handleCancel = () => {
    router.push('/health-monitoring');
  };

  if (isLoadingSegs || isLoadingRecord) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent>
        </Card>
      </div>
    );
  }

  if (segsError || recordError || !recordToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Medical Test Record Not Found</CardTitle></CardHeader>
          <CardContent><p>{segsError?.message || recordError?.message || "The Medical Test record could not be found or you don't have permission to edit it."}</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Health Monitoring">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <ShieldCheck className="h-6 w-6 text-teal-500" /> Edit Medical Test Record: {recordToEdit.employeeName}
            </h1>
        </div>
      <Card className="shadow-lg">
         <CardHeader>
          <CardDescription>
            Modify the details for this Medical Test/Screening Record.
          </CardDescription>
        </CardHeader>
        <MedicalTestForm 
            segs={segs}
            initialData={recordToEdit} 
            onSave={handleSaveMedicalTest} 
            onCancel={handleCancel}
            isEditing={true}
            isSubmitting={updateMedicalTestMutation.isPending}
        />
      </Card>
    </div>
  );
}
