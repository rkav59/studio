
"use client";

import { useRouter, useParams } from 'next/navigation';
import { PpeIssuanceForm, type PpeIssuanceFormValues } from "@/components/ppe-management/ppe-issuance-form";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PpeIssuanceRecord, PpeItem, PpeJobRoleMatrixEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const PPE_ISSUANCES_COLLECTION = 'ppeIssuances';
const PPE_ITEMS_COLLECTION = 'ppeItems';
const PPE_JOB_ROLE_MATRIX_COLLECTION = 'ppeJobRoleMatrix';


export default function EditPpeIssuancePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const issuanceId = params.id as string;

  // Fetch PPE Items
  const { data: ppeItems = [], isLoading: isLoadingPpeItems, error: ppeItemsError } = useQuery<PpeItem[]>({
    queryKey: [PPE_ITEMS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PPE_ITEMS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PpeItem));
    },
    enabled: !!user?.uid,
  });

  // Fetch PPE Job Role Matrix for dropdown
  const { data: ppeJobRoleMatrix = [], isLoading: isLoadingJobRoleMatrix, error: jobRoleMatrixError } = useQuery<PpeJobRoleMatrixEntry[]>({
    queryKey: [PPE_JOB_ROLE_MATRIX_COLLECTION, user?.uid],
    queryFn: async () => {
        if (!user?.uid) return [];
        const q = query(collection(db, PPE_JOB_ROLE_MATRIX_COLLECTION), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PpeJobRoleMatrixEntry));
    },
    enabled: !!user?.uid,
  });


  // Fetch the specific issuance record to edit
  const { data: issuanceToEdit, isLoading: isLoadingIssuance, error: issuanceError } = useQuery<PpeIssuanceRecord | null>({
    queryKey: [PPE_ISSUANCES_COLLECTION, issuanceId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !issuanceId) return null;
      const recordRef = doc(db, PPE_ISSUANCES_COLLECTION, issuanceId);
      const recordSnap = await getDoc(recordRef);
      if (recordSnap.exists() && recordSnap.data().userId === user.uid) {
        const data = recordSnap.data();
        return {
          id: recordSnap.id,
          ...data,
          issuedDate: (data.issuedDate as Timestamp)?.toDate().toISOString(),
          expectedReturnDate: data.expectedReturnDate ? (data.expectedReturnDate as Timestamp).toDate().toISOString() : undefined,
          actualReturnDate: data.actualReturnDate ? (data.actualReturnDate as Timestamp).toDate().toISOString() : undefined,
        } as PpeIssuanceRecord;
      }
      return null;
    },
    enabled: !!user?.uid && !!issuanceId,
  });

  const updateIssuanceMutation = useMutation({
    mutationFn: async (updatedData: PpeIssuanceRecord) => {
      if (!user?.uid || !updatedData.id) throw new Error("User or issuance ID missing.");
      const { id, ...dataToUpdate } = updatedData;
      
      const dataForDb = {
        ...dataToUpdate,
        userId: user.uid,
        issuedDate: Timestamp.fromDate(new Date(dataToUpdate.issuedDate)),
        expectedReturnDate: dataToUpdate.expectedReturnDate ? Timestamp.fromDate(new Date(dataToUpdate.expectedReturnDate)) : null,
        actualReturnDate: dataToUpdate.actualReturnDate ? Timestamp.fromDate(new Date(dataToUpdate.actualReturnDate)) : null,
      };

      const recordRef = doc(db, PPE_ISSUANCES_COLLECTION, issuanceId);
      await updateDoc(recordRef, dataForDb);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PPE_ISSUANCES_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [PPE_ISSUANCES_COLLECTION, issuanceId, user?.uid] });
      toast({ 
        title: "PPE Issuance Updated", 
        description: `Issuance for ${variables.employeeName} has been successfully updated.` 
      });
      router.push('/ppe-management');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error Updating Issuance", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      });
    },
  });


  const handleSaveIssuance = (formData: PpeIssuanceFormValues) => {
     if (!issuanceToEdit || !user?.uid) return;
    
    const dataToSave: PpeIssuanceRecord = {
        id: issuanceToEdit.id,
        userId: user.uid,
        ...formData,
        issuedDate: formData.issuedDate.toISOString(),
        expectedReturnDate: formData.expectedReturnDate ? formData.expectedReturnDate.toISOString() : undefined,
        actualReturnDate: formData.actualReturnDate ? formData.actualReturnDate.toISOString() : undefined,
    };
    updateIssuanceMutation.mutate(dataToSave);
  };


  const handleCancel = () => {
    router.push('/ppe-management');
  };

  const isLoading = isLoadingPpeItems || isLoadingIssuance || isLoadingJobRoleMatrix;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
          <CardHeader><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-6 p-4 md:p-6">{[...Array(6)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>))}</CardContent>
        </Card>
      </div>
    );
  }

  if (issuanceError || ppeItemsError || !issuanceToEdit || jobRoleMatrixError) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader><CardTitle>Record Not Found</CardTitle></CardHeader>
          <CardContent><p>The PPE issuance record or related data could not be found.</p><Button onClick={() => router.push('/ppe-management')} className="mt-4">Back to PPE Management</Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PpeIssuanceForm
        ppeItems={ppeItems}
        ppeJobRoleMatrix={ppeJobRoleMatrix}
        initialData={issuanceToEdit}
        onSave={handleSaveIssuance}
        onCancel={handleCancel}
        isSubmitting={updateIssuanceMutation.isPending}
      />
    </div>
  );
}
