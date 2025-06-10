
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { AuditScheduler } from '@/components/sheq-audit/audit-scheduler';
import { AuditExecutionForm } from '@/components/sheq-audit/audit-execution-form';
import type { SheqAudit } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react';

const LOCAL_STORAGE_KEY_AUDITS = 'sheild-sheq-audits-v1';

// Default checklist items for new audits
const defaultAuditChecklist = [
  { id: 'chk1', text: 'Is the safety policy documented and communicated?', status: 'Pending', evidenceOrRemarks: '' },
  { id: 'chk2', text: 'Are risk assessments up-to-date and reviewed regularly?', status: 'Pending', evidenceOrRemarks: '' },
  { id: 'chk3', text: 'Are emergency procedures established and tested?', status: 'Pending', evidenceOrRemarks: '' },
  { id: 'chk4', text: 'Is there a system for reporting incidents and near misses?', status: 'Pending', evidenceOrRemarks: '' },
  { id: 'chk5', text: 'Is PPE provided, maintained, and used correctly?', status: 'Pending', evidenceOrRemarks: '' },
  { id: 'chk6', text: 'Are training records maintained and up-to-date?', status: 'Pending', evidenceOrRemarks: '' },
  { id: 'chk7', text: 'Is there a process for managing contractors safely?', status: 'Pending', evidenceOrRemarks: '' },
  { id: 'chk8', text: 'Are hazardous substances identified, stored, and handled correctly?', status: 'Pending', evidenceOrRemarks: '' },
  { id: 'chk9', text: 'Are waste management procedures in place and followed?', status: 'Pending', evidenceOrRemarks: '' },
  { id: 'chk10', text: 'Is there evidence of continuous improvement in SHEQ performance?', status: 'Pending', evidenceOrRemarks: '' },
];


export default function SheqAuditPage() {
  const [audits, setAudits] = useState<SheqAudit[]>([]);
  const [currentAudit, setCurrentAudit] = useState<SheqAudit | null>(null);

  useEffect(() => {
    try {
      const storedAudits = localStorage.getItem(LOCAL_STORAGE_KEY_AUDITS);
      if (storedAudits) {
        setAudits(JSON.parse(storedAudits));
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
      // Consider user notification if storage is full
    }
  }, [audits]);

  const handleScheduleAudit = (newAuditData: Omit<SheqAudit, 'id' | 'status' | 'checklist' | 'nonConformances' | 'overallFindings' | 'recommendations'>) => {
    const newAudit: SheqAudit = {
      id: new Date().toISOString(), // Simple ID
      ...newAuditData,
      status: "Planned",
      checklist: defaultAuditChecklist.map(item => ({ ...item, id: `${item.id}-${Date.now()}` })), // Ensure unique IDs for checklist items
      nonConformances: [],
      overallFindings: '',
      recommendations: '',
    };
    setAudits(prev => [newAudit, ...prev]);
  };

  const handleStartAudit = (auditId: string) => {
    const auditToStart = audits.find(a => a.id === auditId);
    if (auditToStart) {
      setCurrentAudit({ ...auditToStart, status: 'In Progress' });
    }
  };

  const handleSaveAuditExecution = (executedAudit: SheqAudit) => {
    setAudits(prev =>
      prev.map(a => (a.id === executedAudit.id ? executedAudit : a))
    );
    setCurrentAudit(null);
  };
  
  const handleBackToScheduler = () => {
    setCurrentAudit(null);
  };

  const getStatusColor = (status: SheqAudit['status']) => {
    switch (status) {
      case 'Planned': return 'text-blue-500';
      case 'In Progress': return 'text-yellow-500';
      case 'Completed': return 'text-green-500';
      case 'Awaiting Review': return 'text-orange-500';
      case 'Closed': return 'text-gray-500';
      default: return 'text-muted-foreground';
    }
  };


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
                    data-ai-hint="audit review"
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
                    Document findings, assign corrective actions, and monitor progress to maintain high standards.
                </p>
            </CardContent>
          </Card>
          
          <AuditScheduler
            scheduledAudits={audits}
            onScheduleAudit={handleScheduleAudit}
            onStartAudit={handleStartAudit}
          />
          
          {audits.filter(a => a.status === 'Completed' || a.status === 'Closed').length > 0 && (
            <Card className="shadow-lg mt-6">
              <CardHeader>
                <CardTitle>Completed/Closed Audits</CardTitle>
                <CardDescription>Review past audit records.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {audits.filter(a => a.status === 'Completed' || a.status === 'Closed').slice(0, 5).map(audit => (
                    <li key={audit.id} className="p-3 border rounded-md bg-secondary/30 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{audit.auditName} <span className="text-xs text-muted-foreground">({audit.auditType})</span></p>
                        <p className="text-sm text-muted-foreground">Scope: {audit.scope}</p>
                        <p className="text-xs text-muted-foreground">Date: {format(new Date(audit.auditDate), "PPP")} | Auditor: {audit.auditor}</p>
                      </div>
                      <span className={`text-sm font-semibold ${getStatusColor(audit.status)}`}>{audit.status}</span>
                    </li>
                  ))}
                </ul>
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
                <li>Basic audit scheduling and list view.</li>
                <li>Audit execution with a default checklist.</li>
                <li>Non-conformance logging with severity levels.</li>
                <li>Recording overall findings and recommendations.</li>
                <li>Data persistence using browser's local storage (session-specific).</li>
              </ul>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground mt-2 mb-2">
                Future enhancements will include:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Full calendar view for audit program scheduling.</li>
                  <li>Customizable audit checklist library and builder.</li>
                  <li>Corrective and preventive action (CAPA) tracking from audit findings.</li>
                  <li>AI-powered trend analysis and insights from audit data.</li>
                  <li>Offline audit capabilities for mobile devices.</li>
                  <li>Automated report generation and distribution.</li>
                  <li>User roles and permissions for audit management.</li>
                  <li>Integration with other SHEQ modules.</li>
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
              Complete the checklist, log non-conformances, and record findings for the audit:
              <span className="font-semibold"> {currentAudit.scope}</span>, scheduled for <span className="font-semibold">{format(new Date(currentAudit.auditDate), "PPP")}</span> by <span className="font-semibold">{currentAudit.auditor}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditExecutionForm
              key={currentAudit.id} // Ensure form re-renders if currentAudit changes
              audit={currentAudit}
              onSaveAudit={handleSaveAuditExecution}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
