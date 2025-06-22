
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ListChecks, ShieldAlert, Activity, Settings, PlusCircle, Eye, Edit2, Trash2, FileSignature, Target, Loader2, ShieldQuestion, ShieldCheck, ClockIcon, UserCircleIcon, LinkIcon, BookOpen, LayoutDashboard, Brain, Megaphone, Download, Landmark } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualHazard, ManualRiskAssessment, RiskLevel, RiskAssessmentControl, RiskRegisterEntry, RiskRegisterStatus, SheqAudit, Incident } from "@/lib/types";
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
import { riskMatrix, controlActionStatuses, riskAssessmentStatuses } from "@/lib/risk-assessment-config";
import { IncidentDetailsDialog } from "@/components/risk-management/incident-details-dialog";
import { useToast } from "@/hooks/use-toast";


const MANUAL_HAZARDS_COLLECTION = 'manualHazards';
const MANUAL_RISK_ASSESSMENTS_COLLECTION = 'manualRiskAssessments';
const RISK_REGISTER_ENTRIES_COLLECTION = 'riskRegisterEntries';
const INCIDENTS_COLLECTION = 'incidents';
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
  const { toast } = useToast(); 
  const queryClient = useQueryClient();
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null); 

  // Fetch Incidents
  const { data: incidents = [], isLoading: isLoadingIncidents, error: incidentsError } = useQuery<Incident[]>({
    queryKey: [INCIDENTS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, INCIDENTS_COLLECTION), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
    },
    enabled: !!user?.uid,
  });

  // Incident Deletion Mutation
  const deleteIncidentMutation = useMutation({
    mutationFn: (incidentId: string) => deleteDoc(doc(db, INCIDENTS_COLLECTION, incidentId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_COLLECTION, user?.uid] });
      toast({ title: "Incident Deleted", description: "The incident record has been deleted." });
    },
    onError: (e:Error) => toast({title: "Error Deleting Incident", description: "An unexpected error occurred. Please try again.", variant: "destructive"}),
  });


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
      toast({ title: "Hazard Deleted", description: "The hazard record has been deleted." });
    },
    onError: (e:Error) => toast({title: "Error Deleting Hazard", description: "An unexpected error occurred. Please try again.", variant: "destructive"}),
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (assessmentId: string) => deleteDoc(doc(db, MANUAL_RISK_ASSESSMENTS_COLLECTION, assessmentId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, user?.uid] });
      toast({ title: "Assessment Deleted", description: "The risk assessment has been deleted." });
    },
    onError: (e:Error) => toast({title: "Error Deleting Assessment", description: "An unexpected error occurred. Please try again.", variant: "destructive"}),
  });

  const deleteRiskRegisterEntryMutation = useMutation({
    mutationFn: (entryId: string) => deleteDoc(doc(db, RISK_REGISTER_ENTRIES_COLLECTION, entryId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, user?.uid] });
      toast({ title: "Risk Register Entry Deleted", description: "The entry has been removed from the risk register." });
    },
    onError: (e: Error) => toast({title: "Error Deleting Risk Entry", description: "An unexpected error occurred. Please try again.", variant: "destructive"}),
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
  const getIncidentStatusColor = (status?: Incident['status']) => {
    switch (status) {
      case 'Open': return 'text-blue-600 dark:text-blue-400';
      case 'Under Investigation': return 'text-yellow-600 dark:text-yellow-400';
      case 'Actions Pending': return 'text-orange-500 dark:text-orange-400';
      case 'Closed': return 'text-green-600 dark:text-green-400';
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

  const escapeCsvCell = (cellData: any): string => {
    if (cellData === null || cellData === undefined) {
      return "";
    }
    const stringData = String(cellData);
    if (stringData.includes(',') || stringData.includes('\n') || stringData.includes('"')) {
      return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
  };

  const handleDownloadRiskRegister = () => {
    if (riskRegisterEntries.length === 0) {
      toast({ title: "No Data", description: "There are no entries in the risk register to download.", variant: "default" });
      return;
    }

    const headers = [
      "ID", "Risk Title", "Description", "Date Identified", "Identified By", "Category", "Source",
      "Initial Likelihood", "Initial Severity", "Initial Risk Level",
      "Treatment Plan", "Risk Owner", "Treatment Due Date", "Status",
      "Residual Likelihood", "Residual Severity", "Residual Risk Level",
      "Last Reviewed Date", "Next Review Date", "Linked SHEQ Audit", "Notes"
    ];

    const rows = riskRegisterEntries.map(entry => [
      escapeCsvCell(entry.id),
      escapeCsvCell(entry.riskTitle),
      escapeCsvCell(entry.riskDescription),
      escapeCsvCell(entry.dateIdentified ? format(parseISO(entry.dateIdentified), "yyyy-MM-dd") : ""),
      escapeCsvCell(entry.identifiedBy),
      escapeCsvCell(entry.category),
      escapeCsvCell(entry.source),
      escapeCsvCell(entry.initialLikelihood),
      escapeCsvCell(entry.initialSeverity),
      escapeCsvCell(entry.initialRiskLevel),
      escapeCsvCell(entry.treatmentPlan),
      escapeCsvCell(entry.riskOwner),
      escapeCsvCell(entry.treatmentDueDate ? format(parseISO(entry.treatmentDueDate), "yyyy-MM-dd") : ""),
      escapeCsvCell(entry.status),
      escapeCsvCell(entry.residualLikelihood),
      escapeCsvCell(entry.residualSeverity),
      escapeCsvCell(entry.residualRiskLevel),
      escapeCsvCell(entry.lastReviewedDate ? format(parseISO(entry.lastReviewedDate), "yyyy-MM-dd") : ""),
      escapeCsvCell(entry.nextReviewDate ? format(parseISO(entry.nextReviewDate), "yyyy-MM-dd") : ""),
      escapeCsvCell(entry.linkedSheqAuditName || entry.linkedSheqAuditId),
      escapeCsvCell(entry.notes),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "risk_register.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: "Risk register CSV file is being downloaded." });
    } else {
        toast({ title: "Download Failed", description: "Your browser does not support direct downloads.", variant: "destructive" });
    }
  };


  if (isLoadingHazards || isLoadingAssessments || isLoadingRiskRegister || isLoadingIncidents) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-lg text-muted-foreground">Loading risk management data...</p>
        </div>
    );
  }
  if (hazardsError || assessmentsError || riskRegisterError || incidentsError) {
    return <div className="text-red-500 text-center py-10">Error loading data. Please try again later.</div>;
  }


  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <AlertTriangle className="h-8 w-8"/> Risk Management - Aligned with ISO 31000 Principles
        </h1>
        <p className="text-base text-muted-foreground">This module facilitates a systematic approach to risk management, following ISO 31000 guidelines for establishing context, identifying, analyzing, evaluating, treating, monitoring, and reporting risks. Now includes Incident Logging.</p>
      </div>
      <Separator />

    {/* Incident Log Section */}
    <Card className="shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-6 w-6 text-orange-500"/>Incident Log</CardTitle>
                <CardDescription>Record and track all workplace incidents, near misses, and hazards.</CardDescription>
            </div>
            <Button onClick={() => router.push('/risk-management/incidents/new')} className="bg-orange-500 hover:bg-orange-600 text-white">
                <PlusCircle className="mr-2 h-4 w-4" /> Log New Incident/Event
            </Button>
        </CardHeader>
        <CardContent>
            {incidents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No incidents, near misses, or hazards logged yet.</p>
            ) : (
                <ScrollArea className="max-h-[400px] pr-3">
                    <div className="space-y-3">
                        {incidents.map(incident => (
                            <Card key={incident.id} className="p-3 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        <h4 className="font-semibold">{incident.type}: {incident.description.substring(0, 70)}{incident.description.length > 70 ? '...' : ''}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Date: {format(parseISO(incident.timestamp), "PPPp")} | Location: {incident.location}
                                        </p>
                                        <p className={`text-xs font-semibold ${getIncidentStatusColor(incident.status)}`}>Status: {incident.status || 'Open'}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => setViewingIncident(incident)}><Eye className="mr-1 h-3 w-3"/>View</Button>
                                        <Button variant="secondary" size="sm" onClick={() => router.push(`/risk-management/incidents/edit/${incident.id}`)}><Edit2 className="mr-1 h-3 w-3"/>Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" disabled={deleteIncidentMutation.isPending && deleteIncidentMutation.variables === incident.id}>
                                                    {deleteIncidentMutation.isPending && deleteIncidentMutation.variables === incident.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3"/>}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete Incident?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this {incident.type.toLowerCase()} record?</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteIncidentMutation.mutate(incident.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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
    {viewingIncident && <IncidentDetailsDialog incident={viewingIncident} onClose={() => setViewingIncident(null)} />}
    <Separator/>


    {/* Section 1: Risk Identification & Assessment Tools */}
      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-primary"/>Risk Identification, Analysis & Evaluation</CardTitle>
            <CardDescription>Manually log hazards and conduct detailed risk assessments to understand and prioritize risks based on likelihood and severity. These tools support the core ISO 31000 risk assessment process.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col gap-4">
                <Button onClick={() => router.push('/risk-management/hazards/new')} className="w-full bg-red-500 hover:bg-red-600 text-white">
                    <Target className="mr-2 h-4 w-4" /> Log New Hazard
                </Button>
                <Button onClick={() => router.push('/risk-management/assessments/new')} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    <FileSignature className="mr-2 h-4 w-4" /> Conduct New Risk Assessment
                </Button>
                <Button 
                    onClick={() => toast({ title: "Info", description: "Viewing all risk assessments will be available on a dedicated page soon."})} 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    variant="secondary"
                >
                    <ListChecks className="mr-2 h-4 w-4" /> View/Manage Risk Assessments
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Risk Register Section */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2">Risk Register (Centralized Risk Recording & Reporting)</CardTitle>
                <CardDescription>A central log of significant organizational risks, their owners, treatment plans, and review status (ISO 31000: Recording & Reporting). Provides an overview of the risk landscape.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleDownloadRiskRegister} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download as Excel
                </Button>
                <Button onClick={() => router.push('/risk-management/risk-register/new')} className="bg-green-600 hover:bg-green-700 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Risk to Register
                </Button>
            </div>
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

      {/* AI Assisted Tools & Legal Register */}
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="h-6 w-6 text-indigo-500"/>Intelligent Risk Tools</CardTitle>
                <CardDescription>Utilize AI for deeper insights and access relevant legal information (ISO 31000: Risk Analysis & Evaluation Support, Establishing Context).</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                 <Button onClick={() => router.push('/risk-management/legal-register')} variant="outline" className="justify-start text-left h-auto py-3">
                    <Landmark className="h-5 w-5 mr-3 text-green-600"/>
                     <div>
                        <span className="font-semibold">SHEQ Legal Register</span>
                        <p className="text-xs text-muted-foreground">View AI-generated legal items for your country.</p>
                    </div>
                </Button>
            </CardContent>
        </Card>

      <Card className="shadow-md mt-6">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-6 w-6 text-muted-foreground" />Risk Reporting Dashboard (Future Development)</CardTitle>
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
