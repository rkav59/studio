

"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuditScheduler } from '@/components/sheq-audit/audit-scheduler';
import { AuditExecutionForm } from '@/components/sheq-audit/audit-execution-form';
import type { SheqAudit, AuditChecklistItem, ChecklistItemTemplate, NonConformance, AnalyzeAuditDataInput, AnalyzeAuditDataOutput, ChecklistTemplate, AuditObservationEntry } from "@/lib/types";
import { defaultChecklistTemplates } from '@/lib/checklist-templates';
import { Separator } from '@/components/ui/separator';
import { format, isValid, parseISO, isBefore } from 'date-fns';
import { ChevronLeft, Eye, ListChecks, CheckSquare, BrainCircuit, Sparkles, Loader2, LinkIcon, Filter, BookCheck, SearchCheck, FileCheck2, Download, Archive, ArchiveRestore, Search } from "lucide-react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import Link from 'next/link';

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
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  const [currentAudit, setCurrentAudit] = useState<SheqAudit | null>(null);
  const [viewingAuditDetails, setViewingAuditDetails] = useState<SheqAudit | null>(null);
  
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AnalyzeAuditDataOutput | null>(null);
  const [isAiInsightsModalOpen, setIsAiInsightsModalOpen] = useState(false);
  const [completedAuditFilterType, setCompletedAuditFilterType] = useState<SheqAudit['auditType'] | 'All'>('All');
  const [archivedSearchTerm, setArchivedSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const canScheduleAndManage = useMemo(() => user?.email === 'sentriq263@gmail.com' || (userProfile && ['admin', 'she_officer'].includes(userProfile.role)), [user, userProfile]);
  const canExecute = useMemo(() => user?.email === 'sentriq263@gmail.com' || (userProfile && ['admin', 'she_officer', 'she_rep'].includes(userProfile.role)), [user, userProfile]);


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
          isArchived: data.isArchived || false, // Ensure isArchived exists
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
        isArchived: false,
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
    onError: (error) => {
      const userFriendlyMessage = "An unexpected error occurred while scheduling the audit. Please try again.";
      toast({ title: "Error Scheduling Audit", description: userFriendlyMessage, variant: "destructive" });
    },
  });

  const updateAuditMutation = useMutation({
    mutationFn: async (executedAudit: SheqAudit): Promise<SheqAudit> => {
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
      return executedAudit;
    },
    onSuccess: (variables: SheqAudit) => {
        queryClient.invalidateQueries({ queryKey: [SHEQ_AUDITS_COLLECTION, user?.uid] });
        toast({
          title: variables.status === 'Completed' ? "Audit Completed" : "Audit Progress Saved",
          description: `Audit "${variables.auditName}" has been ${variables.status === 'Completed' ? 'completed' : 'saved'}.`,
        });
        if (variables.status === 'Completed') {
            setCurrentAudit(null);
        }
    },
    onError: (error) => {
      const userFriendlyMessage = "An unexpected error occurred while updating the audit. Please try again.";
      toast({ title: "Error Updating Audit", description: userFriendlyMessage, variant: "destructive" });
    },
  });

  const archiveAuditMutation = useMutation({
    mutationFn: async ({ auditId, archiveStatus }: { auditId: string, archiveStatus: boolean }) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const auditRef = doc(db, SHEQ_AUDITS_COLLECTION, auditId);
      await updateDoc(auditRef, { isArchived: archiveStatus });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SHEQ_AUDITS_COLLECTION, user?.uid] });
      toast({
        title: `Audit ${variables.archiveStatus ? 'Archived' : 'Restored'}`,
        description: `The audit has been successfully ${variables.archiveStatus ? 'archived' : 'restored'}.`,
      });
    },
    onError: (error) => {
      const userFriendlyMessage = "An unexpected error occurred while updating the audit. Please try again.";
      toast({ title: "Error Updating Audit", description: userFriendlyMessage, variant: "destructive" });
    },
  });

  const handleScheduleAudit = (
    newAuditData: Omit<SheqAudit, 'id' | 'status' | 'checklist' | 'nonConformances' | 'overallFindings' | 'recommendations' | 'userId'>,
    initialChecklistItemsFromTemplate: ChecklistItemTemplate[]
  ) => {
    addAuditMutation.mutate({ newAuditData, initialChecklistItemsFromTemplate });
  };

  const handleStartAudit = (auditId: string) => {
    if (!canExecute) {
      toast({ title: "Permission Denied", description: "You do not have permission to start audits.", variant: "destructive" });
      return;
    }
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
            ...getDefaultNonConformanceValues(),
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
      const userFriendlyMessage = "Failed to generate insights. The AI service may be temporarily unavailable. Please try again.";
      console.error("Error generating AI audit insights:", error);
      toast({ title: "AI Insights Error", description: userFriendlyMessage, variant: "destructive"});
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
  
  const oneYearAgo = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date;
  }, []);

  const { activeCompletedAudits, archivedAudits } = useMemo(() => {
    const active: SheqAudit[] = [];
    const archived: SheqAudit[] = [];
    
    audits
      .filter(a => (a.status === 'Completed' || a.status === 'Closed') && 
                   (completedAuditFilterType === 'All' || a.auditType === completedAuditFilterType))
      .forEach(audit => {
        const auditDate = parseISO(audit.auditDate);
        if (audit.isArchived) { // Manually archived
          archived.push(audit);
        } else if (isValid(auditDate) && isBefore(auditDate, oneYearAgo)) { // Auto-archived by date
          archived.push(audit);
        } else { // Active completed
          active.push(audit);
        }
      });
      
    return { activeCompletedAudits: active, archivedAudits: archived };
  }, [audits, completedAuditFilterType, oneYearAgo]);
  
  const filteredActiveCompletedAudits = useMemo(() => {
    if (!activeSearchTerm) {
      return activeCompletedAudits.slice(0, 10); // Limit to 10 by default
    }
    const lowercasedTerm = activeSearchTerm.toLowerCase();
    return activeCompletedAudits.filter(audit =>
      audit.auditName.toLowerCase().includes(lowercasedTerm) ||
      audit.auditType.toLowerCase().includes(lowercasedTerm) ||
      audit.scope.toLowerCase().includes(lowercasedTerm) ||
      audit.auditor.toLowerCase().includes(lowercasedTerm)
    );
  }, [activeCompletedAudits, activeSearchTerm]);

  const filteredArchivedAudits = useMemo(() => {
    if (!archivedSearchTerm) {
      return archivedAudits;
    }
    const lowercasedTerm = archivedSearchTerm.toLowerCase();
    return archivedAudits.filter(audit =>
      audit.auditName.toLowerCase().includes(lowercasedTerm) ||
      audit.auditType.toLowerCase().includes(lowercasedTerm) ||
      audit.scope.toLowerCase().includes(lowercasedTerm) ||
      audit.auditor.toLowerCase().includes(lowercasedTerm)
    );
  }, [archivedAudits, archivedSearchTerm]);

  const handleDownloadAuditReport = (audit: SheqAudit) => {
    const formatIso = (dateString?: string) => dateString ? format(parseISO(dateString), 'PPP') : 'N/A';

    const checklistHtml = audit.checklist?.map((item, index) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top;">${item.text || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top;">${item.status || 'Pending'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top;">${item.evidenceNotes || ''}<br/><strong>Comments:</strong> ${item.comments || ''}</td>
      </tr>
    `).join('') || '<tr><td colspan="4">No checklist items found.</td></tr>';

    const nonConformancesHtml = audit.nonConformances?.map((nc, index) => `
      <div style="margin-bottom: 15px; page-break-inside: avoid;">
        <h4>Non-Conformance #${index + 1}: ${nc.description}</h4>
        <p><strong>Severity:</strong> ${nc.severity}</p>
        <p><strong>Proposed Corrective Action:</strong> ${nc.correctiveActionsProposed || 'N/A'}</p>
        <p><strong>Proposed Preventive Action:</strong> ${nc.preventiveActionsProposed || 'N/A'}</p>
        <p><strong>Assigned To:</strong> ${nc.actionAssignedTo || 'N/A'}</p>
        <p><strong>Due Date:</strong> ${formatIso(nc.actionDueDate)}</p>
        <p><strong>Status:</strong> ${nc.actionStatus || 'Open'}</p>
      </div>
    `).join('') || '<p>No non-conformances recorded.</p>';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Audit Report: ${audit.auditName}</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; color: #333; }
              h1, h2, h3, h4 { color: #2c3e50; }
              h1 { font-size: 24px; border-bottom: 2px solid #3498DB; padding-bottom: 5px; }
              h2 { font-size: 20px; margin-top: 30px; color: #3498DB; border-bottom: 1px solid #ccc; padding-bottom: 3px;}
              h3 { font-size: 16px; margin-top: 20px; color: #E67E22; }
              h4 { font-size: 14px; margin-top: 15px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .section { margin-bottom: 25px; page-break-inside: avoid; }
              .summary-box { background-color: #f9f9f9; border: 1px dashed #ccc; padding: 15px; margin-top: 10px; }
          </style>
      </head>
      <body>
          <h1>Audit Report</h1>
          <div class="section">
              <h2>Audit Details</h2>
              <p><strong>Audit Title:</strong> ${audit.auditName}</p>
              <p><strong>Audit Type:</strong> ${audit.auditType}</p>
              <p><strong>Scope:</strong> ${audit.scope}</p>
              <p><strong>Date:</strong> ${formatIso(audit.auditDate)}</p>
              <p><strong>Auditor(s):</strong> ${audit.auditor}</p>
              <p><strong>Status:</strong> ${audit.status}</p>
          </div>

          <div class="section">
            <h2>Overall Summary</h2>
            <div class="summary-box">
              <h3>Overall Findings</h3>
              <p>${audit.overallFindings || 'No overall findings recorded.'}</p>
              <br/>
              <h3>Recommendations</h3>
              <p>${audit.recommendations || 'No recommendations recorded.'}</p>
            </div>
          </div>
          
          <div class="section">
            <h2>Non-Conformances</h2>
            ${nonConformancesHtml}
          </div>

          <div class="section">
            <h2>Checklist Details</h2>
            <table>
              <thead>
                <tr>
                  <th style="width:5%;">#</th>
                  <th style="width:40%;">Checklist Item</th>
                  <th style="width:15%;">Status</th>
                  <th style="width:40%;">Evidence & Comments</th>
                </tr>
              </thead>
              <tbody>
                ${checklistHtml}
              </tbody>
            </table>
          </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const fileName = `Audit_Report_${audit.auditName.replace(/\s/g, '_')}_${formatIso(audit.auditDate)}.html`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Report Downloaded", description: `${fileName} has been downloaded. You can open it with Microsoft Word.` });
  };


  if (isLoadingAudits || isLoadingUserTemplates) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading SHEQ Audit data...</p>
      </div>
    );
  }

  if (auditsError || userTemplatesError) {
    return <div className="text-red-500 text-center py-10">Error loading data. Please try again later.</div>;
  }

  return (
    <div className="space-y-6">
      {!currentAudit ? (
        <>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                  <FileCheck2 className="h-8 w-8"/> SHEQ Audits
              </h1>
              <Button onClick={handleGenerateAiInsights} disabled={isAiInsightsLoading || audits.length === 0} variant="outline" className="border-accent text-accent hover:bg-accent/10">
                  {isAiInsightsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  AI Audit Insights
              </Button>
            </div>
            <p className="text-muted-foreground">Ensure compliance and drive continuous improvement across SHEQ. Data now in Firestore.</p>
            <p className="text-muted-foreground">
                This module facilitates the planning, execution, and tracking of SHEQ audits, with all data stored in Firebase Firestore. 
                Select from default or custom checklist templates. During execution, customize items, log responsible persons, multiple observations, and comments. Document non-conformances with CAPA details.
                Checklist items now include fields for audit criteria and evidence gathering to align with ISO 19011 principles.
            </p>
          </div>

           <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="#audit-program">Audit Program</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="#completed-audits">Completed Audits</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="#archived-audits">Archived Audits</Link>
              </Button>
            </CardContent>
          </Card>

          <Separator />
          
          <div id="audit-program">
            <AuditScheduler
              scheduledAudits={audits.filter(a => a.status === 'Planned' || a.status === 'In Progress')}
              allChecklistTemplates={allChecklistTemplatesForScheduler} 
              onScheduleAudit={handleScheduleAudit}
              onStartAudit={handleStartAudit}
              canSchedule={canScheduleAndManage}
              canExecute={canExecute}
            />
          </div>
          
          
            <Card id="completed-audits" className="shadow-lg mt-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2"><CheckSquare className="h-6 w-6 text-primary"/>Completed/Closed Audits</CardTitle>
                        <CardDescription>Review recent past audit records. Older audits are automatically archived.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search active audits..."
                                className="pl-8 w-full sm:w-[250px]"
                                value={activeSearchTerm}
                                onChange={(e) => setActiveSearchTerm(e.target.value)}
                            />
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
                </div>
              </CardHeader>
              <CardContent>
                {filteredActiveCompletedAudits.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                        {activeSearchTerm 
                            ? "No matching active audits found." 
                            : completedAuditFilterType === 'All' 
                                ? "No recent audits completed or closed." 
                                : `No recent ${completedAuditFilterType} audits completed or closed.`
                        }
                    </p>
                ) : (
                <ul className="space-y-3">
                  {filteredActiveCompletedAudits.map(audit => (
                    <li key={audit.id} className="p-3 border rounded-md bg-secondary/30 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="flex-grow">
                        <p className="font-medium">{audit.auditName} <span className="text-xs text-muted-foreground">({audit.auditType})</span></p>
                        <p className="text-sm text-muted-foreground">Scope: {audit.scope}</p>
                        <p className="text-xs text-muted-foreground">Date: {format(parseISO(audit.auditDate), "PPP")} | Auditor(s): {audit.auditor}</p>
                        <p className={`text-xs font-medium ${getStatusColor(audit.status)}`}>Status: {audit.status}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 self-start sm:self-auto">
                        <Button variant="outline" size="sm" onClick={() => setViewingAuditDetails(audit)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Button>
                         <Button variant="outline" size="sm" onClick={() => handleDownloadAuditReport(audit)}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => archiveAuditMutation.mutate({ auditId: audit.id, archiveStatus: true })} disabled={archiveAuditMutation.isPending && archiveAuditMutation.variables?.auditId === audit.id}>
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                )}
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full" id="archived-audits">
              <AccordionItem value="archived-audits">
                <Card className="shadow-lg mt-6">
                  <AccordionTrigger className="p-6 w-full">
                      <CardTitle className="flex items-center gap-2 text-muted-foreground"><Archive className="h-6 w-6"/>Archived Audits ({archivedAudits.length})</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent>
                        <div className="relative mb-4">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search archived audits by name, type, scope..."
                                className="pl-8"
                                value={archivedSearchTerm}
                                onChange={(e) => setArchivedSearchTerm(e.target.value)}
                            />
                        </div>

                        {filteredArchivedAudits.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                              {archivedSearchTerm ? "No matching archived audits found." : "No audits have been archived."}
                            </p>
                        ) : (
                          <ScrollArea className="max-h-[60vh]">
                            <ul className="space-y-3 pr-4">
                              {filteredArchivedAudits.map(audit => (
                                <li key={audit.id} className="p-3 border rounded-md bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                  <div className="flex-grow">
                                    <p className="font-medium">{audit.auditName} <span className="text-xs text-muted-foreground">({audit.auditType})</span></p>
                                    <p className="text-xs text-muted-foreground">Date: {format(parseISO(audit.auditDate), "PPP")} | Auditor(s): {audit.auditor}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 self-start sm:self-auto">
                                    <Button variant="outline" size="sm" onClick={() => setViewingAuditDetails(audit)}>View</Button>
                                    <Button variant="outline" size="sm" onClick={() => archiveAuditMutation.mutate({ auditId: audit.id, archiveStatus: false })} disabled={archiveAuditMutation.isPending && archiveAuditMutation.variables?.auditId === audit.id}>
                                        <ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </ScrollArea>
                        )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
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
                <UIAlertTitle>Note on AI Insights</UIAlertTitle>
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
