"use client";

import { useRouter, useParams } from 'next/navigation';
import { ManualHazardForm, type ManualHazardFormValues } from "@/components/risk-management/manual-hazard-form";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualHazard } from '@/lib/types';
import { ArrowLeft, Target } from 'lucide-react';
import { parseISO, format } from 'date-fns';

const MANUAL_HAZARDS_COLLECTION = 'manualHazards';

export default function EditManualHazardPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const hazardId = params.id as string;

  const { data: hazardToEdit, isLoading: isLoadingHazard, error: hazardError } = useQuery<ManualHazard | null>({
    queryKey: [MANUAL_HAZARDS_COLLECTION, hazardId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !hazardId) return null;
      const hazardRef = doc(db, MANUAL_HAZARDS_COLLECTION, hazardId);
      const hazardSnap = await getDoc(hazardRef);
      if (hazardSnap.exists() && hazardSnap.data().userId === user.uid) {
        const data = hazardSnap.data();
        return { 
          id: hazardSnap.id, 
          ...data,
          dateIdentified: (data.dateIdentified as Timestamp)?.toDate().toISOString(),
        } as ManualHazard;
      }
      return null;
    },
    enabled: !!user?.uid && !!hazardId,
  });

  const updateHazardMutation = useMutation({
    mutationFn: async (updatedHazardData: ManualHazard) => { 
      if (!user?.uid || !updatedHazardData.id) throw new Error("User or hazard ID missing.");
      const { id, ...dataToUpdate } = updatedHazardData; 
      const hazardRef = doc(db, MANUAL_HAZARDS_COLLECTION, id);
      const dataForDb = { 
        ...dataToUpdate, 
        userId: user.uid, 
        dateIdentified: Timestamp.fromDate(parseISO(dataToUpdate.dateIdentified as string)) 
      };
      await updateDoc(hazardRef, dataForDb); 
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MANUAL_HAZARDS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [MANUAL_HAZARDS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Hazard Updated", description: `Hazard "${variables.hazardDescription.substring(0,30)}..." has been updated.` });
      router.push('/risk-management');
    },
    onError: (e: Error) => toast({ title: "Error Updating Hazard", description: e.message, variant: "destructive" }),
  });

  const handleSaveHazard = (formData: ManualHazardFormValues) => {
    if (!hazardToEdit) return;
    const hazardDataToSave: ManualHazard = {
      ...hazardToEdit, 
      ...formData,
      dateIdentified: parseISO(formData.dateIdentified).toISOString(),
    };
    updateHazardMutation.mutate(hazardDataToSave);
  };

  const handleCancel = () => {
    router.push('/risk-management');
  };

  if (isLoadingHazard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent>
        </Card>
      </div>
    );
  }

  if (hazardError || !hazardToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Hazard Not Found</CardTitle></CardHeader>
          <CardContent><p>{hazardError?.message || "The hazard could not be found or you don't have permission to edit it."}</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Risk Management">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Target className="h-6 w-6 text-red-500" /> Edit Hazard: {hazardToEdit.hazardDescription.substring(0,50)}{hazardToEdit.hazardDescription.length > 50 ? '...' : ''}
            </h1>
        </div>
      <Card className="shadow-lg">
         <CardHeader>
          <CardDescription>
            Modify the details for this manually identified hazard.
          </CardDescription>
        </CardHeader>
        <ManualHazardForm 
            initialData={hazardToEdit} 
            onSave={handleSaveHazard} 
            onCancel={handleCancel}
            isSubmitting={updateHazardMutation.isPending}
        />
      </Card>
    </div>
  );
}
