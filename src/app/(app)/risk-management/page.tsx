"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HazardIdentificationForm } from "@/components/risk-management/hazard-identification-form";
import { RiskAssessmentSuggestionForm } from "@/components/risk-management/risk-assessment-suggestion-form";
import { AlertTriangle, ListChecks, ShieldAlert, Activity, Settings, PlusCircle, Eye, Edit2, Trash2, FileSignature, Target, Loader2, ShieldQuestion, ShieldX } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualHazard, ManualRiskAssessment, RiskLevel } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { riskMatrix } from "@/lib/risk-assessment-config";


const MANUAL_HAZARDS_COLLECTION = 'manualHazards';
const MANUAL_RISK_ASSESSMENTS_COLLECTION = 'manualRiskAssessments';

export default function RiskManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch Manual Hazards
  const { data: manualHazards = [], isLoading: isLoadingHazards, error: hazardsError } = useQuery<ManualHazard[]>({
    queryKey: [MANUAL_HAZARDS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, MANUAL_HAZARDS_COLLECTION), where("userId", "==", user.uid), orderBy("dateIdentified", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManualHazard));
    },
    enabled: !!user?.uid,
  });

  // Fetch Manual Risk Assessments
  const { data: manualRiskAssessments = [], isLoading: isLoadingAssessments, error: assessmentsError } = useQuery<ManualRiskAssessment[]>({
    queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, MANUAL_RISK_ASSESSMENTS_COLLECTION), where("userId", "==", user.uid), orderBy("assessmentDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManualRiskAssessment));
    },
    enabled: !!user?.uid,
  });
  
  // Deletion Mutations
  const deleteHazardMutation = useMutation({
    mutationFn: (hazardId: string) => deleteDoc(doc(db, MANUAL_HAZARDS_COLLECTION, hazardId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MANUAL_HAZARDS_COLLECTION, user?.uid] });
      // Potentially invalidate linked risk assessments if a hazard is deleted.
      // queryClient.invalidateQueries({ queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, user?.uid] });
    },
    onError: (e:Error) => alert(`Error deleting hazard: ${e.message}`),
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (assessmentId: string) => deleteDoc(doc(db, MANUAL_RISK_ASSESSMENTS_COLLECTION, assessmentId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, user?.uid] }),
    onError: (e:Error) => alert(`Error deleting assessment: ${e.message}`),
  });

  const getRiskLevelColor = (level: RiskLevel) => riskMatrix[level]?.color || 'bg-gray-200 text-gray-700';


  if (isLoadingHazards || isLoadingAssessments) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg text-muted-foreground">Loading risk management data...</p>
        </div>
    );
  }
  if (hazardsError || assessmentsError) {
    return <div className="text-red-500 text-center py-10">Error loading data: {(hazardsError || assessmentsError)?.message}</div>;
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image
            src="https://placehold.co/1200x400.png"
            alt="Risk matrix and safety gear"
            layout="fill"
            objectFit="cover"
            data-ai-hint="risk assessment safety"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Risk Management</h1>
            <p className="text-sm text-neutral-300">Proactively identify, assess, evaluate, and control risks.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module provides tools to support your risk management lifecycle, from identifying hazards to monitoring controls. 
            Leverage AI for assistance or use manual tools for detailed recording and assessment.
          </p>
        </CardContent>
      </Card>

      {/* Manual Hazard Log Section */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><Target className="h-6 w-6 text-red-500"/>Manual Hazard Log</CardTitle>
                <CardDescription>Document and track specific hazards identified in your workplace.</CardDescription>
            </div>
            <Button onClick={() => router.push('/risk-management/hazards/new')} className="bg-red-500 hover:bg-red-600 text-white">
                <PlusCircle className="mr-2 h-4 w-4" /> Log New Hazard
            </Button>
        </CardHeader>
        <CardContent>
            {manualHazards.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No manual hazards logged yet.</p>
            ) : (
                <ScrollArea className="max-h-[300px] pr-3">
                    <div className="space-y-3">
                        {manualHazards.map(hazard => (
                            <Card key={hazard.id} className="p-3 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold">{hazard.hazardDescription.substring(0,100)}{hazard.hazardDescription.length > 100 ? '...' : ''}</h4>
                                        <p className="text-xs text-muted-foreground">Activity: {hazard.activityDescription.substring(0,100)}{hazard.activityDescription.length > 100 ? '...' : ''}</p>
                                        <p className="text-xs text-muted-foreground">Identified: {format(parseISO(hazard.dateIdentified), "PPP")} by {hazard.identifiedBy}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/risk-management/hazards/edit/${hazard.id}`)}><Edit2 className="mr-1 h-3 w-3"/>Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3"/>Delete</Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete Hazard?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this hazard log?</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteHazardMutation.mutate(hazard.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
      </Card>
      
      <Separator />

      {/* Manual Risk Assessments Section */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><FileSignature className="h-6 w-6 text-purple-600"/>Manual Risk Assessments</CardTitle>
                <CardDescription>Conduct, document, and track detailed risk assessments.</CardDescription>
            </div>
            <Button onClick={() => router.push('/risk-management/assessments/new')} className="bg-purple-600 hover:bg-purple-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" /> Conduct New Assessment
            </Button>
        </CardHeader>
        <CardContent>
            {manualRiskAssessments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No manual risk assessments conducted yet.</p>
            ) : (
                 <ScrollArea className="max-h-[400px] pr-3">
                    <div className="space-y-3">
                        {manualRiskAssessments.map(assessment => (
                            <Card key={assessment.id} className="p-3 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold">{assessment.activityOrProcess}</h4>
                                        <p className="text-xs text-muted-foreground">Assessed: {format(parseISO(assessment.assessmentDate), "PPP")} by {assessment.assessedBy}</p>
                                        <p className="text-xs">Initial Risk: <span className={`px-1.5 py-0.5 rounded-full text-xs ${getRiskLevelColor(assessment.initialRiskLevel)}`}>{assessment.initialRiskLevel}</span></p>
                                        <p className="text-xs">Residual Risk: <span className={`px-1.5 py-0.5 rounded-full text-xs ${getRiskLevelColor(assessment.residualRiskLevel)}`}>{assessment.residualRiskLevel}</span></p>
                                        <p className="text-xs text-muted-foreground">Status: {assessment.status}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/risk-management/assessments/edit/${assessment.id}`)}><Edit2 className="mr-1 h-3 w-3"/>Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3"/>Delete</Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete Assessment?</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteAssessmentMutation.mutate(assessment.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* AI Assisted Tools */}
      <HazardIdentificationForm />
      <RiskAssessmentSuggestionForm />
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-500" /> {/* Changed icon */}
            Risk Control & Monitoring (Future Development)
          </CardTitle>
          <CardDescription>
            Track the implementation and effectiveness of risk control measures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Planned features include:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
            <li>Documenting and assigning ownership for risk control actions (linked from Manual Risk Assessments).</li>
            <li>Monitoring the status and effectiveness of implemented controls.</li>
            <li>Setting up review cycles for control measures.</li>
            <li>Integrating with other modules for verification (e.g., inspections, audits).</li>
          </ul>
        </CardContent>
      </Card>

       <Card className="mt-8">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-muted-foreground" />Module Configuration & Expansion</CardTitle>
        </CardHeader>
        <CardContent>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Full CRUD for risk registers (more structured than just hazard log).</li>
                    <li>Integration with Checklist Templates for risk-based auditing.</li>
                    <li>AI-powered root cause analysis suggestions for high-risk events.</li>
                    <li>Customizable risk matrices and reporting dashboards.</li>
                </ul>
        </CardContent>
      </Card>
    </div>
  );
}
