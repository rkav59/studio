
"use client";

import { useRouter } from 'next/navigation';
import { ManualRiskAssessmentForm, type ManualRiskAssessmentFormValues } from "@/components/risk-management/manual-risk-assessment-form";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ManualRiskAssessment, RiskAssessmentControl, ManualHazard } from '@/lib/types';
import { ArrowLeft, FileSignature } from 'lucide-react';
import { parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const MANUAL_RISK_ASSESSMENTS_COLLECTION = 'manualRiskAssessments';
const MANUAL_HAZARDS_COLLECTION = 'manualHazards';
const NO_SELECTION_VALUE = "__NONE__";

export default function NewManualRiskAssessmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: manualHazards = [], isLoading: isLoadingHazards, error: hazardsError } = useQuery<ManualHazard[]>({
    queryKey: [MANUAL_HAZARDS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, MANUAL_HAZARDS_COLLECTION), where("userId", "==", user.uid), orderBy("dateIdentified", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), dateIdentified: (doc.data().dateIdentified as Timestamp)?.toDate().toISOString() } as ManualHazard));
    },
    enabled: !!user?.uid,
  });

  const addAssessmentMutation = useMutation({
    mutationFn: async (newAssessmentData: ManualRiskAssessmentFormValues) => {
      if (!user?.uid) throw new Error("User not authenticated.");

      let hazardIdToLink = newAssessmentData.linkedHazardId;

      // If no hazard is linked and a new one is described, create it first
      if ((!hazardIdToLink || hazardIdToLink === NO_SELECTION_VALUE) && newAssessmentData.unloggedHazardDescription) {
        const newHazardData: Omit<ManualHazard, 'id'> = {
          userId: user.uid,
          activityDescription: newAssessmentData.activityOrProcess,
          hazardDescription: newAssessmentData.unloggedHazardDescription,
          dateIdentified: new Date().toISOString(), // Use current date for new hazard
          identifiedBy: newAssessmentData.assessedBy,
          location: newAssessmentData.scope, // Use assessment scope as location
          potentialConsequences: "" // User can add this later by editing the hazard
        };

        const hazardDocRef = await addDoc(collection(db, MANUAL_HAZARDS_COLLECTION), {
          ...newHazardData,
          dateIdentified: Timestamp.fromDate(parseISO(newHazardData.dateIdentified))
        });

        hazardIdToLink = hazardDocRef.id;
        queryClient.invalidateQueries({ queryKey: [MANUAL_HAZARDS_COLLECTION, user?.uid] });
      }

      const { unloggedHazardDescription, ...assessmentDataForDb } = newAssessmentData;
      
      const dataForDb: Omit<ManualRiskAssessment, 'id'> = {
        ...assessmentDataForDb,
        userId: user.uid,
        assessmentDate: Timestamp.fromDate(parseISO(assessmentDataForDb.assessmentDate as string)),
        reviewDate: assessmentDataForDb.reviewDate ? Timestamp.fromDate(parseISO(assessmentDataForDb.reviewDate as string)) : null,
        additionalControls: (assessmentDataForDb.additionalControls || []).map(control => ({
            ...control,
            dueDate: control.dueDate ? Timestamp.fromDate(parseISO(control.dueDate as string)) : null,
        })),
        linkedHazardId: hazardIdToLink === NO_SELECTION_VALUE ? undefined : hazardIdToLink,
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

  if (isLoadingHazards) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-[500px] w-full" />
        </div>
    );
  }

  if (hazardsError) {
      return <div className="text-red-500 text-center py-10">Error loading hazards list. Please try again.</div>
  }

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
          manualHazards={manualHazards}
          onSave={handleSaveAssessment} 
          onCancel={handleCancel}
          isSubmitting={addAssessmentMutation.isPending}
        />
      </Card>
    </div>
  );
}
