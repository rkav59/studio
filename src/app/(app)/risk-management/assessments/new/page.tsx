
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
import type { ManualRiskAssessment, RiskRegisterEntry, ManualHazard } from '@/lib/types';
import { ArrowLeft, FileSignature } from 'lucide-react';
import { parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const MANUAL_RISK_ASSESSMENTS_COLLECTION = 'manualRiskAssessments';
const MANUAL_HAZARDS_COLLECTION = 'manualHazards';
const RISK_REGISTER_ENTRIES_COLLECTION = 'riskRegisterEntries';
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
      let linkedHazard: ManualHazard | undefined = manualHazards.find(h => h.id === hazardIdToLink);

      // If no hazard is linked and a new one is described, create it first
      if ((!hazardIdToLink || hazardIdToLink === NO_SELECTION_VALUE) && newAssessmentData.unloggedHazardDescription) {
        const newHazardData: Omit<ManualHazard, 'id'> = {
          userId: user.uid,
          activityDescription: newAssessmentData.activityOrProcess,
          hazardDescription: newAssessmentData.unloggedHazardDescription,
          dateIdentified: new Date().toISOString(),
          identifiedBy: newAssessmentData.assessedBy,
          location: newAssessmentData.scope,
          potentialConsequences: ""
        };

        const hazardDocRef = await addDoc(collection(db, MANUAL_HAZARDS_COLLECTION), {
          ...newHazardData,
          dateIdentified: Timestamp.fromDate(parseISO(newHazardData.dateIdentified))
        });

        hazardIdToLink = hazardDocRef.id;
        linkedHazard = { id: hazardIdToLink, ...newHazardData }; // Use for register entry
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

      const assessmentDocRef = await addDoc(collection(db, MANUAL_RISK_ASSESSMENTS_COLLECTION), dataForDb as any);

      // Now, create the Risk Register Entry
      const treatmentPlan = `Existing Controls:\n${dataForDb.existingControls}\n\nAdditional Controls:\n${(dataForDb.additionalControls || []).map(c => `- ${c.description}`).join('\n')}`;
      
      const riskRegisterEntryData: Omit<RiskRegisterEntry, 'id'> = {
        userId: user.uid,
        linkedRiskAssessmentId: assessmentDocRef.id,
        riskTitle: dataForDb.activityOrProcess,
        riskDescription: linkedHazard?.hazardDescription || 'N/A',
        dateIdentified: dataForDb.assessmentDate.toDate().toISOString(),
        identifiedBy: dataForDb.assessedBy,
        source: "Risk Assessment",
        initialLikelihood: dataForDb.initialLikelihood,
        initialSeverity: dataForDb.initialSeverity,
        initialRiskLevel: dataForDb.initialRiskLevel,
        treatmentPlan,
        riskOwner: dataForDb.assessedBy, // Defaulting to assessor
        status: 'Open',
        residualLikelihood: dataForDb.residualLikelihood,
        residualSeverity: dataForDb.residualSeverity,
        residualRiskLevel: dataForDb.residualRiskLevel,
        nextReviewDate: dataForDb.reviewDate ? dataForDb.reviewDate.toDate().toISOString() : undefined,
      };
      
      await addDoc(collection(db, RISK_REGISTER_ENTRIES_COLLECTION), riskRegisterEntryData);

      return assessmentDocRef;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, user?.uid] });
      toast({ title: "Success", description: "Risk assessment and register entry created." });
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
        <ManualRiskAssessmentForm 
          manualHazards={manualHazards}
          onSave={handleSaveAssessment} 
          onCancel={handleCancel}
          isSubmitting={addAssessmentMutation.isPending}
        />
    </div>
  );
}
