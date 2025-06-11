
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit2, Trash2, Eye, Siren, FileText } from "lucide-react";
import Image from "next/image";
import { format, isValid, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { EmergencyPlanForm } from '@/components/emergency-preparedness/emergency-plan-form';
import type { EmergencyPlan } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const PLANS_STORAGE_KEY = 'sheild-emergency-plans-v1';

export default function EmergencyPreparednessPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<EmergencyPlan[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EmergencyPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<EmergencyPlan | null>(null);

  useEffect(() => {
    try {
      const storedPlans = localStorage.getItem(PLANS_STORAGE_KEY);
      if (storedPlans) {
        setPlans(JSON.parse(storedPlans));
      }
    } catch (error) {
      console.error("Error loading emergency plans from localStorage:", error);
      toast({ title: "Error", description: "Could not load emergency plans.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
    } catch (error) {
      console.error("Error saving emergency plans to localStorage:", error);
    }
  }, [plans]);

  const handleOpenNewPlanForm = () => {
    setEditingPlan(null);
    setIsFormOpen(true);
  };

  const handleEditPlan = (plan: EmergencyPlan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId));
    toast({ title: "Plan Deleted", description: "The emergency plan has been deleted." });
  };

  const handleSavePlan = (data: Omit<EmergencyPlan, 'id'>) => {
    if (editingPlan) {
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...editingPlan, ...data } : p));
      toast({ title: "Plan Updated", description: `Plan "${data.planName}" has been updated.` });
    } else {
      const newPlan: EmergencyPlan = { id: crypto.randomUUID(), ...data };
      setPlans(prev => [newPlan, ...prev]);
      toast({ title: "Plan Created", description: `New plan "${data.planName}" has been created.` });
    }
    setIsFormOpen(false);
    setEditingPlan(null);
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


  if (isFormOpen) {
    return (
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsFormOpen(false); setEditingPlan(null); }}}>
            <EmergencyPlanForm
                initialData={editingPlan}
                onSave={handleSavePlan}
                onCancel={() => { setIsFormOpen(false); setEditingPlan(null); }}
            />
        </Dialog>
    );
  }

  return (
    <div className="space-y-6">
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
            <p className="text-sm text-neutral-300">Develop robust emergency plans and ensure readiness.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module assists in creating, managing, and reviewing emergency preparedness plans. 
            Document key procedures, personnel, contacts, and review schedules. Future updates will include mock drill management.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6 text-primary"/>Emergency Plan Register</CardTitle>
                <CardDescription>Manage your organization's emergency plans. All data is stored locally.</CardDescription>
            </div>
            <Button onClick={handleOpenNewPlanForm} className="bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Plan
            </Button>
        </CardHeader>
        <CardContent>
            {plans.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No emergency plans created yet. Click "Create New Plan" to start.</p>
            ) : (
                <ScrollArea className="max-h-[600px] pr-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map(plan => (
                            <Card key={plan.id} className="shadow-md flex flex-col">
                                <CardHeader>
                                    <CardTitle className="truncate">{plan.planName}</CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                        <Siren className="h-4 w-4"/>
                                        {plan.planType} - {plan.scope}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-xs text-muted-foreground">
                                        Next Review: {plan.nextReviewDate && isValid(parseISO(plan.nextReviewDate)) ? format(parseISO(plan.nextReviewDate), "PPP") : "N/A"}
                                    </p>
                                </CardContent>
                                <CardFooter className="flex flex-wrap gap-2 justify-start border-t pt-4">
                                    <Button variant="outline" size="sm" onClick={() => setViewingPlan(plan)}>
                                        <Eye className="mr-1 h-3 w-3" /> View
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => handleEditPlan(plan)}>
                                        <Edit2 className="mr-1 h-3 w-3" /> Edit
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="mr-1 h-3 w-3" /> Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the plan "{plan.planName}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>
                                                Delete Plan
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
      </Card>

    {viewingPlan && (
        <Dialog open={!!viewingPlan} onOpenChange={() => setViewingPlan(null)}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-primary">
                        <Siren className="h-6 w-6"/>
                        {viewingPlan.planName}
                    </DialogTitle>
                    <DialogDescription>
                        Details of the emergency plan.
                    </DialogDescription>
                </DialogHeader>
                <PlanDetailView plan={viewingPlan} />
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                     <Button onClick={() => { handleEditPlan(viewingPlan); setViewingPlan(null); }} className="bg-primary hover:bg-primary/90">
                        <Edit2 className="mr-2 h-4 w-4" /> Edit Plan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
      
      <Separator className="my-8"/>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Preparedness Tools - Future Enhancements</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mt-2 mb-2">
                The current Emergency Plan builder provides core functionality. Future capabilities under consideration include:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Visual evacuation route designer and map uploads.</li>
                <li>Mock drill scheduling, execution checklist, and logbook.</li>
                <li>Post-drill review forms and action item tracking.</li>
                <li>Resource inventory for emergency equipment (e.g., first aid, spill kits).</li>
                <li>AI-assisted scenario generation for drills (potential).</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
