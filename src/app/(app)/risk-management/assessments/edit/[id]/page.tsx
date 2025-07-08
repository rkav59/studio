"use client";

import { useRouter, useParams } from 'next/navigation';
import { ManualRiskAssessmentForm, type ManualRiskAssessmentFormValues } from "@/components/risk-management/manual-risk-assessment-form";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualRiskAssessment, RiskRegisterEntry, ManualHazard } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { parseISO, format } from 'date-fns';

const MANUAL_RISK_ASSESSMENTS_COLLECTION = 'manualRiskAssessments';
const MANUAL_HAZARDS_COLLECTION = 'manualHazards';
const RISK_REGISTER_ENTRIES_COLLECTION = 'riskRegisterEntries';


export default function EditManualRiskAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const assessmentId = params.id as string;

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

  const { data: assessmentToEdit, isLoading: isLoadingAssessment, error: assessmentError } = useQuery<ManualRiskAssessment | null>({
    queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, assessmentId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !assessmentId) return null;
      const assessmentRef = doc(db, MANUAL_RISK_ASSESSMENTS_COLLECTION, assessmentId);
      const assessmentSnap = await getDoc(assessmentRef);
      if (assessmentSnap.exists() && assessmentSnap.data().userId === user.uid) {
        const data = assessmentSnap.data();
        return { 
          id: assessmentSnap.id, 
          ...data,
          assessmentDate: (data.assessmentDate as Timestamp)?.toDate().toISOString(),
          reviewDate: data.reviewDate ? (data.reviewDate as Timestamp).toDate().toISOString() : undefined,
          additionalControls: (data.additionalControls || []).map((control: any) => ({
              ...control,
              dueDate: control.dueDate ? (control.dueDate as Timestamp).toDate().toISOString() : undefined,
          })),
        } as ManualRiskAssessment;
      }
      return null;
    },
    enabled: !!user?.uid && !!assessmentId,
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: async (updatedAssessmentData: ManualRiskAssessment) => { 
      if (!user?.uid || !updatedAssessmentData.id) throw new Error("User or assessment ID missing.");
      const { id, ...dataToUpdate } = updatedAssessmentData; 
      const assessmentRef = doc(db, MANUAL_RISK_ASSESSMENTS_COLLECTION, id);
      const dataForDb = { 
        ...dataToUpdate, 
        userId: user.uid, 
        assessmentDate: Timestamp.fromDate(parseISO(dataToUpdate.assessmentDate as string)),
        reviewDate: dataToUpdate.reviewDate ? Timestamp.fromDate(parseISO(dataToUpdate.reviewDate as string)) : null,
        additionalControls: (dataToUpdate.additionalControls || []).map(control => ({
            ...control,
            dueDate: control.dueDate ? Timestamp.fromDate(parseISO(control.dueDate as string)) : null,
        })),
      };
      await updateDoc(assessmentRef, dataForDb as any); 
      
      // Update linked Risk Register Entry
      const registerQuery = query(collection(db, RISK_REGISTER_ENTRIES_COLLECTION), where("linkedRiskAssessmentId", "==", id));
      const registerSnapshot = await getDocs(registerQuery);
      
      if (!registerSnapshot.empty) {
        const registerDoc = registerSnapshot.docs[0];
        const linkedHazard = manualHazards.find(h => h.id === dataForDb.linkedHazardId);
        
        const treatmentPlan = `Existing Controls:\n${dataForDb.existingControls}\n\nAdditional Controls:\n${(dataForDb.additionalControls || []).map(c => `- ${c.description}`).join('\n')}`;
        
        const registerUpdateData: Partial<RiskRegisterEntry> = {
          riskTitle: dataForDb.activityOrProcess,
          riskDescription: linkedHazard?.hazardDescription || 'N/A',
          dateIdentified: dataForDb.assessmentDate.toDate().toISOString(),
          identifiedBy: dataForDb.assessedBy,
          initialLikelihood: dataForDb.initialLikelihood,
          initialSeverity: dataForDb.initialSeverity,
          initialRiskLevel: dataForDb.initialRiskLevel,
          treatmentPlan,
          riskOwner: dataForDb.assessedBy,
          status: 'Open', // Could be logic to determine this based on assessment status
          residualLikelihood: dataForDb.residualLikelihood,
          residualSeverity: dataForDb.residualSeverity,
          residualRiskLevel: dataForDb.residualRiskLevel,
          nextReviewDate: dataForDb.reviewDate ? dataForDb.reviewDate.toDate().toISOString() : undefined,
          notes: dataForDb.overallComments,
        };
        await updateDoc(doc(db, RISK_REGISTER_ENTRIES_COLLECTION, registerDoc.id), registerUpdateData);
      }

      return updatedAssessmentData; // Return the original data for onSuccess
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Assessment Updated", description: `Risk assessment for "${variables.activityOrProcess}" and the linked register entry have been updated.` });
      router.push('/risk-management');
    },
    onError: (e: Error) => toast({ title: "Error Updating Assessment", description: e.message, variant: "destructive" }),
  });

  const handleSaveAssessment = (formData: ManualRiskAssessmentFormValues) => {
    if (!assessmentToEdit) return;
    const assessmentDataToSave: ManualRiskAssessment = {
      ...assessmentToEdit, 
      ...formData,
      unloggedHazardDescription: undefined, // This field is only for creation
      assessmentDate: parseISO(formData.assessmentDate).toISOString(),
      reviewDate: formData.reviewDate ? parseISO(formData.reviewDate).toISOString() : undefined,
      additionalControls: formData.additionalControls?.map(control => ({
          ...control,
          dueDate: control.dueDate ? parseISO(control.dueDate).toISOString() : undefined,
      })) || []
    };
    updateAssessmentMutation.mutate(assessmentDataToSave);
  };

  const handleCancel = () => {
    router.push('/risk-management');
  };

  if (isLoadingAssessment || isLoadingHazards) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (assessmentError || !assessmentToEdit || hazardsError) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Risk Assessment Not Found</CardTitle></CardHeader>
          <CardContent><p>{assessmentError?.message || "The risk assessment could not be found or you don't have permission to edit it."}</p></CardContent>
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
            <h1 className="text-2xl font-semibold tracking-tight">
                 Edit Risk Assessment: {assessmentToEdit.activityOrProcess}
            </h1>
        </div>
        <ManualRiskAssessmentForm 
            initialData={assessmentToEdit} 
            manualHazards={manualHazards}
            onSave={handleSaveAssessment} 
            onCancel={handleCancel}
            isSubmitting={updateAssessmentMutation.isPending}
        />
    </div>
  );
}
