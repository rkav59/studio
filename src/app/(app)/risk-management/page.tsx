
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
// Removed form imports that are now on separate pages
import { AlertTriangle, ListChecks, ShieldAlert, Activity, Settings, PlusCircle, Eye, Edit2, Trash2, FileSignature, Target, Loader2, ShieldQuestion, ShieldCheck, ClockIcon, UserCircleIcon, LinkIcon, BookOpen, LayoutDashboard, Brain } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualHazard, ManualRiskAssessment, RiskLevel, RiskAssessmentControl, RiskRegisterEntry, RiskRegisterStatus, SheqAudit } from "@/lib/types";
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
// Dialog import no longer needed here for AI tools
import { Separator } from "@/components/ui/separator";
import { riskMatrix, controlActionStatuses, riskAssessmentStatuses } from "@/lib/risk-assessment-config";


const MANUAL_HAZARDS_COLLECTION = 'manualHazards';
const MANUAL_RISK_ASSESSMENTS_COLLECTION = 'manualRiskAssessments';
const RISK_REGISTER_ENTRIES_COLLECTION = 'riskRegisterEntries';
const CONTROL_REMINDER_LEAD_DAYS = 7;
const RISK_REVIEW_REMINDER_LEAD_DAYS = 30;


interface ActiveControlAction extends RiskAssessmentControl {
  assessmentId: string;
  assessmentActivity: string;
  assessmentStatus: ManualRiskAssessment['status'];
}

