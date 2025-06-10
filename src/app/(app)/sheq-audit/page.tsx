
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { AuditScheduler } from '@/components/sheq-audit/audit-scheduler';
import { AuditExecutionForm } from '@/components/sheq-audit/audit-execution-form';
import type { SheqAudit, AuditChecklistItem, ChecklistItemTemplate, NonConformance } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { format, isValid, parseISO } from 'date-fns';
import { ChevronLeft, Eye, ListChecks, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

const LOCAL_STORAGE_KEY_AUDITS = 'sheild-sheq-audits-v3'; 

const getDefaultNonConformance = (): NonConformance => ({
  id: crypto.randomUUID(),
  description: "",
  severity: "Minor",
  relatedChecklistItemId: "",
  correctiveActionsProposed: "",
  preventiveActionsProposed: "",
  actionAssignedTo: "",
  actionDueDate: "",
  actionStatus: "Open",
  actionCompletionDate: "",
  actionVerificationNotes: "",
});


export default function SheqAuditPage() {
  const [audits, setAudits] = useState<SheqAudit[]>([]);
  const [currentAudit, setCurrentAudit] = useState<SheqAudit | null>(null);
  const [viewingAuditDetails, setViewingAuditDetails] = useState<SheqAudit | null>(null);

  useEffect(() => {
    try {
      const storedAudits = localStorage.getItem(LOCAL_STORAGE_KEY_AUDITS);
      if (storedAudits) {
        const parsedAudits: SheqAudit[] = JSON.parse(storedAudits);
        const migratedAudits = parsedAudits.map(audit => ({
          ...audit,
          nonConformances: (audit.nonConformances || []).map(nc => ({
            ...getDefaultNonConformance(), 
            ...nc, 
            id: nc.id || crypto.randomUUID(), 
          }))
        }));
        setAudits(migratedAudits);
      } else {
        const oldV2Key = 'sheild-sheq-audits-v2';
        if (localStorage.getItem(oldV2Key)) {
            console.warn(`SHEild: SHEQ Audit data from '${oldV2Key}' was cleared due to structure update for CAPA. Please re-enter if needed.`);
            localStorage.removeItem(oldV2Key);
        }
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

  const handleScheduleAudit = (
    newAuditData: Omit<SheqAudit, 'id' | 'status' | 'checklist' | 'nonConformances' | 'overallFindings' | 'recommendations'>,
    initialChecklistItems: ChecklistItemTemplate[]
  ) => {
    const newAudit: SheqAudit = {
      id: crypto.randomUUID(), 
      ...newAuditData,
      status: "Planned",
      checklist: initialChecklistItems.map(item => ({
        id: crypto.randomUUID(), 
        text: item.text,
        status: 'Pending',
        evidenceOrRemarks: '',
      })),
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
        setAudits(prev => prev.map(a => a.id === currentAudit.id ? {...currentAudit, status: 'In Progress'} : a));
    }
    setCurrentAudit(null);
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight font-headline">SHEQ Audits</h1>
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
                    Select from checklist templates, customize as needed, document findings, log non-conformances with proposed corrective/preventive actions (CAPA), and monitor progress.
                </p>
            </CardContent>
          </Card>
          
          <AuditScheduler
            scheduledAudits={audits.filter(a => a.status === 'Planned' || a.status === 'In Progress')}
            onScheduleAudit={handleScheduleAudit}
            onStartAudit={handleStartAudit}
          />
          
          {completedAudits.length > 0 && (
            <Card className="shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckSquare className="h-6 w-6 text-primary"/>Completed/Closed Audits</CardTitle>
                <CardDescription>Review past audit records, including non-conformances and CAPA details.</CardDescription>
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
                <li>Audit scheduling with selection from predefined checklist templates.</li>
                <li>List view of planned, in-progress, and completed/closed audits.</li>
                <li>Audit execution form allowing:
                    <ul className="list-disc list-inside pl-6">
                        <li>Editing text of individual checklist items.</li>
                        <li>Adding new checklist items dynamically during execution.</li>
                        <li>Removing checklist items.</li>
                        <li>Updating status and remarks for each checklist item.</li>
                    </ul>
                </li>
                <li>Non-conformance logging with description, severity, optional link to checklist item, and fields for:
                    <ul className="list-disc list-inside pl-6">
                        <li>Proposed Corrective Actions</li>
                        <li>Proposed Preventive Actions</li>
                        <li>Action Assigned To</li>
                        <li>Action Due Date</li>
                        <li>Action Status (Open, In Progress, Completed, Overdue)</li>
                        <li>Action Completion Date (if status is Completed)</li>
                        <li>Action Verification Notes (if status is Completed)</li>
                    </ul>
                </li>
                <li>Recording overall audit findings and recommendations.</li>
                <li>Viewing detailed information for completed/closed audits, including all checklist items, non-conformances, and their CAPA details.</li>
                <li>Data persistence using browser's local storage.</li>
              </ul>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground mt-2 mb-2">
                Future enhancements could include:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>User-creatable and editable master checklist templates (Checklist Builder).</li>
                  <li>Full calendar view for audit program scheduling.</li>
                  <li>Dedicated CAPA tracking module/page with advanced filtering, dashboards, and notifications for overdue actions.</li>
                  <li>AI-powered trend analysis and insights from audit data.</li>
                  <li>Offline audit capabilities for mobile devices.</li>
                  <li>Automated report generation (e.g., PDF) and distribution.</li>
                  <li>User roles and permissions for audit management.</li>
                  <li>Integration with other SHEQ modules (e.g., linking incidents to audits).</li>
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
              Checklist items can be edited, added, or removed below.
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
                                    <li key={item.id} className="p-3 border rounded-md bg-muted/30 text-sm">
                                        <p className="font-medium">Item {index + 1}: {item.text}</p>
                                        <p>Status: <span className={`font-semibold ${getChecklistItemStatusColor(item.status)}`}>{item.status}</span></p>
                                        {item.evidenceOrRemarks && <p className="text-xs text-muted-foreground mt-1">Remarks: {item.evidenceOrRemarks}</p>}
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
    </div>
  );
}

