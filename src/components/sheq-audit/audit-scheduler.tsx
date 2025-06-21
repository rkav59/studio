

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import type { SheqAudit, ChecklistItemTemplate, ChecklistTemplate } from "@/lib/types";
import { PlusCircle, CalendarDays, ListChecks, PlayCircle, Edit2, BookOpenCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
// Removed direct import of defaultChecklistTemplates, will be passed as prop

interface AuditSchedulerProps {
  scheduledAudits: SheqAudit[];
  allChecklistTemplates: ChecklistTemplate[]; // Now accepts all templates
  onScheduleAudit: (auditData: Omit<SheqAudit, 'id' | 'status' | 'checklist' | 'nonConformances' | 'overallFindings' | 'recommendations'>, initialChecklistItems: ChecklistItemTemplate[]) => void;
  onStartAudit: (auditId: string) => void;
}

const auditTypes: SheqAudit['auditType'][] = ['Safety', 'Health', 'Environment', 'Quality', 'Integrated'];

export function AuditScheduler({ scheduledAudits, allChecklistTemplates, onScheduleAudit, onStartAudit }: AuditSchedulerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAuditName, setNewAuditName] = useState("");
  const [newAuditType, setNewAuditType] = useState<SheqAudit['auditType'] | undefined>(undefined);
  const [newAuditScope, setNewAuditScope] = useState("");
  const [newAuditDate, setNewAuditDate] = useState("");
  const [newAuditor, setNewAuditor] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(allChecklistTemplates.find(t => t.name.includes('Blank'))?.id || (allChecklistTemplates.length > 0 ? allChecklistTemplates[0].id : ""));


  const { toast } = useToast();

  const handleSchedule = () => {
    if (newAuditName && newAuditType && newAuditScope && newAuditDate && newAuditor && selectedTemplateId) {
      const selectedTemplate = allChecklistTemplates.find(t => t.id === selectedTemplateId);
      const initialItems = selectedTemplate ? selectedTemplate.items : [{id: `custom-${Date.now()}`, text: 'Custom Item 1 (Edit me)'}];
      
      onScheduleAudit(
        {
          auditName: newAuditName,
          auditType: newAuditType,
          scope: newAuditScope,
          auditDate: new Date(newAuditDate).toISOString(),
          auditor: newAuditor,
          templateIdUsed: selectedTemplateId,
        }, 
        initialItems
      );
      // Reset form
      setNewAuditName("");
      setNewAuditType(undefined);
      setNewAuditScope("");
      setNewAuditDate("");
      setNewAuditor("");
      setSelectedTemplateId(allChecklistTemplates.find(t => t.name.includes('Blank'))?.id || (allChecklistTemplates.length > 0 ? allChecklistTemplates[0].id : ""));
      setIsModalOpen(false);
      toast({ title: "Audit Scheduled", description: `${newAuditName} for ${newAuditScope} has been scheduled.` });
    } else {
      toast({ title: "Error Scheduling", description: "Please fill all fields to schedule an audit.", variant: "destructive" });
    }
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

  const pendingAudits = scheduledAudits.filter(audit => audit.status === 'Planned' || audit.status === 'In Progress');

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Audit Program</CardTitle>
          <CardDescription>Schedule new audits and manage upcoming ones. Select a checklist template to start.</CardDescription>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Schedule New Audit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New SHEQ Audit</DialogTitle>
              <DialogDescription>Enter details for the new audit and select a checklist template. Click schedule when you're done.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="auditName" className="text-right">Name/Title</Label>
                <Input id="auditName" value={newAuditName} onChange={(e) => setNewAuditName(e.target.value)} className="col-span-3" placeholder="e.g., Q3 Warehouse Safety Audit" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="auditType" className="text-right">Type</Label>
                <Select onValueChange={(value) => setNewAuditType(value as SheqAudit['auditType'])} value={newAuditType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select audit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {auditTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="auditScope" className="text-right">Scope</Label>
                <Input id="auditScope" value={newAuditScope} onChange={(e) => setNewAuditScope(e.target.value)} className="col-span-3" placeholder="e.g., All warehouse operations" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="auditDate" className="text-right">Date</Label>
                <Input id="auditDate" type="date" value={newAuditDate} onChange={(e) => setNewAuditDate(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="auditor" className="text-right">Auditor(s)</Label>
                <Input id="auditor" value={newAuditor} onChange={(e) => setNewAuditor(e.target.value)} className="col-span-3" placeholder="e.g., John Doe, Lead Auditor" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="checklistTemplate" className="text-right">Checklist</Label>
                <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select checklist template" />
                  </SelectTrigger>
                  <SelectContent>
                    {allChecklistTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.name} {template.isSystemDefault ? "(System)" : "(Custom)"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button type="button" onClick={handleSchedule} className="bg-primary hover:bg-primary/90">Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {pendingAudits.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No audits currently planned or in progress.</p>
        ) : (
          <ul className="space-y-4">
            {pendingAudits.map((audit) => (
              <li key={audit.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow bg-secondary/30">
                <div className="flex-grow mb-2 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <BookOpenCheck className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{audit.auditName} <span className="text-xs text-muted-foreground">({audit.auditType})</span></h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Scope: {audit.scope}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" /> Scheduled for: {format(new Date(audit.auditDate), "PPP")}
                  </p>
                  <p className="text-sm text-muted-foreground">Auditor(s): {audit.auditor}</p>
                  <p className={`text-xs font-medium ${getStatusColor(audit.status)}`}>Status: {audit.status}</p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0 self-start sm:self-center">
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Edit Audit", description: "Full audit editing (including checklist modification before start) will be available in a future update." })}>
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  {audit.status === 'Planned' && (
                    <Button variant="default" size="sm" onClick={() => onStartAudit(audit.id)} className="bg-green-600 hover:bg-green-700">
                      <PlayCircle className="h-3 w-3 mr-1" /> Start Audit
                    </Button>
                  )}
                   {audit.status === 'In Progress' && (
                    <Button variant="default" size="sm" onClick={() => onStartAudit(audit.id)} className="bg-yellow-500 hover:bg-yellow-600">
                      <PlayCircle className="h-3 w-3 mr-1" /> Continue Audit
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

    