export default function RiskManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Removed useState for dialog visibility as AI tools are now on dedicated pages

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

  // Fetch Risk Register Entries
  const { data: riskRegisterEntries = [], isLoading: isLoadingRiskRegister, error: riskRegisterError } = useQuery<RiskRegisterEntry[]>({
    queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, RISK_REGISTER_ENTRIES_COLLECTION), where("userId", "==", user.uid), orderBy("dateIdentified", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dateIdentified: (data.dateIdentified as Timestamp)?.toDate().toISOString(),
          treatmentDueDate: data.treatmentDueDate ? (data.treatmentDueDate as Timestamp).toDate().toISOString() : undefined,
          lastReviewedDate: data.lastReviewedDate ? (data.lastReviewedDate as Timestamp).toDate().toISOString() : undefined,
          nextReviewDate: data.nextReviewDate ? (data.nextReviewDate as Timestamp).toDate().toISOString() : undefined,
        } as RiskRegisterEntry;
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

  const deleteRiskRegisterEntryMutation = useMutation({
    mutationFn: (entryId: string) => deleteDoc(doc(db, RISK_REGISTER_ENTRIES_COLLECTION, entryId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, user?.uid] }),
    onError: (e: Error) => alert(`Error deleting risk register entry: ${e.message}`),
  });


  const getRiskLevelColor = (level: RiskLevel | undefined) => level ? riskMatrix[level]?.color : 'bg-gray-200 text-gray-700';
  const getRiskRegisterStatusColor = (status: RiskRegisterStatus) => {
    switch (status) {
      case 'Open': return 'text-blue-600';
      case 'In Progress': return 'text-yellow-600';
      case 'Mitigated': return 'text-green-600';
      case 'Closed': return 'text-gray-500';
      case 'Accepted': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
  };

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
    return controls.sort((a, b) => {
        const aIsOverdue = a.dueDate && isBefore(parseISO(a.dueDate), new Date());
        const bIsOverdue = b.dueDate && isBefore(parseISO(b.dueDate), new Date());
        if (aIsOverdue && !bIsOverdue) return -1;
        if (!aIsOverdue && bIsOverdue) return 1;
        if (a.dueDate && b.dueDate) {
            const aDate = parseISO(a.dueDate); const bDate = parseISO(b.dueDate);
            if (aDate.getTime() !== bDate.getTime()) return aDate.getTime() - bDate.getTime();
        } else if (a.dueDate) return -1;
        else if (b.dueDate) return 1;
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
  
  const getReviewDateStatusInfo = (dateString?: string): { textClass: string; icon?: JSX.Element; displayText: string; isOverdue: boolean } | null => {
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
    if (daysDiff <= RISK_REVIEW_REMINDER_LEAD_DAYS) {
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


  if (isLoadingHazards || isLoadingAssessments || isLoadingRiskRegister) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg text-muted-foreground">Loading risk management data...</p>
        </div>
    );
  }
  if (hazardsError || assessmentsError || riskRegisterError) {
    return <div className="text-red-500 text-center py-10">Error loading data: {(hazardsError || assessmentsError || riskRegisterError)?.message}</div>;
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
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Risk Management - Aligned with ISO 31000 Principles</h1>
            <p className="text-sm text-neutral-300">This module facilitates a systematic approach to risk management, following ISO 31000 guidelines for establishing context, identifying, analyzing, evaluating, treating, monitoring, and reporting risks.</p>
          </div>
        </div>
      </Card>

    {/* Section 1: Risk Identification & Assessment Tools */}
      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-primary"/>Risk Identification, Analysis & Evaluation</CardTitle>
            <CardDescription>Manually log hazards and conduct detailed risk assessments to understand and prioritize risks based on likelihood and severity. These tools support the core ISO 31000 risk assessment process.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Manual Hazard Log Sub-Section */}
            <Card className="bg-muted/20">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-red-500"/>Manual Hazard Log</CardTitle>
                        <CardDescription className="text-xs">Use this to quickly log hazards observed on site or reported (ISO 31000: Risk Identification). These can later be linked to detailed risk assessments.</CardDescription>
                    </div>
                    <Button onClick={() => router.push('/risk-management/hazards/new')} className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5">
                        <PlusCircle className="mr-2 h-3 w-3" /> Log New Hazard
                    </Button>
                </CardHeader>
                <CardContent>
                    {manualHazards.length === 0 ? (
                        <p className="text-muted-foreground text-center text-sm py-3">No manual hazards logged yet.</p>
                    ) : (
                        <ScrollArea className="max-h-[200px] pr-2">
                            <div className="space-y-2">
                                {manualHazards.slice(0,3).map(hazard => ( 
                                    <Card key={hazard.id} className="p-2 shadow-sm text-xs">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-sm truncate max-w-xs">{hazard.hazardDescription}</h4>
                                                <p className="text-muted-foreground">Activity: {hazard.activityDescription.substring(0,50)}...</p>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => router.push(`/risk-management/hazards/edit/${hazard.id}`)}><Edit2 className="h-3 w-3"/></Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {manualHazards.length > 3 && <p className="text-center text-xs text-muted-foreground mt-2">...and {manualHazards.length - 3} more.</p>}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            {/* Manual Risk Assessments Sub-Section */}
            <Card className="bg-muted/20 mt-4">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2"><FileSignature className="h-5 w-5 text-purple-600"/>Manual Risk Assessments</CardTitle>
                        <CardDescription className="text-xs">Perform systematic risk assessments using the defined matrix (ISO 31000: Risk Analysis & Evaluation). Document controls, calculate residual risk, and track actions.</CardDescription>
                    </div>
                    <Button onClick={() => router.push('/risk-management/assessments/new')} className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5">
                        <PlusCircle className="mr-2 h-3 w-3" /> New Assessment
                    </Button>
                </CardHeader>
                <CardContent>
                     {manualRiskAssessments.length === 0 ? (
                        <p className="text-muted-foreground text-center text-sm py-3">No manual risk assessments conducted yet.</p>
                    ) : (
                        <ScrollArea className="max-h-[200px] pr-2">
                            <div className="space-y-2">
                                {manualRiskAssessments.slice(0,3).map(assessment => (
                                    <Card key={assessment.id} className="p-2 shadow-sm text-xs">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-sm truncate max-w-xs">{assessment.activityOrProcess}</h4>
                                                <p className="text-muted-foreground">Initial: <span className={`px-1 py-0.5 rounded-full text-xs ${getRiskLevelColor(assessment.initialRiskLevel)}`}>{assessment.initialRiskLevel}</span> | Residual: <span className={`px-1 py-0.5 rounded-full text-xs ${getRiskLevelColor(assessment.residualRiskLevel)}`}>{assessment.residualRiskLevel}</span></p>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => router.push(`/risk-management/assessments/edit/${assessment.id}`)}><Edit2 className="h-3 w-3"/></Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {manualRiskAssessments.length > 3 && <p className="text-center text-xs text-muted-foreground mt-2">...and {manualRiskAssessments.length - 3} more.</p>}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </CardContent>
      </Card>

      {/* Risk Register Section */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6 text-green-600"/>Risk Register (Centralized Risk Recording & Reporting)</CardTitle>
                <CardDescription>A central log of significant organizational risks, their owners, treatment plans, and review status (ISO 31000: Recording & Reporting). Provides an overview of the risk landscape.</CardDescription>
            </div>
            <Button onClick={() => router.push('/risk-management/risk-register/new')} className="bg-green-600 hover:bg-green-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Risk to Register
            </Button>
        </CardHeader>
        <CardContent>
            {riskRegisterEntries.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No risks logged in the register yet.</p>
            ) : (
                <ScrollArea className="max-h-[400px] pr-3">
                    <div className="space-y-3">
                        {riskRegisterEntries.map(entry => {
                            const displayRiskLevel = entry.residualRiskLevel || entry.initialRiskLevel;
                            const reviewDateStatus = getReviewDateStatusInfo(entry.nextReviewDate);
                            return (
                                <Card key={entry.id} className="p-3 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                            <h4 className="font-semibold">{entry.riskTitle}</h4>
                                            <p className="text-xs text-muted-foreground">Category: {entry.category || "N/A"} | Owner: {entry.riskOwner || "N/A"}</p>
                                            <p className="text-xs">Risk Level: <span className={`px-1.5 py-0.5 rounded-full text-xs ${getRiskLevelColor(displayRiskLevel)}`}>{displayRiskLevel}</span></p>
                                            <p className={`text-xs font-semibold ${getRiskRegisterStatusColor(entry.status)}`}>Status: {entry.status}</p>
                                            {reviewDateStatus && <p className={`text-xs flex items-center ${reviewDateStatus.textClass}`}>{reviewDateStatus.icon}{reviewDateStatus.displayText}</p>}
                                            {entry.linkedSheqAuditName && <p className="text-xs text-muted-foreground flex items-center"><LinkIcon className="h-3 w-3 mr-1"/>Linked Audit: {entry.linkedSheqAuditName}</p>}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/risk-management/risk-register/edit/${entry.id}`)}><Edit2 className="mr-1 h-3 w-3"/>Edit</Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3"/>Delete</Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Delete Risk Entry?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{entry.riskTitle}"?</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteRiskRegisterEntryMutation.mutate(entry.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
      </Card>
      
      {/* Active Risk Control Actions Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-500" />
            Risk Treatment & Control Monitoring
          </CardTitle>
          <CardDescription>
            Track the progress and effectiveness of control actions identified in risk assessments (ISO 31000: Risk Treatment, Monitoring & Review). Ensure treatments are implemented and risks are managed.
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
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="h-6 w-6 text-indigo-500"/>AI-Assisted Risk Management Tools</CardTitle>
                <CardDescription>Utilize AI to support aspects of the risk management process, such as brainstorming hazards, suggesting assessment methodologies, or exploring potential root causes for incidents or high-risk events (ISO 31000: Risk Analysis & Evaluation Support).</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
                <Button onClick={() => router.push('/risk-management/ai-hazard-identification')} variant="outline" className="justify-start text-left h-auto py-3">
                    <AlertTriangle className="h-5 w-5 mr-3 text-orange-500"/>
                    <div>
                        <span className="font-semibold">AI Hazard Identification</span>
                        <p className="text-xs text-muted-foreground">Describe activity for hazard suggestions.</p>
                    </div>
                </Button>
                <Button onClick={() => router.push('/risk-management/ai-risk-assessment-suggestion')} variant="outline" className="justify-start text-left h-auto py-3">
                    <ShieldQuestion className="h-5 w-5 mr-3 text-blue-500"/>
                     <div>
                        <span className="font-semibold">AI Risk Assessment Assist</span>
                        <p className="text-xs text-muted-foreground">Get suggestions for controls & methods.</p>
                    </div>
                </Button>
                 <Button onClick={() => router.push('/risk-management/ai-root-cause-suggestion')} variant="outline" className="justify-start text-left h-auto py-3">
                    <Brain className="h-5 w-5 mr-3 text-purple-500"/>
                     <div>
                        <span className="font-semibold">AI Root Cause Suggestions</span>
                        <p className="text-xs text-muted-foreground">Explore potential root causes.</p>
                    </div>
                </Button>
            </CardContent>
        </Card>
      
      <Card className="shadow-md mt-6">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-6 w-6 text-muted-foreground" />Risk Reporting & Performance Monitoring (Future Development)</CardTitle>
            <CardDescription>Future: Generate reports on risk profiles, control effectiveness, and monitor key risk indicators (KRIs) through customizable dashboards (ISO 31000: Monitoring, Review, and Reporting).</CardDescription>
        </CardHeader>
      </Card>

       <Card className="mt-8">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-muted-foreground" />Module Configuration & Continual Improvement (Future Development)</CardTitle>
        </CardHeader>
        <CardContent>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Future: Customize risk matrices (likelihood, severity, risk levels), define risk appetite, and integrate with other modules for a holistic approach to continuous improvement (ISO 31000: Framework - Integration, Design, Implementation, Evaluation, Improvement).</li>
                    <li>Direct editing of control action status from the 'Active Controls' list for assessments.</li>
                    <li>More granular action tracking within Risk Register entries.</li>
                </ul>
        </CardContent>
      </Card>
    </div>
  );
}

    