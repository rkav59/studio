
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { AuditScheduler } from '@/components/sheq-audit/audit-scheduler';
import { AuditExecutionForm } from '@/components/sheq-audit/audit-execution-form';
import type { SheqAudit, AuditChecklistItem, ChecklistItemTemplate, NonConformance, AnalyzeAuditDataInput, AnalyzeAuditDataOutput, ChecklistTemplate, AuditObservationEntry } from '@/lib/types';
import { defaultChecklistTemplates } from '@/lib/checklist-templates';
import { Separator } from '@/components/ui/separator';
import { format, isValid, parseISO } from 'date-fns';
import { ChevronLeft, Eye, ListChecks, CheckSquare, BrainCircuit, Sparkles, Loader2, LinkIcon, Filter, BookCheck, SearchCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { analyzeSheqAuditData } from '@/ai/flows/analyze-audit-data-flow';
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp, orderBy, writeBatch } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SHEQ_AUDITS_COLLECTION = 'sheqAudits';
const USER_CHECKLIST_TEMPLATES_COLLECTION = 'userChecklistTemplates';

const auditTypesForFilter: Array<SheqAudit['auditType'] | 'All'> = ['All', 'Safety', 'Health', 'Environment', 'Quality', 'Integrated'];


const getDefaultNonConformance = (): NonConformance => ({
  id: crypto.randomUUID(),
  description: "",
  severity: "Minor",
  relatedChecklistItemId: "",
  relatedIncidentId: "",
  correctiveActionsProposed: "",
  preventiveActionsProposed: "",
  actionAssignedTo: "",
  actionDueDate: "",
  actionStatus: "Open",
  actionCompletionDate: "",
  actionVerificationNotes: "",
});

const getDefaultObservationEntry = (): AuditObservationEntry => ({
  id: crypto.randomUUID(),
  text: "",
});


