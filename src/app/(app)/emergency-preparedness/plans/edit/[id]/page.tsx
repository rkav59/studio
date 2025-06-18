
"use client";

import { useRouter, useParams } from 'next/navigation';
import { EmergencyPlanForm } from "@/components/emergency-preparedness/emergency-plan-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmergencyPlan } from '@/lib/types';
import { ArrowLeft, FileText } from 'lucide-react';
import { parseISO } from 'date-fns';

const PLANS_COLLECTION = 'emergencyPlans';

export default function EditEmergencyPlanPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const planId = params.id as string;

  const { data: planToEdit, isLoading: isLoadingPlan, error: planError } = useQuery<EmergencyPlan | null>({
    queryKey: [PLANS_COLLECTION, planId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !planId) return null;
      const planRef = doc(db, PLANS_COLLECTION, planId);
      const planSnap = await getDoc(planRef);
      if (planSnap.exists() && planSnap.data().userId === user.uid) {
        const data = planSnap.data();
        return { 
          id: planSnap.id, 
          ...data,
          lastReviewedDate: data.lastReviewedDate instanceof Timestamp ? data.lastReviewedDate.toDate().toISOString() : data.lastReviewedDate,
          nextReviewDate: data.nextReviewDate instanceof Timestamp ? data.nextReviewDate.toDate().toISOString() : data.nextReviewDate,
        } as EmergencyPlan;
      }
      return null;
    },
    enabled: !!user?.uid && !!planId,
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (updatedPlanData: EmergencyPlan) => {
      if (!user?.uid || !updatedPlanData.id) throw new Error("User or plan ID missing.");
      const { id, ...dataToUpdate } = updatedPlanData;
      const planRef = doc(db, PLANS_COLLECTION, id);
      const dataForDb = {
        ...dataToUpdate,
        userId: user.uid,
        lastReviewedDate: dataToUpdate.lastReviewedDate ? Timestamp.fromDate(parseISO(dataToUpdate.lastReviewedDate)) : null,
        nextReviewDate: dataToUpdate.nextReviewDate ? Timestamp.fromDate(parseISO(dataToUpdate.nextReviewDate)) : null,
      };
      await updateDoc(planRef, dataForDb);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PLANS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [PLANS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Plan Updated", description: `Emergency Plan "${variables.planName}" has been updated.` });
      router.push('/emergency-preparedness');
    },
    onError: (e: Error) => toast({ title: "Error Updating Plan", description: e.message, variant: "destructive" }),
  });

  const handleSavePlan = (formData: Omit<EmergencyPlan, 'id' | 'userId'>) => {
    if (!planToEdit) return;
    const planDataToSave: EmergencyPlan = {
      ...planToEdit, // includes id and userId
      ...formData,
    };
    updatePlanMutation.mutate(planDataToSave);
  };

  const handleCancel = () => {
    router.push('/emergency-preparedness');
  };

  if (isLoadingPlan) {
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

  if (planError || !planToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Emergency Plan Not Found</CardTitle></CardHeader>
          <CardContent><p>{planError ? planError.message : "The plan could not be found or you don't have permission to edit it."}</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Emergency Preparedness">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <FileText className="h-6 w-6 text-primary" /> Edit Emergency Plan: {planToEdit.planName}
            </h1>
        </div>
        <EmergencyPlanForm 
            initialData={planToEdit} 
            onSave={handleSavePlan} 
            onCancel={handleCancel}
            isSubmitting={updatePlanMutation.isPending}
        />
    </div>
  );
}
