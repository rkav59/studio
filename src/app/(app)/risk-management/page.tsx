
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HazardIdentificationForm } from "@/components/risk-management/hazard-identification-form";
import { RiskAssessmentSuggestionForm } from "@/components/risk-management/risk-assessment-suggestion-form";
import { AlertTriangle, ListChecks, ShieldAlert, Activity, Settings, PlusCircle, Eye, Edit2, Trash2, FileSignature, Target, Loader2, ShieldQuestion, ShieldCheck, ClockIcon, UserCircleIcon, LinkIcon } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualHazard, ManualRiskAssessment, RiskLevel, RiskAssessmentControl } from "@/lib/types";
import { format, parseISO, isBefore, differenceInDays, isValid } from 'date-fns';
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
import { riskMatrix, controlActionStatuses } from "@/lib/risk-assessment-config";


const MANUAL_HAZARDS_COLLECTION = 'manualHazards';
const MANUAL_RISK_ASSESSMENTS_COLLECTION = 'manualRiskAssessments';
const CONTROL_REMINDER_LEAD_DAYS = 7;


interface ActiveControlAction extends RiskAssessmentControl {
  assessmentId: string;
  assessmentActivity: string;
  assessmentStatus: ManualRiskAssessment['status'];
}

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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), dateIdentified: (doc.data().dateIdentified as Timestamp)?.toDate().toISOString() } as ManualHazard));
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
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return { 
            id: docSnap.id, 
            ...data, 
            assessmentDate: (data.assessmentDate as Timestamp)?.toDate().toISOString(),
            reviewDate: data.reviewDate ? (data.reviewDate as Timestamp).toDate().toISOString() : undefined,
            additionalControls: (data.additionalControls || []).map((control: any) => ({
                ...control,
                dueDate: control.dueDate ? (control.dueDate as Timestamp).toDate().toISOString() : undefined,
            })),
        } as ManualRiskAssessment;
      });
    },
    enabled: !!user?.uid,
  });
  
  // Deletion Mutations
  const deleteHazardMutation = useMutation({
    mutationFn: (hazardId: string) => deleteDoc(doc(db, MANUAL_HAZARDS_COLLECTION, hazardId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MANUAL_HAZARDS_COLLECTION, user?.uid] });
    },
    onError: (e:Error) => alert(`Error deleting hazard: ${e.message}`),
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (assessmentId: string) => deleteDoc(doc(db, MANUAL_RISK_ASSESSMENTS_COLLECTION, assessmentId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, user?.uid] }),
    onError: (e:Error) => alert(`Error deleting assessment: ${e.message}`),
  });

  const getRiskLevelColor = (level: RiskLevel) => riskMatrix[level]?.color || 'bg-gray-200 text-gray-700';

  const activeControlActions = useMemo((): ActiveControlAction[] => {
    const controls: ActiveControlAction[] = [];
    manualRiskAssessments.forEach(assessment => {
      assessment.additionalControls.forEach(control => {
        if (control.status && !['Completed', 'Cancelled'].includes(control.status)) {
          controls.push({
            ...control,
            assessmentId: assessment.id,
            assessmentActivity: assessment.activityOrProcess,
            assessmentStatus: assessment.status,
          });
        }
      });
    });
    // Sort: Overdue first, then by due date (soonest first), then by assessment activity
    return controls.sort((a, b) => {
        const aIsOverdue = a.dueDate && isBefore(parseISO(a.dueDate), new Date());
        const bIsOverdue = b.dueDate && isBefore(parseISO(b.dueDate), new Date());

        if (aIsOverdue && !bIsOverdue) return -1;
        if (!aIsOverdue && bIsOverdue) return 1;

        if (a.dueDate && b.dueDate) {
            const aDate = parseISO(a.dueDate);
            const bDate = parseISO(b.dueDate);
            if (aDate.getTime() !== bDate.getTime()) {
                return aDate.getTime() - bDate.getTime();
            }
        } else if (a.dueDate) { // a has due date, b does not
            return -1;
        } else if (b.dueDate) { // b has due date, a does not
            return 1;
        }
        return a.assessmentActivity.localeCompare(b.assessmentActivity);
    });
  }, [manualRiskAssessments]);

  const getControlDateStatusInfo = (dateString?: string): { textClass: string; icon?: JSX.Element; displayText: string; isOverdue: boolean } | null => {
    if (!dateString || !isValid(parseISO(dateString))) return null;
    const date = parseISO(dateString);
    const today = new Date(); today.setHours(0,0,0,0);
    const formattedDate = format(date, "PPP");
    let isOverdue = false;

    if (isBefore(date, today)) {
        isOverdue = true;
        return { textClass: 'text-red-600 font-semibold', icon: <AlertTriangle className="h-3 w-3 mr-1" />, displayText: `${formattedDate} (Overdue)`, isOverdue };
    }
    const daysDiff = differenceInDays(date, today);
    if (daysDiff <= CONTROL_REMINDER_LEAD_DAYS) {
        return { textClass: 'text-yellow-600 font-semibold', icon: <ClockIcon className="h-3 w-3 mr-1" />, displayText: `${formattedDate} (Upcoming)`, isOverdue };
    }
    return { textClass: 'text-muted-foreground', icon: <ClockIcon className="h-3 w-3 mr-1" />, displayText: formattedDate, isOverdue };
  };

  const getControlStatusColor = (status?: Required<RiskAssessmentControl>['status']) => {
    switch (status) {
        case 'Open': return 'text-blue-600';
        case 'In Progress': return 'text-yellow-600';
        case 'Completed': return 'text-green-600';
        case 'Overdue': return 'text-red-600 font-bold';
        case 'Cancelled': return 'text-gray-500 line-through';
        default: return 'text-muted-foreground';
    }
  };


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
            Leverage AI for assistance or use manual tools for detailed recording and assessment. All data is stored in Firestore.
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
      
      {/* Active Risk Control Actions Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-500" />
            Active Risk Control Actions
          </CardTitle>
          <CardDescription>
            Monitor and manage outstanding control measures from risk assessments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeControlActions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No pending control actions found from risk assessments.</p>
          ) : (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {activeControlActions.map(control => {
                  const dateStatus = getControlDateStatusInfo(control.dueDate);
                  const statusColor = getControlStatusColor(control.status);
                  return (
                    <Card key={control.id} className={`p-3 shadow-sm border-l-4 ${dateStatus?.isOverdue && control.status !== 'Completed' ? 'border-red-500' : 'border-transparent'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div className="mb-2 sm:mb-0 flex-grow">
                          <p className="font-semibold text-md leading-tight">{control.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            From Assessment: 
                            <Button variant="link" size="sm" className="h-auto p-0 ml-1 text-xs text-blue-600 hover:underline" onClick={() => router.push(`/risk-management/assessments/edit/${control.assessmentId}`)}>
                                <LinkIcon className="h-3 w-3 mr-1"/>{control.assessmentActivity}
                            </Button>
                             (Status: {control.assessmentStatus})
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
                            {control.responsiblePerson && <p className="flex items-center gap-1"><UserCircleIcon className="h-3 w-3 text-muted-foreground"/>Resp: {control.responsiblePerson}</p>}
                            {dateStatus && <p className={`flex items-center gap-1 ${dateStatus.textClass}`}>{dateStatus.icon}Due: {dateStatus.displayText}</p>}
                            <p className={`flex items-center gap-1 ${statusColor}`}>Status: {control.status}</p>
                          </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 sm:mt-0 shrink-0"
                            onClick={() => router.push(`/risk-management/assessments/edit/${control.assessmentId}`)}
                        >
                          Manage in Assessment
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      <Separator />

      {/* AI Assisted Tools */}
      <HazardIdentificationForm />
      <RiskAssessmentSuggestionForm />
      
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
                    <li>Direct editing of control action status from the 'Active Controls' list.</li>
                </ul>
        </CardContent>
      </Card>
    </div>
  );
}

