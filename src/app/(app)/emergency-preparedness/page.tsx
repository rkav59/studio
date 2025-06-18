
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit2, Trash2, Eye, Siren, FileText, Box, ShieldAlert, Activity, Users, CalendarClock, ClockIcon, AlertTriangle, ListChecksIcon, Loader2, Link } from "lucide-react";
import Image from "next/image";
import { format, isValid, parseISO, differenceInDays, isBefore } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { EmergencyPlanForm } from '@/components/emergency-preparedness/emergency-plan-form';
import { EmergencyResourceForm } from '@/components/emergency-preparedness/emergency-resource-form';
import { EmergencyResourceDetailsDialog } from '@/components/emergency-preparedness/emergency-resource-details-dialog';
import { MockDrillForm } from '@/components/emergency-preparedness/mock-drill-form';
import { MockDrillDetailsDialog } from '@/components/emergency-preparedness/mock-drill-details-dialog';
import type { EmergencyPlan, EmergencyResource, MockDrill, DrillActionItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription as UiAlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PLANS_COLLECTION = 'emergencyPlans';
const RESOURCES_COLLECTION = 'emergencyResources';
const DRILLS_COLLECTION = 'mockDrills';
const REMINDER_LEAD_DAYS_EP = 14; 

interface DateStatusInfo {
  status: 'Overdue' | 'Upcoming' | 'OK';
  textClass: string;
  icon?: JSX.Element;
  displayText: string;
}

function getDateStatusInfo(dateString?: string, leadDays: number = REMINDER_LEAD_DAYS_EP): DateStatusInfo | null {
  if (!dateString || !isValid(parseISO(dateString))) return null;
  const date = parseISO(dateString);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const formattedDate = format(date, "PPP");
  if (isBefore(date, today)) return { status: 'Overdue', textClass: 'text-red-600 font-semibold', icon: <AlertTriangle className="h-3 w-3 mr-1" />, displayText: `${formattedDate} (Overdue)` };
  const daysDiff = differenceInDays(date, today);
  if (daysDiff <= leadDays) return { status: 'Upcoming', textClass: 'text-yellow-600 font-semibold', icon: <ClockIcon className="h-3 w-3 mr-1" />, displayText: `${formattedDate} (Upcoming)` };
  return { status: 'OK', textClass: 'text-muted-foreground', icon: <CalendarClock className="h-3 w-3 mr-1" />, displayText: formattedDate };
}

export default function EmergencyPreparednessPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EmergencyPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<EmergencyPlan | null>(null);

  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<EmergencyResource | null>(null);
  const [viewingResource, setViewingResource] = useState<EmergencyResource | null>(null);
  
  const [isDrillFormOpen, setIsDrillFormOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<MockDrill | null>(null);
  const [viewingDrill, setViewingDrill] = useState<MockDrill | null>(null);

  // Fetch Plans
  const { data: plans = [], isLoading: isLoadingPlans, error: plansError } = useQuery<EmergencyPlan[]>({
    queryKey: [PLANS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PLANS_COLLECTION), where("userId", "==", user.uid), orderBy("planName"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, ...data, 
          lastReviewedDate: (data.lastReviewedDate as Timestamp)?.toDate().toISOString(),
          nextReviewDate: (data.nextReviewDate as Timestamp)?.toDate().toISOString(),
        } as EmergencyPlan;
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch Resources
  const { data: resources = [], isLoading: isLoadingResources, error: resourcesError } = useQuery<EmergencyResource[]>({
    queryKey: [RESOURCES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, RESOURCES_COLLECTION), where("userId", "==", user.uid), orderBy("name"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, ...data, 
          lastCheckedDate: (data.lastCheckedDate as Timestamp)?.toDate().toISOString(),
          nextCheckDate: (data.nextCheckDate as Timestamp)?.toDate().toISOString(),
        } as EmergencyResource;
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch Drills
  const { data: drills = [], isLoading: isLoadingDrills, error: drillsError } = useQuery<MockDrill[]>({
    queryKey: [DRILLS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, DRILLS_COLLECTION), where("userId", "==", user.uid), orderBy("scheduledDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, ...data, 
          scheduledDate: (data.scheduledDate as Timestamp)?.toDate().toISOString(),
          actualDate: (data.actualDate as Timestamp)?.toDate().toISOString(),
          actionItems: (data.actionItems || []).map((ai: any) => ({
            ...ai,
            dueDate: (ai.dueDate as Timestamp)?.toDate().toISOString(),
          })),
        } as MockDrill;
      });
    },
    enabled: !!user?.uid,
  });

  // Plan Mutations
  const addPlanMutation = useMutation({
    mutationFn: (newPlanData: Omit<EmergencyPlan, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newPlanData, userId: user.uid,
        lastReviewedDate: newPlanData.lastReviewedDate ? Timestamp.fromDate(parseISO(newPlanData.lastReviewedDate)) : null,
        nextReviewDate: newPlanData.nextReviewDate ? Timestamp.fromDate(parseISO(newPlanData.nextReviewDate)) : null,
      };
      return addDoc(collection(db, PLANS_COLLECTION), dataForDb);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [PLANS_COLLECTION, user?.uid] }); toast({ title: "Plan Created" }); setIsPlanFormOpen(false); setEditingPlan(null); },
    onError: (e: Error) => toast({ title: "Error Creating Plan", description: e.message, variant: "destructive" }),
  });
  const updatePlanMutation = useMutation({
    mutationFn: (planToUpdate: EmergencyPlan) => {
      if (!user?.uid || !planToUpdate.id) throw new Error("Missing user or plan ID.");
      const { id, ...data } = planToUpdate;
      const dataForDb = {
        ...data, userId: user.uid,
        lastReviewedDate: data.lastReviewedDate ? Timestamp.fromDate(parseISO(data.lastReviewedDate)) : null,
        nextReviewDate: data.nextReviewDate ? Timestamp.fromDate(parseISO(data.nextReviewDate)) : null,
      };
      return updateDoc(doc(db, PLANS_COLLECTION, id), dataForDb);
    },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: [PLANS_COLLECTION, user?.uid] }); toast({ title: "Plan Updated", description: `Plan "${vars.planName}" updated.`}); setIsPlanFormOpen(false); setEditingPlan(null); },
    onError: (e: Error) => toast({ title: "Error Updating Plan", description: e.message, variant: "destructive" }),
  });
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      if (drills.some(drill => drill.linkedPlanId === planId)) {
        throw new Error("Plan is linked to mock drills. Delete those drills first.");
      }
      await deleteDoc(doc(db, PLANS_COLLECTION, planId));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [PLANS_COLLECTION, user?.uid] }); toast({ title: "Plan Deleted" });},
    onError: (e: Error) => toast({ title: "Error Deleting Plan", description: e.message, variant: "destructive", duration: 6000 }),
  });

  // Resource Mutations (similar structure to Plan Mutations)
  const addResourceMutation = useMutation({
    mutationFn: (newResourceData: Omit<EmergencyResource, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = { ...newResourceData, userId: user.uid,
        lastCheckedDate: newResourceData.lastCheckedDate ? Timestamp.fromDate(parseISO(newResourceData.lastCheckedDate)) : null,
        nextCheckDate: newResourceData.nextCheckDate ? Timestamp.fromDate(parseISO(newResourceData.nextCheckDate)) : null,
      };
      return addDoc(collection(db, RESOURCES_COLLECTION), dataForDb);
    },
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [RESOURCES_COLLECTION, user?.uid]}); toast({title: "Resource Added"}); setIsResourceFormOpen(false); setEditingResource(null); },
    onError: (e: Error) => toast({title: "Error Adding Resource", description: e.message, variant: "destructive"}),
  });
  const updateResourceMutation = useMutation({
    mutationFn: (resourceToUpdate: EmergencyResource) => {
      if (!user?.uid || !resourceToUpdate.id) throw new Error("Missing user or resource ID.");
      const { id, ...data } = resourceToUpdate;
      const dataForDb = { ...data, userId: user.uid,
        lastCheckedDate: data.lastCheckedDate ? Timestamp.fromDate(parseISO(data.lastCheckedDate)) : null,
        nextCheckDate: data.nextCheckDate ? Timestamp.fromDate(parseISO(data.nextCheckDate)) : null,
      };
      return updateDoc(doc(db, RESOURCES_COLLECTION, id), dataForDb);
    },
    onSuccess: (_,vars) => { queryClient.invalidateQueries({queryKey: [RESOURCES_COLLECTION, user?.uid]}); toast({title: "Resource Updated", description: `Resource "${vars.name}" updated.`}); setIsResourceFormOpen(false); setEditingResource(null); },
    onError: (e: Error) => toast({title: "Error Updating Resource", description: e.message, variant: "destructive"}),
  });
  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId: string) => deleteDoc(doc(db, RESOURCES_COLLECTION, resourceId)),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [RESOURCES_COLLECTION, user?.uid]}); toast({title: "Resource Deleted"});},
    onError: (e: Error) => toast({title: "Error Deleting Resource", description: e.message, variant: "destructive"}),
  });

  // Drill Mutations (similar structure)
  const addDrillMutation = useMutation({
    mutationFn: (newDrillData: Omit<MockDrill, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = { ...newDrillData, userId: user.uid,
        scheduledDate: Timestamp.fromDate(parseISO(newDrillData.scheduledDate as string)),
        actualDate: newDrillData.actualDate ? Timestamp.fromDate(parseISO(newDrillData.actualDate as string)) : null,
        actionItems: (newDrillData.actionItems || []).map(ai => ({
          ...ai,
          dueDate: ai.dueDate ? Timestamp.fromDate(parseISO(ai.dueDate as string)) : null,
        })),
      };
      return addDoc(collection(db, DRILLS_COLLECTION), dataForDb);
    },
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [DRILLS_COLLECTION, user?.uid]}); toast({title: "Drill Logged/Scheduled"}); setIsDrillFormOpen(false); setEditingDrill(null);},
    onError: (e: Error) => toast({title: "Error Logging Drill", description: e.message, variant: "destructive"}),
  });
  const updateDrillMutation = useMutation({
     mutationFn: (drillToUpdate: MockDrill) => {
      if (!user?.uid || !drillToUpdate.id) throw new Error("Missing user or drill ID.");
      const { id, ...data } = drillToUpdate;
       const dataForDb = { ...data, userId: user.uid,
        scheduledDate: Timestamp.fromDate(parseISO(data.scheduledDate as string)),
        actualDate: data.actualDate ? Timestamp.fromDate(parseISO(data.actualDate as string)) : null,
        actionItems: (data.actionItems || []).map(ai => ({
          ...ai,
          dueDate: ai.dueDate ? Timestamp.fromDate(parseISO(ai.dueDate as string)) : null,
        })),
      };
      return updateDoc(doc(db, DRILLS_COLLECTION, id), dataForDb);
    },
    onSuccess: (_,vars) => { queryClient.invalidateQueries({queryKey: [DRILLS_COLLECTION, user?.uid]}); toast({title: "Drill Updated", description: `Drill "${vars.drillName}" updated.`}); setIsDrillFormOpen(false); setEditingDrill(null);},
    onError: (e: Error) => toast({title: "Error Updating Drill", description: e.message, variant: "destructive"}),
  });
  const deleteDrillMutation = useMutation({
    mutationFn: (drillId: string) => deleteDoc(doc(db, DRILLS_COLLECTION, drillId)),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [DRILLS_COLLECTION, user?.uid]}); toast({title: "Drill Deleted"});},
    onError: (e: Error) => toast({title: "Error Deleting Drill", description: e.message, variant: "destructive"}),
  });

  // Plan Management Handlers
  const handleOpenNewPlanForm = () => { setEditingPlan(null); setIsPlanFormOpen(true); };
  const handleEditPlan = (plan: EmergencyPlan) => { setEditingPlan(plan); setIsPlanFormOpen(true); };
  const handleDeletePlan = (planId: string) => deletePlanMutation.mutate(planId);
  const handleSavePlan = (data: Omit<EmergencyPlan, 'id' | 'userId'>) => { // Match mutation input
    if (editingPlan) {
      updatePlanMutation.mutate({ ...editingPlan, ...data });
    } else {
      addPlanMutation.mutate(data);
    }
  };
  
  // Resource Management Handlers
  const handleOpenNewResourceForm = () => { setEditingResource(null); setIsResourceFormOpen(true); };
  const handleEditResource = (resource: EmergencyResource) => { setEditingResource(resource); setIsResourceFormOpen(true); };
  const handleDeleteResource = (resourceId: string) => deleteResourceMutation.mutate(resourceId);
  const handleSaveResource = (data: Omit<EmergencyResource, 'id'|'userId'>) => {
    if (editingResource) {
      updateResourceMutation.mutate({ ...editingResource, ...data });
    } else {
      addResourceMutation.mutate(data);
    }
  };

  // Drill Management Handlers
  const handleOpenNewDrillForm = () => { setEditingDrill(null); setIsDrillFormOpen(true); };
  const handleEditDrill = (drill: MockDrill) => { setEditingDrill(drill); setIsDrillFormOpen(true); };
  const handleDeleteDrill = (drillId: string) => deleteDrillMutation.mutate(drillId);
  const handleSaveDrill = (data: Omit<MockDrill, 'id'|'userId'>) => {
    if (editingDrill) {
      updateDrillMutation.mutate({ ...editingDrill, ...data });
    } else {
      addDrillMutation.mutate(data);
    }
  };

  const PlanDetailView = ({ plan }: { plan: EmergencyPlan }) => (
    <ScrollArea className="max-h-[70vh] pr-3 text-sm"><div className="space-y-3">
      <p><strong>Plan Type:</strong> {plan.planType}</p>
      <p><strong>Scope/Area:</strong> {plan.scope}</p>
      {plan.description && <p><strong>Description:</strong><br /><span className="whitespace-pre-wrap text-muted-foreground">{plan.description}</span></p>}
      {plan.lastReviewedDate && <p><strong>Last Reviewed:</strong> {format(parseISO(plan.lastReviewedDate), "PPP")}</p>}
      {plan.nextReviewDate && <p><strong>Next Review:</strong> {format(parseISO(plan.nextReviewDate), "PPP")}</p>}
    </div></ScrollArea>
  );

  const getDrillStatusColor = (status: MockDrill['status']) => ({Planned:'text-blue-500',Completed:'text-green-600',Cancelled:'text-red-500'}[status]||'text-muted-foreground');
  const getResourceStatusColor = (status: EmergencyResource['status']) => ({Operational:'text-green-600','Requires Maintenance':'text-yellow-600','Requires Refill':'text-yellow-600','Expired':'text-yellow-600','Out of Service':'text-red-600'}[status]||'text-muted-foreground');
  const pendingDrillActions = useMemo(() => drills.reduce((acc, drill) => acc + (drill.actionItems?.filter(item => item.status === 'Open' || item.status === 'In Progress').length || 0), 0), [drills]);
  
  const isLoading = isLoadingPlans || isLoadingResources || isLoadingDrills;
  const anyError = plansError || resourcesError || drillsError;

  if (isLoading) {
    return (<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3 text-lg text-muted-foreground">Loading emergency data...</p></div>);
  }
  if (anyError) {
    return <div className="text-red-500 text-center py-10">Error loading data: {anyError.message}</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image src="https://placehold.co/1200x400.png" alt="Emergency evacuation drill" layout="fill" objectFit="cover" data-ai-hint="emergency drill"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6"><h1 className="text-3xl font-bold tracking-tight font-headline text-white">Emergency Preparedness</h1><p className="text-sm text-neutral-300">Manage plans, resources, and drills. Data in Firestore.</p></div>
        </div>
        <CardContent className="pt-6"><p className="text-muted-foreground">This module assists in creating emergency plans, managing resources, and tracking drills. All data is stored securely in Firebase Firestore.</p></CardContent>
      </Card>

      {pendingDrillActions > 0 && (<Alert variant="info" className="shadow-md"><ListChecksIcon className="h-4 w-4" /><AlertTitle>Pending Drill Actions</AlertTitle><UiAlertDescription>There are <strong className="text-accent">{pendingDrillActions}</strong> pending action items from mock drills.</UiAlertDescription></Alert>)}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6 text-primary"/>Emergency Plans</CardTitle><CardDescription>Manage emergency plans. Monitor review dates.</CardDescription></div>
          <Button onClick={handleOpenNewPlanForm} className="bg-primary hover:bg-primary/90" disabled={addPlanMutation.isPending || updatePlanMutation.isPending}><PlusCircle className="mr-2 h-4 w-4" /> Create Plan</Button>
        </CardHeader>
        <CardContent>{plans.length === 0 ? <p className="text-muted-foreground text-center py-4">No plans created.</p> : (
          <ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">{plans.map(plan => { const reviewDateStatus = getDateStatusInfo(plan.nextReviewDate); return (
            <Card key={plan.id} className="p-3 shadow-sm"><div className="flex justify-between items-start"><div><h4 className="font-semibold">{plan.planName}</h4><p className="text-xs text-muted-foreground">{plan.planType} - {plan.scope}</p>{reviewDateStatus && <p className={`text-xs flex items-center ${reviewDateStatus.textClass}`}>{reviewDateStatus.icon} Next Review: {reviewDateStatus.displayText}</p>}</div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingPlan(plan)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => handleEditPlan(plan)} disabled={updatePlanMutation.isPending}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deletePlanMutation.isPending}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Plan?</AlertDialogTitle><AlertDialogDescription>Delete "{plan.planName}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>
          );})}</div></ScrollArea>
        )}</CardContent>
      </Card>
      {isPlanFormOpen && <Dialog open={isPlanFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsPlanFormOpen(false); setEditingPlan(null); }}}><EmergencyPlanForm initialData={editingPlan} onSave={handleSavePlan} onCancel={() => { setIsPlanFormOpen(false); setEditingPlan(null);}} /></Dialog>}
      {viewingPlan && <Dialog open={!!viewingPlan} onOpenChange={() => setViewingPlan(null)}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2 text-primary"><Siren className="h-6 w-6"/>{viewingPlan.planName}</DialogTitle><DialogDescription>Details of the plan.</DialogDescription></DialogHeader><PlanDetailView plan={viewingPlan} /><DialogFooter className="pt-4 border-t"><DialogClose asChild><Button variant="outline">Close</Button></DialogClose><Button onClick={() => { handleEditPlan(viewingPlan); setViewingPlan(null); }} className="bg-primary hover:bg-primary/90"><Edit2 className="mr-2 h-4 w-4"/>Edit</Button></DialogFooter></DialogContent></Dialog>}

      <Separator className="my-8"/>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Box className="h-6 w-6 text-accent"/>Resource Inventory</CardTitle><CardDescription>Track emergency equipment and check dates.</CardDescription></div>
          <Button onClick={handleOpenNewResourceForm} className="bg-accent hover:bg-accent/90" disabled={addResourceMutation.isPending || updateResourceMutation.isPending}><PlusCircle className="mr-2 h-4 w-4" /> Add Resource</Button>
        </CardHeader>
        <CardContent>{resources.length === 0 ? <p className="text-muted-foreground text-center py-4">No resources logged.</p> : (
          <ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">{resources.map(resource => { const checkDateStatus = getDateStatusInfo(resource.nextCheckDate); return(
            <Card key={resource.id} className="p-3 shadow-sm"><div className="flex justify-between items-start"><div><h4 className="font-semibold">{resource.name} <span className="text-xs text-muted-foreground">({resource.type})</span></h4><p className="text-xs text-muted-foreground">Location: {resource.location} | Qty: {resource.quantity}</p><p className={`text-xs font-semibold ${getResourceStatusColor(resource.status)}`}>Status: {resource.status}</p>{checkDateStatus && <p className={`text-xs flex items-center ${checkDateStatus.textClass}`}>{checkDateStatus.icon} Next Check: {checkDateStatus.displayText}</p>}</div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingResource(resource)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => handleEditResource(resource)} disabled={updateResourceMutation.isPending}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteResourceMutation.isPending}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Resource?</AlertDialogTitle><AlertDialogDescription>Delete "{resource.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteResource(resource.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>
          );})}</div></ScrollArea>
        )}</CardContent>
      </Card>
      {isResourceFormOpen && <Dialog open={isResourceFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsResourceFormOpen(false); setEditingResource(null); }}}><EmergencyResourceForm initialData={editingResource} onSave={handleSaveResource} onCancel={() => { setIsResourceFormOpen(false); setEditingResource(null);}} /></Dialog>}
      {viewingResource && <EmergencyResourceDetailsDialog resource={viewingResource} onClose={() => setViewingResource(null)} />}

      <Separator className="my-8"/>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Activity className="h-6 w-6 text-teal-500"/>Mock Drill Logbook</CardTitle><CardDescription>Schedule, log, and review mock drills.</CardDescription></div>
          <Button onClick={handleOpenNewDrillForm} className="bg-teal-500 hover:bg-teal-600 text-white" disabled={addDrillMutation.isPending || updateDrillMutation.isPending}><PlusCircle className="mr-2 h-4 w-4" /> Log/Schedule Drill</Button>
        </CardHeader>
        <CardContent>{drills.length === 0 ? <p className="text-muted-foreground text-center py-4">No mock drills recorded.</p> : (
          <ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">{drills.map(drill => { const scheduledDateStatus = drill.status === 'Planned' ? getDateStatusInfo(drill.scheduledDate, 0) : null; return (
            <Card key={drill.id} className="p-3 shadow-sm"><div className="flex justify-between items-start"><div><h4 className="font-semibold">{drill.drillName} <span className="text-xs text-muted-foreground">({drill.drillType})</span></h4><p className={`text-xs font-semibold ${getDrillStatusColor(drill.status)}`}>Status: {drill.status}</p>{scheduledDateStatus?.status === 'Overdue' ? <p className={`text-xs flex items-center ${scheduledDateStatus.textClass}`}>{scheduledDateStatus.icon} Scheduled: {scheduledDateStatus.displayText}</p> : <p className="text-xs text-muted-foreground">Scheduled: {format(parseISO(drill.scheduledDate), "PPP")}</p>}</div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingDrill(drill)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => handleEditDrill(drill)} disabled={updateDrillMutation.isPending}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteDrillMutation.isPending}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Drill?</AlertDialogTitle><AlertDialogDescription>Delete "{drill.drillName}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteDrill(drill.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>
          );})}</div></ScrollArea>
        )}</CardContent>
      </Card>
      {isDrillFormOpen && <Dialog open={isDrillFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsDrillFormOpen(false); setEditingDrill(null); }}}><MockDrillForm plans={plans} initialData={editingDrill} onSave={handleSaveDrill} onCancel={() => { setIsDrillFormOpen(false); setEditingDrill(null);}} /></Dialog>}
      {viewingDrill && <MockDrillDetailsDialog drill={viewingDrill} planName={viewingDrill.linkedPlanId ? plans.find(p=>p.id === viewingDrill.linkedPlanId)?.planName : undefined} onClose={() => setViewingDrill(null)} />}
    </div>
  );
}

    