
"use client";

import { useRouter } from 'next/navigation';
import { WellnessProgramForm, type WellnessProgramFormValues } from "@/components/health-monitoring/wellness-program-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WellnessProgram } from '@/lib/types';
import { parseISO } from 'date-fns';
import { ArrowLeft, Award } from 'lucide-react';

const WELLNESS_PROGRAMS_COLLECTION = 'wellnessPrograms';

export default function NewWellnessProgramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addWellnessProgramMutation = useMutation({
    mutationFn: async (newProgramData: WellnessProgramFormValues) => { 
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = { 
        ...newProgramData, 
        userId: user.uid, 
        startDate: Timestamp.fromDate(parseISO(newProgramData.startDate as string)),
        endDate: newProgramData.endDate ? Timestamp.fromDate(parseISO(newProgramData.endDate as string)) : null,
      };
      return addDoc(collection(db, WELLNESS_PROGRAMS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WELLNESS_PROGRAMS_COLLECTION, user?.uid] });
      toast({ title: "Wellness Program Added", description: "The new Wellness Program has been added." });
      router.push('/health-monitoring');
    },
    onError: (e: Error) => toast({ title: "Error Adding Wellness Program", description: e.message, variant: "destructive" }),
  });

  const handleSaveWellnessProgram = (data: WellnessProgramFormValues) => {
    addWellnessProgramMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/health-monitoring');
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Health Monitoring">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Award className="h-6 w-6 text-purple-500" /> Add New Wellness Program
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Define a new employee wellness program.
          </CardDescription>
        </CardHeader>
        <WellnessProgramForm 
          onSave={handleSaveWellnessProgram} 
          onCancel={handleCancel}
          isSubmitting={addWellnessProgramMutation.isPending}
        />
      </Card>
    </div>
  );
}
