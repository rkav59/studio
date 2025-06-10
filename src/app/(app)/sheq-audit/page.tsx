

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
import { ChevronLeft, Eye, ListChecks, CheckSquare, BrainCircuit, Sparkles, Loader2, LinkIcon, User, FileText, MessageSquare, ListPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { analyzeSheqAuditData } from '@/ai/flows/analyze-audit-data-flow';
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from '@/components/ui/alert';


const LOCAL_STORAGE_KEY_AUDITS = 'sheild-sheq-audits-v6'; 
const USER_TEMPLATES_STORAGE_KEY = 'sheild-user-checklist-templates-v1'; 

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
  const [audits, setAudits] = useState<SheqAudit[]>([]);
  const [currentAudit, setCurrentAudit] = useState<SheqAudit | null>(null);
  const [viewingAuditDetails, setViewingAuditDetails] = useState<SheqAudit | null>(null);
  
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AnalyzeAuditDataOutput | null>(null);
  const [isAiInsightsModalOpen, setIsAiInsightsModalOpen] = useState(false);

  const [userChecklistTemplates, setUserChecklistTemplates] = useState<ChecklistTemplate[]>([]);

  useEffect(() => {
    try {
      const storedUserTemplates = localStorage.getItem(USER_TEMPLATES_STORAGE_KEY);
      if (storedUserTemplates) {
        setUserChecklistTemplates(JSON.parse(storedUserTemplates));
      }
    } catch (error) {
      console.error("Error loading user checklist templates from localStorage:", error);
    }
    
    try {
      const storedAudits = localStorage.getItem(LOCAL_STORAGE_KEY_AUDITS);
      if (storedAudits) {
        const parsedAudits: SheqAudit[] = JSON.parse(storedAudits);
        const migratedAudits = parsedAudits.map(audit => ({
          ...audit,
          checklist: (audit.checklist || []).map(item => {
            let newObservations: AuditObservationEntry[] = [];
            if (Array.isArray(item.observations)) {
                newObservations = item.observations.map(obs => typeof obs === 'string' ? {id: crypto.randomUUID(), text: obs} : {...obs, id: obs.id || crypto.randomUUID()});
            } else if (typeof (item as any).observation === 'string' && (item as any).observation.trim() !== '') { // Migration from single observation string
                newObservations = [{id: crypto.randomUUID(), text: (item as any).observation}];
            }

            return {
              ...item,
              responsiblePerson: item.responsiblePerson || '',
              observations: newObservations,
              comments: item.comments || '',
            };
          }),
          nonConformances: (audit.nonConformances || []).map(nc => ({
            ...getDefaultNonConformance(), 
            ...nc, 
            id: nc.id || crypto.randomUUID(), 
          }))
        }));
        setAudits(migratedAudits);
      } else {
        // Clean up old versions if any
        const oldKeys = ['sheild-sheq-audits-v1', 'sheild-sheq-audits-v2', 'sheild-sheq-audits-v3', 'sheild-sheq-audits-v4', 'sheild-sheq-audits-v5'];
        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                console.warn(`SHEild: SHEQ Audit data from '${key}' was cleared due to structure update to '${LOCAL_STORAGE_KEY_AUDITS}'. Please re-enter if needed.`);
                localStorage.removeItem(key);
            }
        });
      }
    } catch (error) {
      console.error("Error loading SHEQ audits from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUDITS, JSON.stringify(audits));
    } catch (error) {
      console.error("Error saving SHEQ audits to localStorage:", error);
    }
  }, [audits]);

  const allChecklistTemplatesForScheduler = useMemo(() => {
    const systemTemplates = defaultChecklistTemplates.map(t => ({ ...t, isSystemDefault: true }));
    const customTemplates = userChecklistTemplates.map(t => ({ ...t, isSystemDefault: false }));
    return [...systemTemplates, ...customTemplates];
  }, [userChecklistTemplates]);


  const handleScheduleAudit = (
    newAuditData: Omit<SheqAudit, 'id' | 'status' | 'checklist' | 'nonConformances' | 'overallFindings' | 'recommendations'>,
    initialChecklistItemsFromTemplate: ChecklistItemTemplate[]
  ) => {
    const newAudit: SheqAudit = {
      id: crypto.randomUUID(), 
      ...newAuditData,
      status: "Planned",
      checklist: initialChecklistItemsFromTemplate.map(templateItem => {
        const initialObservations: AuditObservationEntry[] = [];
        if (templateItem.observationPrompt) {
          initialObservations.push({ id: crypto.randomUUID(), text: templateItem.observationPrompt });
        }
        return {
          id: crypto.randomUUID(), 
          text: templateItem.text,
          status: 'Pending',
          evidenceOrRemarks: '',
          responsiblePerson: templateItem.defaultResponsiblePerson || '',
          observations: initialObservations,
          comments: templateItem.defaultComments || '',
        };
      }),
      nonConformances: [], 
      overallFindings: '',
      recommendations: '',
    };
    setAudits(prev => [newAudit, ...prev]);
  };

  const handleStartAudit = (auditId: string) => {
    const auditToStart = audits.find(a => a.id === auditId);
    if (auditToStart) {
      setCurrentAudit({ 
        ...auditToStart, 
        status: 'In Progress',
        checklist: (auditToStart.checklist || []).map(item => ({
            ...item,
            responsiblePerson: item.responsiblePerson || '',
            observations: Array.isArray(item.observations) ? item.observations.map(obs => ({...obs, id: obs.id || crypto.randomUUID()})) : [],
            comments: item.comments || '',
        })),
        nonConformances: (auditToStart.nonConformances || []).map(nc => ({
            ...getDefaultNonConformance(),
            ...nc,
            id: nc.id || crypto.randomUUID(),
        }))
      });
    }
  };

  const handleSaveAuditExecution = (executedAudit: SheqAudit) => {
    setAudits(prev =>
      prev.map(a => (a.id === executedAudit.id ? executedAudit : a))
    );
    setCurrentAudit(null); 
  };
  
  const handleBackToScheduler = () => {
    if (currentAudit && currentAudit.status === 'In Progress') {
        // Optionally save progress if any changes were made but not formally completed
    }
    setCurrentAudit(null);
  };

  const handleGenerateAiInsights = async () => {
    if (audits.length === 0) {
      toast({
        title: "No Audit Data",
        description: "Please log some audits before generating AI insights.",
        variant: "default"
      });
      return;
    }
    setIsAiInsightsLoading(true);
    setAiInsights(null);

    const completedAuditsForInsight = audits.filter(a => a.status === 'Completed' || a.status === 'Closed');

    const nonConformanceDescriptions: string[] = [];
    const failedChecklistItemsText: string[] = [];
    const capaStatusCounts = { open: 0, inProgress: 0, completed: 0, overdue: 0 };
    const overallFindingsSummary: string[] = [];
    const overallRecommendationsSummary: string[] = [];

    completedAuditsForInsight.forEach(audit => {
      audit.nonConformances.forEach(nc => {
        if(nc.description) nonConformanceDescriptions.push(nc.description);
        const status = nc.actionStatus || 'Open';
        capaStatusCounts[status.toLowerCase().replace(/\s+/g, '') as keyof typeof capaStatusCounts]++;
      });
      audit.checklist.forEach(item => {
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
      toast({
        title: "AI Insights Generated",
        description: "Review the AI-powered analysis of your audit data.",
      });
    } catch (error) {
      console.error("Error generating AI audit insights:", error);
      toast({
        title: "AI Insights Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
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
      // 'In Progress' for CAPA shares with audit status
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
  
  const completedAudits = audits.filter(a => a.status === 'Completed' || a.status === 'Closed');


  return (
    <div className="space-y-6">
      {!currentAudit ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline">SHEQ Audits</h1>
            <Button onClick={handleGenerateAiInsights} disabled={isAiInsightsLoading || audits.length === 0} variant="outline" className="border-accent text-accent hover:bg-accent/10">
              {isAiInsightsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              AI Audit Insights
            </Button>
          </div>
          <Card className="shadow-lg overflow-hidden">
            <div className="relative h-60 w-full">
                <Image 
                    src="https://placehold.co/1200x400.png" 
                    alt="Auditor reviewing documents with a checklist" 
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint="audit review checklist"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                    <h2 className="text-2xl font-semibold text-white font-headline">Comprehensive Auditing</h2>
                    <p className="text-sm text-neutral-300">Ensure compliance and drive continuous improvement across SHEQ.</p>
                </div>
            </div>
            <CardContent className="pt-6">
                <p className="text-muted-foreground">
                    This module facilitates the planning, execution, and tracking of Safety, Health, Environment, and Quality (SHEQ) audits. 
                    Select from default or custom checklist templates (manage in "Checklist Templates" - can include default observation prompts, responsible persons, and comments). During execution, customize items, log responsible persons, multiple observations, and comments. Document non-conformances with proposed CAPA details and optional Incident ID links.
                    Leverage AI insights to analyze trends from your audit data (current browser session).
                </p>
            </CardContent>
          </Card>
          
          <AuditScheduler
            scheduledAudits={audits.filter(a => a.status === 'Planned' || a.status === 'In Progress')}
            allChecklistTemplates={allChecklistTemplatesForScheduler} 
            onScheduleAudit={handleScheduleAudit}
            onStartAudit={handleStartAudit}
          />
          
          {completedAudits.length > 0 && (
            <Card className="shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckSquare className="h-6 w-6 text-primary"/>Completed/Closed Audits</CardTitle>
                <CardDescription>Review past audit records, including checklist items (responsible person, observations, comments), non-conformances, CAPA details, and linked Incident IDs.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {completedAudits.slice(0, 5).map(audit => (
                    <li key={audit.id} className="p-3 border rounded-md bg-secondary/30 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="flex-grow">
                        <p className="font-medium">{audit.auditName} <span className="text-xs text-muted-foreground">({audit.auditType})</span></p>
                        <p className="text-sm text-muted-foreground">Scope: {audit.scope}</p>
                        <p className="text-xs text-muted-foreground">Date: {format(new Date(audit.auditDate), "PPP")} | Auditor: {audit.auditor}</p>
                        <p className={`text-xs font-semibold ${getStatusColor(audit.status)}`}>Status: {audit.status}</p>
                      </div>
                       <Button variant="outline" size="sm" onClick={() => setViewingAuditDetails(audit)} className="mt-2 sm:mt-0 self-start sm:self-auto">
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </Button>
                    </li>
                  ))}
                </ul>
                {completedAudits.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">And {completedAudits.length - 5} more...</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="mt-6 shadow-lg">
            <CardHeader>
                <CardTitle>Audit Management Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mt-2 mb-2">
                Current prototype features:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Audit scheduling with selection from system default and user-created checklist templates (manage custom ones in "Checklist Templates"). User templates can include initial observation prompts, default responsible persons, and default comments.</li>
                <li>List view of planned, in-progress, and completed/closed audits.</li>
                <li>Audit execution form allowing:
                    <ul className="list-disc list-inside pl-6">
                        <li>Editing text of individual checklist items.</li>
                        <li>Adding new checklist items dynamically during execution.</li>
                        <li>Removing checklist items.</li>
                        <li>Updating status and old remarks/evidence for each checklist item.</li>
                        <li>Input for 'Responsible Person', multiple 'Observations', and 'Comments' for each checklist item. Observations can be added/removed dynamically per item. Initial observation, responsible person, and comments may be pre-filled from template defaults.</li>
                    </ul>
                </li>
                <li>Non-conformance logging with description, severity, optional link to checklist item, and an optional field for "Related Incident ID".</li>
                <li>Detailed CAPA documentation for each Non-Conformance (Proposed Corrective/Preventive Actions, Assigned To, Due Date, Status, Completion Date, Verification Notes).</li>
                <li>Recording overall audit findings and recommendations.</li>
                <li>Viewing detailed information for completed/closed audits, including all checklist items with their details (responsible person, observations, comments), non-conformances, their CAPA details, and any linked Incident ID.</li>
                <li>AI-powered insights generation based on the summary of audit data currently in the browser session.</li>
                <li>Data persistence using browser's local storage for audits and custom templates.</li>
              </ul>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground mt-2 mb-2">
                Future enhancements could include:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Full calendar view for audit program scheduling.</li>
                  <li>Dedicated CAPA tracking module/page with advanced filtering, dashboards, and notifications for overdue actions.</li>
                  <li>More advanced AI trend analysis over historical data (requires backend).</li>
                  <li>Automated report generation (e.g., PDF) and distribution.</li>
                  <li>User roles and permissions for audit management.</li>
                  <li>True bi-directional linking between modules (e.g., clicking an Incident ID in an audit takes you to the Incident module).</li>
              </ul>
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
              Complete the checklist, log non-conformances (including CAPA details), and record findings for the audit:
              <span className="font-semibold"> {currentAudit.scope}</span>, scheduled for <span className="font-semibold">{format(new Date(currentAudit.auditDate), "PPP")}</span> by <span className="font-semibold">{currentAudit.auditor}</span>.
              Checklist items can be edited, added, or removed. Each item supports multiple observations. Responsible person and comments can also be pre-filled from the template.
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
                        Date: {format(new Date(viewingAuditDetails.auditDate), "PPP")} | Auditor(s): {viewingAuditDetails.auditor} | Status: <span className={`font-semibold ${getStatusColor(viewingAuditDetails.status)}`}>{viewingAuditDetails.status}</span>
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
                                        {item.evidenceOrRemarks && <p className="text-xs text-muted-foreground mt-1">Old Remarks/Evidence: {item.evidenceOrRemarks}</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-muted-foreground italic">No checklist items recorded.</p>}
                    </section>

                    <Separator className="my-4"/>
                    
                    <section>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1 text-destructive">Non-Conformances & CAPA</h3>
                        {viewingAuditDetails.nonConformances.length > 0 ? (
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
                                                        description: `Navigating to Incident ID '${nc.relatedIncidentId}' is a planned feature. Full navigation will be implemented when incident data is globally accessible.`,
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
                Analysis of audit data currently stored in your browser.
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
              <Alert variant="info" className="mt-4">
                <BrainCircuit className="h-4 w-4" />
                <AlertTitle>Note on AI Insights</AlertTitle>
                <UIAlertDescription>
                  These insights are generated by an AI based on a summary of the audit data currently available in your browser.
                  For comprehensive trend analysis over time or across a larger dataset, a dedicated backend system and more sophisticated analytics would be beneficial.
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


    
