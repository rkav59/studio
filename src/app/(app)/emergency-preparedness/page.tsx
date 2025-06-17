
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit2, Trash2, Eye, Siren, FileText, Box, ShieldAlert, Activity, Users } from "lucide-react";
import Image from "next/image";
import { format, isValid, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { EmergencyPlanForm } from '@/components/emergency-preparedness/emergency-plan-form';
import { EmergencyResourceForm } from '@/components/emergency-preparedness/emergency-resource-form';
import { EmergencyResourceDetailsDialog } from '@/components/emergency-preparedness/emergency-resource-details-dialog';
import { MockDrillForm } from '@/components/emergency-preparedness/mock-drill-form';
import { MockDrillDetailsDialog } from '@/components/emergency-preparedness/mock-drill-details-dialog';
import type { EmergencyPlan, EmergencyResource, MockDrill } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const PLANS_STORAGE_KEY = 'sheild-emergency-plans-v1';
const RESOURCES_STORAGE_KEY = 'sheild-emergency-resources-v1';
const DRILLS_STORAGE_KEY = 'sheild-emergency-drills-v1';

export default function EmergencyPreparednessPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<EmergencyPlan[]>([]);
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EmergencyPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<EmergencyPlan | null>(null);

  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<EmergencyResource | null>(null);
  const [viewingResource, setViewingResource] = useState<EmergencyResource | null>(null);
  
  const [drills, setDrills] = useState<MockDrill[]>([]);
  const [isDrillFormOpen, setIsDrillFormOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<MockDrill | null>(null);
  const [viewingDrill, setViewingDrill] = useState<MockDrill | null>(null);


  useEffect(() => {
    try {
      const storedPlans = localStorage.getItem(PLANS_STORAGE_KEY);
      if (storedPlans) setPlans(JSON.parse(storedPlans));

      const storedResources = localStorage.getItem(RESOURCES_STORAGE_KEY);
      if (storedResources) setResources(JSON.parse(storedResources));
      
      const storedDrills = localStorage.getItem(DRILLS_STORAGE_KEY);
      if (storedDrills) setDrills(JSON.parse(storedDrills));

    } catch (error) {
      console.error("Error loading emergency preparedness data:", error);
      toast({ title: "Error", description: "Could not load data.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => { try { localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans)); } catch (e) { console.error("Error saving plans") } }, [plans]);
  useEffect(() => { try { localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(resources)); } catch (e) { console.error("Error saving resources") } }, [resources]);
  useEffect(() => { try { localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(drills)); } catch (e) { console.error("Error saving drills") } }, [drills]);


  // Plan Management
  const handleOpenNewPlanForm = () => { setEditingPlan(null); setIsPlanFormOpen(true); };
  const handleEditPlan = (plan: EmergencyPlan) => { setEditingPlan(plan); setIsPlanFormOpen(true); };
  const handleDeletePlan = (planId: string) => {
    if (drills.some(drill => drill.linkedPlanId === planId)) {
        toast({ title: "Cannot Delete Plan", description: "This plan is linked to mock drills. Please update or delete those drills first.", variant: "destructive", duration: 6000});
        return;
    }
    setPlans(prev => prev.filter(p => p.id !== planId));
    toast({ title: "Plan Deleted" });
  };
  const handleSavePlan = (data: Omit<EmergencyPlan, 'id'>) => {
    const action = editingPlan ? "Updated" : "Created";
    setPlans(prev => editingPlan ? prev.map(p => p.id === editingPlan.id ? { ...editingPlan, ...data } : p) : [{ id: crypto.randomUUID(), ...data }, ...prev]);
    toast({ title: `Plan ${action}`, description: `Plan "${data.planName}" ${action.toLowerCase()}.` });
    setIsPlanFormOpen(false); setEditingPlan(null);
  };
  
  // Resource Management
  const handleOpenNewResourceForm = () => { setEditingResource(null); setIsResourceFormOpen(true); };
  const handleEditResource = (resource: EmergencyResource) => { setEditingResource(resource); setIsResourceFormOpen(true); };
  const handleDeleteResource = (resourceId: string) => { setResources(prev => prev.filter(r => r.id !== resourceId)); toast({ title: "Resource Deleted" }); };
  const handleSaveResource = (data: Omit<EmergencyResource, 'id'>) => {
    const action = editingResource ? "Updated" : "Created";
    setResources(prev => editingResource ? prev.map(r => r.id === editingResource.id ? { ...editingResource, ...data } : r) : [{ id: crypto.randomUUID(), ...data }, ...prev]);
    toast({ title: `Resource ${action}`, description: `Resource "${data.name}" ${action.toLowerCase()}.` });
    setIsResourceFormOpen(false); setEditingResource(null);
  };

  // Drill Management
  const handleOpenNewDrillForm = () => { setEditingDrill(null); setIsDrillFormOpen(true); };
  const handleEditDrill = (drill: MockDrill) => { setEditingDrill(drill); setIsDrillFormOpen(true); };
  const handleDeleteDrill = (drillId: string) => { setDrills(prev => prev.filter(d => d.id !== drillId)); toast({ title: "Drill Deleted" }); };
  const handleSaveDrill = (data: Omit<MockDrill, 'id'>) => {
    const action = editingDrill ? "Updated" : "Created";
    setDrills(prev => editingDrill ? prev.map(d => d.id === editingDrill.id ? { ...editingDrill, ...data } : d) : [{ id: crypto.randomUUID(), ...data }, ...prev]);
    toast({ title: `Drill ${action}`, description: `Drill "${data.drillName}" ${action.toLowerCase()}.` });
    setIsDrillFormOpen(false); setEditingDrill(null);
  };

  const PlanDetailView = ({ plan }: { plan: EmergencyPlan }) => (
    <ScrollArea className="max-h-[70vh] pr-3 text-sm">
        <div className="space-y-3">
            <p><strong>Plan Type:</strong> {plan.planType}</p>
            <p><strong>Scope/Area:</strong> {plan.scope}</p>
            {plan.description && <p><strong>Description:</strong><br /><span className="whitespace-pre-wrap text-muted-foreground">{plan.description}</span></p>}
            {plan.keyPersonnelAndRoles && <p><strong>Key Personnel & Roles:</strong><br /><span className="whitespace-pre-wrap text-muted-foreground">{plan.keyPersonnelAndRoles}</span></p>}
            {plan.emergencyProcedures && <p><strong>Emergency Procedures:</strong><br /><span className="whitespace-pre-wrap text-muted-foreground">{plan.emergencyProcedures}</span></p>}
            {plan.evacuationRoutesDescription && <p><strong>Evacuation Routes:</strong><br /><span className="whitespace-pre-wrap text-muted-foreground">{plan.evacuationRoutesDescription}</span></p>}
            {plan.emergencyContacts && <p><strong>Emergency Contacts:</strong><br /><span className="whitespace-pre-wrap text-muted-foreground">{plan.emergencyContacts}</span></p>}
            {plan.equipmentNeeded && <p><strong>Equipment Needed:</strong><br /><span className="whitespace-pre-wrap text-muted-foreground">{plan.equipmentNeeded}</span></p>}
            <p><strong>Last Reviewed:</strong> {plan.lastReviewedDate && isValid(parseISO(plan.lastReviewedDate)) ? format(parseISO(plan.lastReviewedDate), "PPP") : "N/A"}</p>
            <p><strong>Next Review:</strong> {plan.nextReviewDate && isValid(parseISO(plan.nextReviewDate)) ? format(parseISO(plan.nextReviewDate), "PPP") : "N/A"}</p>
        </div>
    </ScrollArea>
  );

  const getDrillStatusColor = (status: MockDrill['status']) => {
    switch (status) {
      case 'Planned': return 'text-blue-500';
      case 'Completed': return 'text-green-600';
      case 'Cancelled': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };
  const getResourceStatusColor = (status: EmergencyResource['status']) => {
    switch(status) {
        case 'Operational': return 'text-green-600';
        case 'Requires Maintenance':
        case 'Requires Refill':
        case 'Expired': return 'text-yellow-600';
        case 'Out of Service': return 'text-red-600';
        default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image 
            src="https://placehold.co/1200x400.png" 
            alt="Emergency evacuation drill" 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="emergency drill"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Emergency Preparedness</h1>
            <p className="text-sm text-neutral-300">Develop robust plans, manage resources, and track drills to ensure readiness.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module assists in creating emergency plans, managing resources, scheduling and logging mock drills, and documenting lessons learned.
          </p>
        </CardContent>
      </Card>
      
      {/* Emergency Plans Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6 text-primary"/>Emergency Plan Register</CardTitle>
                <CardDescription>Manage your organization's emergency plans.</CardDescription>
            </div>
            <Button onClick={handleOpenNewPlanForm} className="bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Plan
            </Button>
        </CardHeader>
        <CardContent>
            {plans.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No emergency plans created yet.</p>
            ) : (
                <ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">
                {plans.map(plan => (
                    <Card key={plan.id} className="p-3 shadow-sm"><div className="flex justify-between items-start">
                        <div><h4 className="font-semibold">{plan.planName}</h4><p className="text-xs text-muted-foreground">{plan.planType} - {plan.scope}</p></div>
                        <div className="flex gap-1 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => setViewingPlan(plan)}><Eye className="h-3 w-3"/></Button>
                            <Button variant="secondary" size="sm" onClick={() => handleEditPlan(plan)}><Edit2 className="h-3 w-3"/></Button>
                            <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Plan "{plan.planName}"?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. Ensure plan is not linked to active drills.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                        </div></div></Card>
                ))}</div></ScrollArea>
            )}
        </CardContent>
      </Card>
      {isPlanFormOpen && <Dialog open={isPlanFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsPlanFormOpen(false); setEditingPlan(null); }}}><EmergencyPlanForm initialData={editingPlan} onSave={handleSavePlan} onCancel={() => { setIsPlanFormOpen(false); setEditingPlan(null);}} /></Dialog>}
      {viewingPlan && <Dialog open={!!viewingPlan} onOpenChange={() => setViewingPlan(null)}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2 text-primary"><Siren className="h-6 w-6"/>{viewingPlan.planName}</DialogTitle><DialogDescription>Details of the emergency plan.</DialogDescription></DialogHeader><PlanDetailView plan={viewingPlan} /><DialogFooter className="pt-4 border-t"><DialogClose asChild><Button variant="outline">Close</Button></DialogClose><Button onClick={() => { handleEditPlan(viewingPlan); setViewingPlan(null); }} className="bg-primary hover:bg-primary/90"><Edit2 className="mr-2 h-4 w-4" /> Edit Plan</Button></DialogFooter></DialogContent></Dialog>}

      <Separator className="my-8"/>

      {/* Emergency Resources Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><Box className="h-6 w-6 text-accent"/>Emergency Resource Inventory</CardTitle><CardDescription>Track essential emergency equipment.</CardDescription></div>
            <Button onClick={handleOpenNewResourceForm} className="bg-accent hover:bg-accent/90"><PlusCircle className="mr-2 h-4 w-4" /> Add Resource</Button>
        </CardHeader>
        <CardContent>
            {resources.length === 0 ? <p className="text-muted-foreground text-center py-4">No emergency resources logged.</p> : (
                <ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">
                {resources.map(resource => (
                    <Card key={resource.id} className="p-3 shadow-sm"><div className="flex justify-between items-start">
                        <div><h4 className="font-semibold">{resource.name} <span className="text-xs text-muted-foreground">({resource.type})</span></h4><p className="text-xs text-muted-foreground">Location: {resource.location} | Qty: {resource.quantity}</p><p className={`text-xs font-semibold ${getResourceStatusColor(resource.status)}`}>Status: {resource.status}</p></div>
                        <div className="flex gap-1 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => setViewingResource(resource)}><Eye className="h-3 w-3"/></Button>
                            <Button variant="secondary" size="sm" onClick={() => handleEditResource(resource)}><Edit2 className="h-3 w-3"/></Button>
                            <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Resource "{resource.name}"?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteResource(resource.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                        </div></div></Card>
                ))}</div></ScrollArea>
            )}
        </CardContent>
      </Card>
      {isResourceFormOpen && <Dialog open={isResourceFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsResourceFormOpen(false); setEditingResource(null); }}}><EmergencyResourceForm initialData={editingResource} onSave={handleSaveResource} onCancel={() => { setIsResourceFormOpen(false); setEditingResource(null);}} /></Dialog>}
      {viewingResource && <EmergencyResourceDetailsDialog resource={viewingResource} onClose={() => setViewingResource(null)} />}

      <Separator className="my-8"/>

      {/* Mock Drills Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><Activity className="h-6 w-6 text-teal-500"/>Mock Drill Logbook</CardTitle><CardDescription>Schedule, log, and review mock drills.</CardDescription></div>
            <Button onClick={handleOpenNewDrillForm} className="bg-teal-500 hover:bg-teal-600 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Log/Schedule Drill</Button>
        </CardHeader>
        <CardContent>
            {drills.length === 0 ? <p className="text-muted-foreground text-center py-4">No mock drills recorded.</p> : (
                <ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">
                {drills.map(drill => (
                    <Card key={drill.id} className="p-3 shadow-sm"><div className="flex justify-between items-start">
                        <div><h4 className="font-semibold">{drill.drillName} <span className="text-xs text-muted-foreground">({drill.drillType})</span></h4><p className="text-xs text-muted-foreground">Date: {format(parseISO(drill.scheduledDate), "PPP")}</p><p className={`text-xs font-semibold ${getDrillStatusColor(drill.status)}`}>Status: {drill.status}</p></div>
                        <div className="flex gap-1 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => setViewingDrill(drill)}><Eye className="h-3 w-3"/></Button>
                            <Button variant="secondary" size="sm" onClick={() => handleEditDrill(drill)}><Edit2 className="h-3 w-3"/></Button>
                            <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Drill "{drill.drillName}"?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteDrill(drill.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                        </div></div></Card>
                ))}</div></ScrollArea>
            )}
        </CardContent>
      </Card>
      {isDrillFormOpen && <Dialog open={isDrillFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsDrillFormOpen(false); setEditingDrill(null); }}}><MockDrillForm plans={plans} initialData={editingDrill} onSave={handleSaveDrill} onCancel={() => { setIsDrillFormOpen(false); setEditingDrill(null);}} /></Dialog>}
      {viewingDrill && <MockDrillDetailsDialog drill={viewingDrill} planName={viewingDrill.linkedPlanId ? plans.find(p=>p.id === viewingDrill.linkedPlanId)?.planName : undefined} onClose={() => setViewingDrill(null)} />}


      <Separator className="my-8"/>
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Preparedness Tools - Further Enhancements</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mt-2 mb-2">
                Current features include:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Emergency Plan management with detailed fields.</li>
                <li>Emergency Resource Inventory tracking.</li>
                <li>Mock Drill scheduling, logging (scenario, participants, observations), and post-drill review (lessons learned, action items).</li>
                <li>Textual description for evacuation routes within plans.</li>
            </ul>
             <Separator className="my-4"/>
             <p className="text-sm text-muted-foreground mt-2 mb-2">
                Future capabilities under consideration:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Visual evacuation route designer and map uploads (requires backend).</li>
                <li>AI-assisted scenario generation for drills.</li>
                <li>More advanced action item tracking and notifications (requires backend).</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
