
"use client";

import { useRouter } from 'next/navigation';
import { EmergencyPlanForm } from "@/components/emergency-preparedness/emergency-plan-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmergencyPlan } from '@/lib/types';
import { ArrowLeft, FileText } from 'lucide-react';
import { parseISO } from 'date-fns';

const PLANS_COLLECTION = 'emergencyPlans';

export default function NewEmergencyPlanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addPlanMutation = useMutation({
    mutationFn: async (newPlanData: Omit<EmergencyPlan, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newPlanData, 
        userId: user.uid,
        lastReviewedDate: newPlanData.lastReviewedDate ? Timestamp.fromDate(parseISO(newPlanData.lastReviewedDate)) : null,
        nextReviewDate: newPlanData.nextReviewDate ? Timestamp.fromDate(parseISO(newPlanData.nextReviewDate)) : null,
      };
      return addDoc(collection(db, PLANS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_COLLECTION, user?.uid] });
      toast({ title: "Emergency Plan Created", description: "The new emergency plan has been successfully added." });
      router.push('/emergency-preparedness');
    },
    onError: (e: Error) => toast({ title: "Error Creating Plan", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSavePlan = (data: Omit<EmergencyPlan, 'id' | 'userId'>) => {
    addPlanMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/emergency-preparedness');
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Emergency Preparedness">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <FileText className="h-6 w-6 text-primary" /> Create New Emergency Plan
            </h1>
        </div>
        <EmergencyPlanForm 
          onSave={handleSavePlan} 
          onCancel={handleCancel} 
          isSubmitting={addPlanMutation.isPending}
        />
    </div>
  );
}
