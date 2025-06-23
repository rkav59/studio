
"use client";

import { useRouter, useParams } from 'next/navigation';
import type { PpeInspectionRecord, PpeItem, PpeItemStatus, PpeInspectionOverallStatus } from "@/lib/types";
import { PpeInspectionForm, type PpeInspectionFormValues } from "@/components/ppe-management/ppe-inspection-form";
import { useToast } from '@/hooks/use-toast';
import { parseISO, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


const PPE_INSPECTIONS_COLLECTION = 'ppeInspections';
const PPE_ITEMS_COLLECTION = 'ppeItems';

export default function EditPpeInspectionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const inspectionId = params.id as string;

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

  const { data: inspectionToEdit, isLoading: isLoadingInspection, error: inspectionError } = useQuery<PpeInspectionRecord | null>({
    queryKey: [PPE_INSPECTIONS_COLLECTION, inspectionId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !inspectionId) return null;
      const inspectionRef = doc(db, PPE_INSPECTIONS_COLLECTION, inspectionId);
      const inspectionSnap = await getDoc(inspectionRef);
      if (inspectionSnap.exists() && inspectionSnap.data().userId === user.uid) {
        const data = inspectionSnap.data();
        return { 
          id: inspectionSnap.id, 
          ...data,
          inspectionDate: (data.inspectionDate as Timestamp)?.toDate().toISOString(),
          nextInspectionDate: data.nextInspectionDate ? (data.nextInspectionDate as Timestamp).toDate().toISOString() : undefined,
        } as PpeInspectionRecord;
      }
      return null;
    },
    enabled: !!user?.uid && !!inspectionId,
  });


  const updatePpeItemStatus = async (itemId: string, inspectionStatus: PpeInspectionOverallStatus) => {
    if (!user?.uid) return;
    const itemToUpdate = ppeItems.find(item => item.id === itemId);
    if (!itemToUpdate) return;
    
    let newPpeStatus: PpeItemStatus = 'Available';
    switch (inspectionStatus) {
        case 'Pass': newPpeStatus = 'Available'; break;
        case 'Requires Repair': newPpeStatus = 'Awaiting Repair'; break;
        case 'To be Replaced': newPpeStatus = 'Awaiting Replacement'; break;
        case 'Action Pending': newPpeStatus = 'Under Inspection'; break;
    }
    
    const itemRef = doc(db, PPE_ITEMS_COLLECTION, itemId);
    await updateDoc(itemRef, { status: newPpeStatus });
  };


  const updateInspectionMutation = useMutation({
    mutationFn: async (updatedData: PpeInspectionFormValues) => {
      if (!user?.uid || !inspectionId) throw new Error("User or inspection ID missing.");
      const dataForDb = {
        ...updatedData,
        userId: user.uid,
        inspectionDate: Timestamp.fromDate(parseISO(updatedData.inspectionDate)),
        nextInspectionDate: updatedData.nextInspectionDate ? Timestamp.fromDate(parseISO(updatedData.nextInspectionDate)) : null,
      };
      const inspectionRef = doc(db, PPE_INSPECTIONS_COLLECTION, inspectionId);
      await updateDoc(inspectionRef, dataForDb);
      return updatedData; // Pass form data to onSuccess
    },
    onSuccess: async (variables) => {
      await updatePpeItemStatus(variables.ppeItemId, variables.overallStatus);
      queryClient.invalidateQueries({ queryKey: [PPE_INSPECTIONS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [PPE_ITEMS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [PPE_INSPECTIONS_COLLECTION, inspectionId, user?.uid] });
      toast({ 
        title: "PPE Inspection Updated", 
        description: `Inspection record for PPE Item ID ${variables.ppeItemId} has been successfully updated.` 
      });
      router.push('/ppe-management');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error Updating Inspection", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      });
    },
  });


  const handleSaveInspection = (formData: PpeInspectionFormValues) => {
    updateInspectionMutation.mutate(formData);
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };

  const isLoading = isLoadingPpeItems || isLoadingInspection;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6 p-4 md:p-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inspectionError || !inspectionToEdit || ppeItemsError) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The PPE inspection record or related data could not be found.</p>
            <Button onClick={() => router.push('/ppe-management')} className="mt-4">
              Back to PPE Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PpeInspectionForm
        ppeItems={ppeItems}
        initialData={inspectionToEdit}
        onSave={handleSaveInspection}
        onCancel={handleCancel}
        isSubmitting={updateInspectionMutation.isPending}
      />
    </div>
  );
}
