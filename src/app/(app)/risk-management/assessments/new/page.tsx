"use client";

import { useRouter } from 'next/navigation';
import { ManualRiskAssessmentForm, type ManualRiskAssessmentFormValues } from "@/components/risk-management/manual-risk-assessment-form";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualRiskAssessment, RiskAssessmentControl } from '@/lib/types';
import { ArrowLeft, FileSignature } from 'lucide-react';
import { parseISO } from 'date-fns';

const MANUAL_RISK_ASSESSMENTS_COLLECTION = 'manualRiskAssessments';

export default function NewManualRiskAssessmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addAssessmentMutation = useMutation({
    mutationFn: async (newAssessmentData: ManualRiskAssessmentFormValues) => { 
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newAssessmentData,
        userId: user.uid,
        assessmentDate: Timestamp.fromDate(parseISO(newAssessmentData.assessmentDate as string)),
        reviewDate: newAssessmentData.reviewDate ? Timestamp.fromDate(parseISO(newAssessmentData.reviewDate as string)) : null,
        additionalControls: newAssessmentData.additionalControls.map(control => ({
            ...control,
            dueDate: control.dueDate ? Timestamp.fromDate(parseISO(control.dueDate as string)) : null,
        })) as RiskAssessmentControl[], // Ensure type correctness
      };
      return addDoc(collection(db, MANUAL_RISK_ASSESSMENTS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, user?.uid] });
      toast({ title: "Risk Assessment Created", description: "The new manual risk assessment has been saved." });
      router.push('/risk-management');
    },
    onError: (e: Error) => toast({ title: "Error Creating Assessment", description: e.message, variant: "destructive" }),
  });

  const handleSaveAssessment = (data: ManualRiskAssessmentFormValues) => {
    addAssessmentMutation.mutate(data);
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
                 <FileSignature className="h-6 w-6 text-purple-600" /> Conduct New Manual Risk Assessment
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Fill in the details for the risk assessment. Use the risk matrix guidance for likelihood and severity.
          </CardDescription>
        </CardHeader>
        <ManualRiskAssessmentForm 
          onSave={handleSaveAssessment} 
          onCancel={handleCancel}
          isSubmitting={addAssessmentMutation.isPending}
        />
      </Card>
    </div>
  );
}