export default function SheqAuditPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [currentAudit, setCurrentAudit] = useState<SheqAudit | null>(null);
  const [viewingAuditDetails, setViewingAuditDetails] = useState<SheqAudit | null>(null);
  
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AnalyzeAuditDataOutput | null>(null);
  const [isAiInsightsModalOpen, setIsAiInsightsModalOpen] = useState(false);
  const [completedAuditFilterType, setCompletedAuditFilterType] = useState<SheqAudit['auditType'] | 'All'>('All');


  // Fetch SHEQ Audits
  const { data: audits = [], isLoading: isLoadingAudits, error: auditsError } = useQuery<SheqAudit[]>({
    queryKey: [SHEQ_AUDITS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, SHEQ_AUDITS_COLLECTION), where("userId", "==", user.uid), orderBy("auditDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          auditDate: (data.auditDate as Timestamp)?.toDate().toISOString(),
          checklist: (data.checklist || []).map((item: any) => ({ 
            ...item,
            id: item.id || crypto.randomUUID(),
            observations: (item.observations || []).map((obs: any) => ({...obs, id: obs.id || crypto.randomUUID()})),
          })),
          nonConformances: (data.nonConformances || []).map((nc: any) => ({
            ...nc,
            id: nc.id || crypto.randomUUID(),
            actionDueDate: nc.actionDueDate && (nc.actionDueDate as Timestamp)?.toDate ? (nc.actionDueDate as Timestamp).toDate().toISOString() : undefined,
            actionCompletionDate: nc.actionCompletionDate && (nc.actionCompletionDate as Timestamp)?.toDate ? (nc.actionCompletionDate as Timestamp).toDate().toISOString() : undefined,
          })),
        } as SheqAudit;
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch User Checklist Templates
  const { data: userChecklistTemplates = [], isLoading: isLoadingUserTemplates, error: userTemplatesError } = useQuery<ChecklistTemplate[]>({
    queryKey: [USER_CHECKLIST_TEMPLATES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, USER_CHECKLIST_TEMPLATES_COLLECTION), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistTemplate));
    },
    enabled: !!user?.uid,
  });

  const allChecklistTemplatesForScheduler = useMemo(() => {
    const systemTemplates = defaultChecklistTemplates.map(t => ({ ...t, isSystemDefault: true }));
    const customTemplates = userChecklistTemplates.map(t => ({ ...t, isSystemDefault: false }));
    return [...systemTemplates, ...customTemplates];
  }, [userChecklistTemplates]);


  const addAuditMutation = useMutation({
    mutationFn: async (auditToSchedule: { newAuditData: Omit<SheqAudit, 'id' | 'status' | 'checklist' | 'nonConformances' | 'overallFindings' | 'recommendations' | 'userId'>, initialChecklistItemsFromTemplate: ChecklistItemTemplate[] }) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const { newAuditData, initialChecklistItemsFromTemplate } = auditToSchedule;
      const newAuditForDb: Omit<SheqAudit, 'id'> = {
        ...newAuditData,
        userId: user.uid,
        status: "Planned",
        auditDate: Timestamp.fromDate(parseISO(newAuditData.auditDate as string)),
        checklist: initialChecklistItemsFromTemplate.map(templateItem => ({
          id: crypto.randomUUID(), 
          templateItemId: templateItem.id, 
          text: templateItem.text,
          status: 'Pending',
          auditCriteriaReference: templateItem.auditCriteriaReference || '', 
          evidenceGatheringPrompt: templateItem.evidenceGatheringPrompt || '', 
          evidenceNotes: '', 
          responsiblePerson: templateItem.defaultResponsiblePerson || '',
          observations: templateItem.observationPrompt ? [{id: crypto.randomUUID(), text: templateItem.observationPrompt}] : [],
          comments: templateItem.defaultComments || '',
        })),
        nonConformances: [], 
        overallFindings: '',
        recommendations: '',
      };
      return addDoc(collection(db, SHEQ_AUDITS_COLLECTION), newAuditForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHEQ_AUDITS_COLLECTION, user?.uid] });
      toast({ title: "Audit Scheduled", description: "The new audit has been added to the program." });
    },
    onError: (error: Error) => {
      toast({ title: "Error Scheduling Audit", description: error.message, variant: "destructive" });
    },
  });

  const updateAuditMutation = useMutation({
    mutationFn: async (executedAudit: SheqAudit) => {
      if (!user?.uid || !executedAudit.id) throw new Error("User or Audit ID missing");
      const { id, ...dataToUpdate } = executedAudit;
      const auditRef = doc(db, SHEQ_AUDITS_COLLECTION, id);
      
      const dataForDb = {
        ...dataToUpdate,
        userId: user.uid,
        auditDate: Timestamp.fromDate(parseISO(dataToUpdate.auditDate as string)),
        checklist: dataToUpdate.checklist.map(item => ({ 
            ...item,
            id: item.id || crypto.randomUUID(),
            observations: (item.observations || []).map(obs => ({...obs, id: obs.id || crypto.randomUUID()})),
        })),
        nonConformances: (dataToUpdate.nonConformances || []).map(nc => ({
          ...nc,
          id: nc.id || crypto.randomUUID(),
          actionDueDate: nc.actionDueDate && isValid(parseISO(nc.actionDueDate)) ? Timestamp.fromDate(parseISO(nc.actionDueDate)) : null,
          actionCompletionDate: nc.actionCompletionDate && isValid(parseISO(nc.actionCompletionDate)) ? Timestamp.fromDate(parseISO(nc.actionCompletionDate)) : null,
        })),
      };
      await updateDoc(auditRef, dataForDb);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SHEQ_AUDITS_COLLECTION, user?.uid] });
      toast({ title: "Audit Updated", description: `Audit "${variables.auditName}" has been updated.` });
      setCurrentAudit(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error Updating Audit", description: error.message, variant: "destructive" });
    },
  });

  const handleScheduleAudit = (
    newAuditData: Omit<SheqAudit, 'id' | 'status' | 'checklist' | 'nonConformances' | 'overallFindings' | 'recommendations' | 'userId'>,
    initialChecklistItemsFromTemplate: ChecklistItemTemplate[]
  ) => {
    addAuditMutation.mutate({ newAuditData, initialChecklistItemsFromTemplate });
  };

  const handleStartAudit = (auditId: string) => {
    const auditToStart = audits.find(a => a.id === auditId);
    if (auditToStart) {
      setCurrentAudit({ 
        ...auditToStart, 
        status: 'In Progress',
        checklist: (auditToStart.checklist || []).map(item => ({
            ...item,
            id: item.id || crypto.randomUUID(),
            templateItemId: item.templateItemId || '', 
            auditCriteriaReference: item.auditCriteriaReference || '', 
            evidenceGatheringPrompt: item.evidenceGatheringPrompt || '', 
            evidenceNotes: item.evidenceNotes || '',
            responsiblePerson: item.responsiblePerson || '',
            observations: Array.isArray(item.observations) 
                ? item.observations.map(obs => ({...obs, id: obs.id || crypto.randomUUID()})) 
                : [],
            comments: item.comments || '',
        })),
        nonConformances: (auditToStart.nonConformances || []).map(nc => ({
            ...getDefaultNonConformance(),
            ...nc,
            id: nc.id || crypto.randomUUID(),
            actionDueDate: nc.actionDueDate && isValid(parseISO(nc.actionDueDate)) ? format(parseISO(nc.actionDueDate), 'yyyy-MM-dd') : undefined,
            actionCompletionDate: nc.actionCompletionDate && isValid(parseISO(nc.actionCompletionDate)) ? format(parseISO(nc.actionCompletionDate), 'yyyy-MM-dd') : undefined,
        }))
      });
    }
  };

  const handleSaveAuditExecution = (executedAudit: SheqAudit) => {
    updateAuditMutation.mutate(executedAudit);
  };
  
  const handleBackToScheduler = () => {
    setCurrentAudit(null);
  };

  const handleGenerateAiInsights = async () => {
    if (audits.length === 0) {
      toast({ title: "No Audit Data", description: "Please log some audits before generating AI insights.", variant: "default"});
      return;
    }
    setIsAiInsightsLoading(true);
    setAiInsights(null);

    const completedAuditsForInsight = audits.filter(a => a.status === 'Completed' || a.status === 'Closed');
    if (completedAuditsForInsight.length === 0) {
        toast({ title: "No Completed Audits", description: "AI insights require completed or closed audit data.", variant: "default"});
        setIsAiInsightsLoading(false);
        return;
    }

    const nonConformanceDescriptions: string[] = [];
    const failedChecklistItemsText: string[] = [];
    const capaStatusCounts = { open: 0, inProgress: 0, completed: 0, overdue: 0 };
    const overallFindingsSummary: string[] = [];
    const overallRecommendationsSummary: string[] = [];

    completedAuditsForInsight.forEach(audit => {
      (audit.nonConformances || []).forEach(nc => {
        if(nc.description) nonConformanceDescriptions.push(nc.description);
        const statusKey = (nc.actionStatus || 'Open').toLowerCase().replace(/\s+/g, '') as keyof typeof capaStatusCounts;
        if (capaStatusCounts.hasOwnProperty(statusKey)) {
             capaStatusCounts[statusKey]++;
        }
      });
      (audit.checklist || []).forEach(item => {
        if (item.status === 'Non-Compliant' && item.text) {
          failedChecklistItemsText.push(item.text);
        }
      });
      if (audit.overallFindings) overallFindingsSummary.push(audit.overallFindings);
      if (audit.recommendations) overallRecommendationsSummary.push(audit.recommendations);
    });
    
    const input: AnalyzeAuditDataInput = {
      totalAudits: audits.length,
      completedAuditsCount: completedAuditsForInsight.length,
      nonConformanceDescriptions,
      failedChecklistItemsText,
      capaStatusSummary: capaStatusCounts,
      overallFindingsSummary: overallFindingsSummary.length > 0 ? overallFindingsSummary : undefined,
      overallRecommendationsSummary: overallRecommendationsSummary.length > 0 ? overallRecommendationsSummary : undefined,
    };

    try {
      const result = await analyzeSheqAuditData(input);
      setAiInsights(result);
      setIsAiInsightsModalOpen(true);
      toast({ title: "AI Insights Generated", description: "Review the AI-powered analysis of your audit data."});
    } catch (error) {
      console.error("Error generating AI audit insights:", error);
      toast({ title: "AI Insights Error", description: "Failed to generate insights. Please try again.", variant: "destructive"});
    } finally {
      setIsAiInsightsLoading(false);
    }
  };

  const getStatusColor = (status: SheqAudit['status'] | NonConformance['actionStatus']) => {
    switch (status) {
      case 'Planned': return 'text-blue-500 dark:text-blue-400';
      case 'In Progress': return 'text-yellow-500 dark:text-yellow-400';
      case 'Completed': return 'text-green-600 dark:text-green-400';
      case 'Awaiting Review': return 'text-orange-500 dark:text-orange-400';
      case 'Closed': return 'text-gray-500 dark:text-gray-400';
      case 'Open': return 'text-blue-500 dark:text-blue-400';
      case 'Overdue': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getChecklistItemStatusColor = (status: AuditChecklistItem['status']) => {
    switch (status) {
      case 'Compliant': return 'text-green-600 dark:text-green-400';
      case 'Non-Compliant': return 'text-red-600 dark:text-red-400';
      case 'Not Applicable': return 'text-gray-500 dark:text-gray-400';
      case 'Pending': return 'text-yellow-500 dark:text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };
  
  const completedAudits = useMemo(() => {
    return audits.filter(a => (a.status === 'Completed' || a.status === 'Closed') && 
                         (completedAuditFilterType === 'All' || a.auditType === completedAuditFilterType));
  }, [audits, completedAuditFilterType]);


  if (isLoadingAudits || isLoadingUserTemplates) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading SHEQ Audit data...</p>
      </div>
    );
  }

  if (auditsError || userTemplatesError) {
    return <div className="text-red-500 text-center py-10">Error loading data: ${(auditsError || userTemplatesError)?.message}</div>;
  }

  return (
    <div className="space-y-6">
      {!currentAudit ? (
        <>
          <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-3xl font-bold tracking-tight font-headline">SHEQ Audits</CardTitle>
                    <Button onClick={handleGenerateAiInsights} disabled={isAiInsightsLoading || audits.length === 0} variant="outline" className="border-accent text-accent hover:bg-accent/10">
                        {isAiInsightsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        AI Audit Insights
                    </Button>
                </div>
                <CardDescription className="p-0 pt-2">Ensure compliance and drive continuous improvement across SHEQ. Data now in Firestore.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    This module facilitates the planning, execution, and tracking of SHEQ audits, with all data stored in Firebase Firestore. 
                    Select from default or custom checklist templates. During execution, customize items, log responsible persons, multiple observations, and comments. Document non-conformances with CAPA details.
                    Checklist items now include fields for audit criteria and evidence gathering to align with ISO 19011 principles.
                </p>
            </CardContent>
          </Card>
          
          <AuditScheduler
            scheduledAudits={audits.filter(a => a.status === 'Planned' || a.status === 'In Progress')}
            allChecklistTemplates={allChecklistTemplatesForScheduler} 
            onScheduleAudit={handleScheduleAudit}
            onStartAudit={handleStartAudit}
          />
          
          
            <Card className="shadow-lg mt-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2"><CheckSquare className="h-6 w-6 text-primary"/>Completed/Closed Audits</CardTitle>
                        <CardDescription>Review past audit records. Filter by audit type.</CardDescription>
                    </div>
                    <div className="w-full sm:w-auto min-w-[200px]">
                        <Select value={completedAuditFilterType} onValueChange={(value) => setCompletedAuditFilterType(value as SheqAudit['auditType'] | 'All')}>
                            <SelectTrigger className="w-full">
                                <div className="flex items-center gap-2">
                                 <Filter className="h-4 w-4 text-muted-foreground"/>
                                 <SelectValue placeholder="Filter by type..." />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {auditTypesForFilter.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                {completedAudits.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                        {completedAuditFilterType === 'All' ? "No audits completed or closed yet." : `No ${completedAuditFilterType} audits completed or closed.`}
                    </p>
                ) : (
                <ul className="space-y-3">
                  {completedAudits.slice(0, 10).map(audit => ( // Show up to 10, can add pagination later
                    <li key={audit.id} className="p-3 border rounded-md bg-secondary/30 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="flex-grow">
                        <p className="font-medium">{audit.auditName} <span className="text-xs text-muted-foreground">({audit.auditType})</span></p>
                        <p className="text-sm text-muted-foreground">Scope: {audit.scope}</p>
                        <p className="text-xs text-muted-foreground">Date: {format(parseISO(audit.auditDate), "PPP")} | Auditor: {audit.auditor}</p>
                        <p className={`text-xs font-semibold ${getStatusColor(audit.status)}`}>Status: {audit.status}</p>
                      </div>
                       <Button variant="outline" size="sm" onClick={() => setViewingAuditDetails(audit)} className="mt-2 sm:mt-0 self-start sm:self-auto">
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </Button>
                    </li>
                  ))}
                </ul>
                )}
                {completedAudits.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">And {completedAudits.length - 10} more...</p>
                )}
              </CardContent>
            </Card>
          

        </>
      ) : (
        <Card className="shadow-lg">
           <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Conduct Audit: {currentAudit.auditName}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleBackToScheduler}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back to Scheduler
                </Button>
            </div>
            <CardDescription>
              Complete the checklist for the audit of <span className="font-semibold"> {currentAudit.scope}</span>, scheduled for <span className="font-semibold">{format(parseISO(currentAudit.auditDate), "PPP")}</span> by <span className="font-semibold">{currentAudit.auditor}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditExecutionForm
              key={currentAudit.id} 
              audit={currentAudit}
              onSaveAudit={handleSaveAuditExecution}
            />
          </CardContent>
        </Card>
      )}

      {viewingAuditDetails && (
        <Dialog open={!!viewingAuditDetails} onOpenChange={() => setViewingAuditDetails(null)}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-primary">
                        <ListChecks className="h-6 w-6" /> Audit Details: {viewingAuditDetails.auditName}
                    </DialogTitle>
                    <DialogDescription>
                        Type: {viewingAuditDetails.auditType} | Scope: {viewingAuditDetails.scope} <br />
                        Date: {format(parseISO(viewingAuditDetails.auditDate), "PPP")} | Auditor(s): {viewingAuditDetails.auditor} | Status: <span className={`font-semibold ${getStatusColor(viewingAuditDetails.status)}`}>{viewingAuditDetails.status}</span>
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-grow my-4 pr-4 space-y-6">
                    <section>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1 text-primary">Checklist Items</h3>
                        {viewingAuditDetails.checklist.length > 0 ? (
                            <ul className="space-y-3">
                                {viewingAuditDetails.checklist.map((item, index) => (
                                    <li key={item.id} className="p-3 border rounded-md bg-muted/30 text-sm space-y-1">
                                        <p className="font-medium">Item {index + 1}: {item.text}</p>
                                        <p>Status: <span className={`font-semibold ${getChecklistItemStatusColor(item.status)}`}>{item.status}</span></p>
                                        {item.auditCriteriaReference && <p className="text-xs"><strong className="text-muted-foreground flex items-center gap-1"><BookCheck className="h-3 w-3"/>Criteria Ref:</strong> {item.auditCriteriaReference}</p>}
                                        {item.evidenceNotes && <p className="text-xs whitespace-pre-wrap"><strong className="text-muted-foreground flex items-center gap-1"><SearchCheck className="h-3 w-3"/>Evidence Notes:</strong> {item.evidenceNotes}</p>}
                                        {item.responsiblePerson && <p className="text-xs"><strong className="text-muted-foreground">Responsible:</strong> {item.responsiblePerson}</p>}
                                        
                                        {item.observations && item.observations.length > 0 && (
                                            <div className="pl-2 mt-1">
                                                <p className="text-xs font-medium text-muted-foreground">Observations:</p>
                                                <ul className="list-disc list-inside pl-3 text-xs">
                                                    {item.observations.map(obs => (
                                                        <li key={obs.id} className="whitespace-pre-wrap">{obs.text}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {item.comments && <p className="text-xs whitespace-pre-wrap"><strong className="text-muted-foreground">Comments:</strong> {item.comments}</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground italic">No checklist items recorded.</p>}
                    </section>

                    <Separator className="my-4"/>
                    
                    <section>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1 text-destructive">Non-Conformances & CAPA</h3>
                        {viewingAuditDetails.nonConformances && viewingAuditDetails.nonConformances.length > 0 ? (
                            <ul className="space-y-4">
                                {viewingAuditDetails.nonConformances.map((nc, index) => (
                                    <li key={nc.id} className="p-4 border rounded-md bg-destructive/10 border-destructive/40">
                                        <p className="font-semibold text-destructive-foreground">NC #{index + 1}: {nc.description}</p>
                                        <p className="text-sm">Severity: <span className="font-medium">{nc.severity}</span></p>
                                        {nc.relatedChecklistItemId && (
                                            <p className="text-xs text-muted-foreground">
                                                Related to Checklist Item: "{viewingAuditDetails.checklist.find(ci => ci.id === nc.relatedChecklistItemId)?.text.substring(0,50) || 'N/A'}..."
                                            </p>
                                        )}
                                        {nc.relatedIncidentId && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                Related Incident ID: 
                                                <Button
                                                    variant="link"
                                                    className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                    onClick={() => toast({
                                                        title: "Feature: Navigate to Incident",
                                                        description: `Navigating to Incident ID '${nc.relatedIncidentId}' is a planned feature.`,
                                                        variant: "default",
                                                        duration: 5000,
                                                    })}
                                                >
                                                    <LinkIcon className="h-3 w-3 mr-1" />
                                                    {nc.relatedIncidentId}
                                                </Button>
                                            </p>
                                        )}
                                        <Separator className="my-2 bg-destructive/30"/>
                                        <div className="space-y-1 text-xs">
                                            <p><strong className="text-destructive-foreground/80">Corrective Actions Proposed:</strong> {nc.correctiveActionsProposed || "N/A"}</p>
                                            <p><strong className="text-destructive-foreground/80">Preventive Actions Proposed:</strong> {nc.preventiveActionsProposed || "N/A"}</p>
                                            <p><strong className="text-destructive-foreground/80">Assigned To:</strong> {nc.actionAssignedTo || "N/A"}</p>
                                            <p><strong className="text-destructive-foreground/80">Due Date:</strong> {nc.actionDueDate && isValid(parseISO(nc.actionDueDate)) ? format(parseISO(nc.actionDueDate), "PPP") : "N/A"}</p>
                                            <p><strong className="text-destructive-foreground/80">Status:</strong> <span className={`font-semibold ${getStatusColor(nc.actionStatus || 'Open')}`}>{nc.actionStatus || "Open"}</span></p>
                                            {nc.actionStatus === 'Completed' && (
                                                <>
                                                    <p><strong className="text-destructive-foreground/80">Completion Date:</strong> {nc.actionCompletionDate && isValid(parseISO(nc.actionCompletionDate)) ? format(parseISO(nc.actionCompletionDate), "PPP") : "N/A"}</p>
                                                    <p><strong className="text-destructive-foreground/80">Verification Notes:</strong> {nc.actionVerificationNotes || "N/A"}</p>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground italic">No non-conformances recorded for this audit.</p>}
                    </section>

                    <Separator className="my-4"/>

                    <section>
                         <h3 className="text-lg font-semibold mb-2 border-b pb-1 text-primary">Overall Summary</h3>
                         <div>
                            <h4 className="font-medium text-sm">Overall Findings:</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingAuditDetails.overallFindings || "N/A"}</p>
                         </div>
                         <div className="mt-2">
                            <h4 className="font-medium text-sm">Recommendations:</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingAuditDetails.recommendations || "N/A"}</p>
                         </div>
                    </section>
                </ScrollArea>
                
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {aiInsights && isAiInsightsModalOpen && (
        <Dialog open={isAiInsightsModalOpen} onOpenChange={setIsAiInsightsModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-accent">
                <Sparkles className="h-6 w-6" /> AI-Powered Audit Insights
              </DialogTitle>
              <DialogDescription>
                Analysis of audit data from Firestore.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow my-4 pr-3 space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-1">Identified Themes & Patterns:</h3>
                <pre className="whitespace-pre-wrap text-sm p-3 bg-secondary/50 rounded-md">{aiInsights.identifiedThemes}</pre>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-1">CAPA Effectiveness Observations:</h3>
                <pre className="whitespace-pre-wrap text-sm p-3 bg-secondary/50 rounded-md">{aiInsights.capaEffectivenessObservations}</pre>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-1">Suggested Focus Areas:</h3>
                <pre className="whitespace-pre-wrap text-sm p-3 bg-secondary/50 rounded-md">{aiInsights.suggestedFocusAreas}</pre>
              </div>
              {aiInsights.positiveObservations && (
                <div>
                  <h3 className="font-semibold text-primary mb-1">Positive Observations:</h3>
                  <pre className="whitespace-pre-wrap text-sm p-3 bg-secondary/50 rounded-md">{aiInsights.positiveObservations}</pre>
                </div>
              )}
               <Alert variant="info" className="mt-4 text-xs">
                <BrainCircuit className="h-4 w-4" />
                <AlertTitle>Note on AI Insights</AlertTitle>
                <UIAlertDescription>
                  These insights are AI-generated based on a summary of audit data from Firestore.
                  Always use professional judgment when interpreting AI-generated information.
                </UIAlertDescription>
              </Alert>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAiInsightsModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
