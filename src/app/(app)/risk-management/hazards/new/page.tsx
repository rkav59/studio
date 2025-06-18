"use client";

import { useRouter } from 'next/navigation';
import { ManualHazardForm, type ManualHazardFormValues } from "@/components/risk-management/manual-hazard-form";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualHazard } from '@/lib/types';
import { ArrowLeft, Target } from 'lucide-react';
import { parseISO } from 'date-fns';

const MANUAL_HAZARDS_COLLECTION = 'manualHazards';

export default function NewManualHazardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addHazardMutation = useMutation({
    mutationFn: async (newHazardData: ManualHazardFormValues) => { 
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newHazardData,
        userId: user.uid,
        dateIdentified: Timestamp.fromDate(parseISO(newHazardData.dateIdentified as string)),
      };
      return addDoc(collection(db, MANUAL_HAZARDS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MANUAL_HAZARDS_COLLECTION, user?.uid] });
      toast({ title: "Hazard Logged", description: "The new hazard has been successfully logged." });
      router.push('/risk-management');
    },
    onError: (e: Error) => toast({ title: "Error Logging Hazard", description: e.message, variant: "destructive" }),
  });

  const handleSaveHazard = (data: ManualHazardFormValues) => {
    addHazardMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/risk-management');
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Risk Management">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Target className="h-6 w-6 text-red-500" /> Log New Manual Hazard
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Describe the activity and the hazard you've identified.
          </CardDescription>
        </CardHeader>
        <ManualHazardForm 
          onSave={handleSaveHazard} 
          onCancel={handleCancel}
          isSubmitting={addHazardMutation.isPending}
        />
      </Card>
    </div>
  );
}
