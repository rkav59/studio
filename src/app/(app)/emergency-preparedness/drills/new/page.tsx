
"use client";

import { useRouter } from 'next/navigation';
import { MockDrillForm } from "@/components/emergency-preparedness/mock-drill-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MockDrill, EmergencyPlan } from '@/lib/types';
import { ArrowLeft, Activity } from 'lucide-react';
import { parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const DRILLS_COLLECTION = 'mockDrills';
const PLANS_COLLECTION = 'emergencyPlans';

export default function NewMockDrillPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading: isLoadingPlans, error: plansError } = useQuery<EmergencyPlan[]>({
    queryKey: [PLANS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PLANS_COLLECTION), where("userId", "==", user.uid), orderBy("planName"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyPlan));
    },
    enabled: !!user?.uid,
  });

  const addDrillMutation = useMutation({
    mutationFn: async (newDrillData: Omit<MockDrill, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newDrillData, 
        userId: user.uid,
        scheduledDate: Timestamp.fromDate(parseISO(newDrillData.scheduledDate as string)),
        actualDate: newDrillData.actualDate ? Timestamp.fromDate(parseISO(newDrillData.actualDate as string)) : null,
        actionItems: (newDrillData.actionItems || []).map(ai => ({
          ...ai,
          dueDate: ai.dueDate ? Timestamp.fromDate(parseISO(ai.dueDate as string)) : null,
        })),
      };
      return addDoc(collection(db, DRILLS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRILLS_COLLECTION, user?.uid] });
      toast({ title: "Mock Drill Scheduled/Logged", description: "The new mock drill has been successfully added." });
      router.push('/emergency-preparedness');
    },
    onError: (e: Error) => toast({ title: "Error Logging Drill", description: e.message, variant: "destructive" }),
  });

  const handleSaveDrill = (data: Omit<MockDrill, 'id' | 'userId'>) => {
    addDrillMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/emergency-preparedness');
  };

  if (isLoadingPlans) {
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

  if (plansError) {
     return <div className="text-red-500 text-center py-10">Error loading emergency plans: {plansError.message}</div>;
  }
  
  if (plans.length === 0 && !isLoadingPlans) {
    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Emergency Preparedness">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Activity className="h-6 w-6 text-teal-500" /> Schedule/Log New Mock Drill
                </h1>
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Cannot Log Drill</CardTitle>
                    <CardDescription>There are no emergency plans defined. Please create an emergency plan before scheduling or logging a mock drill.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/emergency-preparedness/plans/new')}>Create Emergency Plan</Button>
                </CardContent>
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
                 <Activity className="h-6 w-6 text-teal-500" /> Schedule/Log New Mock Drill
            </h1>
        </div>
        <MockDrillForm 
          plans={plans} 
          onSave={handleSaveDrill} 
          onCancel={handleCancel}
          isSubmitting={addDrillMutation.isPending}
        />
    </div>
  );
}
