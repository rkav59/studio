
"use client";

import { useRouter, useParams } from 'next/navigation';
import { MockDrillForm } from "@/components/emergency-preparedness/mock-drill-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MockDrill, EmergencyPlan } from '@/lib/types';
import { ArrowLeft, Activity } from 'lucide-react';
import { parseISO } from 'date-fns';

const DRILLS_COLLECTION = 'mockDrills';
const PLANS_COLLECTION = 'emergencyPlans';

export default function EditMockDrillPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const drillId = params.id as string;

  const { data: plans = [], isLoading: isLoadingPlans, error: plansError } = useQuery<EmergencyPlan[]>({
    queryKey: [PLANS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PLANS_COLLECTION), where("userId", "==", user.uid), orderBy("planName"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as EmergencyPlan));
    },
    enabled: !!user?.uid,
  });

  const { data: drillToEdit, isLoading: isLoadingDrill, error: drillError } = useQuery<MockDrill | null>({
    queryKey: [DRILLS_COLLECTION, drillId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !drillId) return null;
      const drillRef = doc(db, DRILLS_COLLECTION, drillId);
      const drillSnap = await getDoc(drillRef);
      if (drillSnap.exists() && drillSnap.data().userId === user.uid) {
        const data = drillSnap.data();
        return { 
          id: drillSnap.id, 
          ...data,
          scheduledDate: (data.scheduledDate as Timestamp)?.toDate().toISOString(),
          actualDate: data.actualDate ? (data.actualDate as Timestamp).toDate().toISOString() : undefined,
          actionItems: (data.actionItems || []).map((ai: any) => ({
            ...ai,
            dueDate: ai.dueDate ? (ai.dueDate as Timestamp).toDate().toISOString() : undefined,
          })),
        } as MockDrill;
      }
      return null;
    },
    enabled: !!user?.uid && !!drillId,
  });

  const updateDrillMutation = useMutation({
    mutationFn: async (updatedDrillData: MockDrill) => {
      if (!user?.uid || !updatedDrillData.id) throw new Error("Missing user or drill ID.");
      const { id, ...dataToUpdate } = updatedDrillData;
      const drillRef = doc(db, DRILLS_COLLECTION, id);
      const dataForDb = {
        ...dataToUpdate,
        userId: user.uid,
        scheduledDate: Timestamp.fromDate(parseISO(dataToUpdate.scheduledDate as string)),
        actualDate: dataToUpdate.actualDate ? Timestamp.fromDate(parseISO(dataToUpdate.actualDate as string)) : null,
        actionItems: (dataToUpdate.actionItems || []).map(ai => ({
          ...ai,
          dueDate: ai.dueDate ? Timestamp.fromDate(parseISO(ai.dueDate as string)) : null,
        })),
      };
      await updateDoc(drillRef, dataForDb);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [DRILLS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [DRILLS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Drill Updated", description: `Mock Drill "${variables.drillName}" has been updated.` });
      router.push('/emergency-preparedness');
    },
    onError: (e: Error) => toast({ title: "Error Updating Drill", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveDrill = (formData: Omit<MockDrill, 'id' | 'userId'>) => {
    if (!drillToEdit) return;
    const drillDataToSave: MockDrill = {
      ...drillToEdit, 
      ...formData,
    };
    updateDrillMutation.mutate(drillDataToSave);
  };

  const handleCancel = () => {
    router.push('/emergency-preparedness');
  };

  if (isLoadingPlans || isLoadingDrill) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-0">
            <div className="p-6 space-y-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (plansError || drillError || !drillToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Mock Drill Not Found</CardTitle></CardHeader>
          <CardContent><p>The drill could not be found or you don't have permission to edit it.</p></CardContent>
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
                 <Activity className="h-6 w-6 text-teal-500" /> Edit Mock Drill: {drillToEdit.drillName}
            </h1>
        </div>
        <MockDrillForm 
            plans={plans}
            initialData={drillToEdit} 
            onSave={handleSaveDrill} 
            onCancel={handleCancel}
            isSubmitting={updateDrillMutation.isPending}
        />
    </div>
  );
}
