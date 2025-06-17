
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, Package, CheckCheck, ClipboardList, Settings2, AlertTriangle, ListFilter, Search, ShieldCheck, Activity, CalendarClock, ClockIcon, AlertCircle, Users } from "lucide-react";
import type { PpeItem, PpeIssuanceRecord, PpeInspectionRecord, PpeItemStatus, PpeJobRoleMatrixEntry } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, differenceInDays, isBefore } from 'date-fns';
import { Separator } from '@/components/ui/separator';
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
import { PpeItemDetailsDialog } from '@/components/ppe-management/ppe-item-details-dialog';
import { PpeIssuanceDetailsDialog } from '@/components/ppe-management/ppe-issuance-details-dialog';
import { PpeInspectionDetailsDialog } from '@/components/ppe-management/ppe-inspection-details-dialog'; 
import { PpeJobRoleMatrixForm } from '@/components/ppe-management/ppe-job-role-matrix-form';
import { PpeJobRoleMatrixDetailsDialog } from '@/components/ppe-management/ppe-job-role-matrix-details-dialog';


const PPE_ITEMS_KEY = 'sheild-ppe-items-v1';
const PPE_ISSUANCES_KEY = 'sheild-ppe-issuances-v1';
const PPE_INSPECTIONS_KEY = 'sheild-ppe-inspections-v1';
const PPE_JOB_ROLE_MATRIX_KEY = 'sheild-ppe-job-role-matrix-v1';
const REMINDER_LEAD_DAYS = 7; 

interface PpeItemWithInspectionInfo extends PpeItem {
  latestInspection?: PpeInspectionRecord;
  nextInspectionDueDate?: string; 
  dueStatus?: 'Overdue' | 'Due Soon' | 'Scheduled' | 'OK';
}


export default function PpeManagementPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [ppeItems, setPpeItems] = useState<PpeItem[]>([]);
  const [viewingPpeItem, setViewingPpeItem] = useState<PpeItem | null>(null);

  const [ppeIssuances, setPpeIssuances] = useState<PpeIssuanceRecord[]>([]);
  const [viewingPpeIssuance, setViewingPpeIssuance] = useState<PpeIssuanceRecord | null>(null);
  
  const [ppeInspections, setPpeInspections] = useState<PpeInspectionRecord[]>([]);
  const [viewingPpeInspection, setViewingPpeInspection] = useState<PpeInspectionRecord | null>(null);

  const [ppeJobRoleMatrix, setPpeJobRoleMatrix] = useState<PpeJobRoleMatrixEntry[]>([]);
  const [isJobRoleFormOpen, setIsJobRoleFormOpen] = useState(false);
  const [editingJobRoleEntry, setEditingJobRoleEntry] = useState<PpeJobRoleMatrixEntry | null>(null);
  const [viewingJobRoleEntry, setViewingJobRoleEntry] = useState<PpeJobRoleMatrixEntry | null>(null);

  // Function to load all relevant data from localStorage
  const loadAllPpeData = () => {
    // Load PPE Items
    try {
      const storedItems = localStorage.getItem(PPE_ITEMS_KEY);
      if (storedItems) {
        setPpeItems(JSON.parse(storedItems).map((item: PpeItem) => ({ ...item, status: item.status || 'Available' })));
      } else {
        setPpeItems([]);
      }
    } catch (e) { console.error("Error loading PPE items:", e); setPpeItems([]); }

    // Load PPE Issuances
    try {
      const storedIssuances = localStorage.getItem(PPE_ISSUANCES_KEY);
      if (storedIssuances) setPpeIssuances(JSON.parse(storedIssuances));
      else setPpeIssuances([]);
    } catch (e) { console.error("Error loading PPE issuances:", e); setPpeIssuances([]); }

    // Load PPE Inspections
    try {
      const storedInspections = localStorage.getItem(PPE_INSPECTIONS_KEY);
      if (storedInspections) setPpeInspections(JSON.parse(storedInspections));
      else setPpeInspections([]);
    } catch (e) { console.error("Error loading PPE inspections:", e); setPpeInspections([]); }
    
    // Load PPE Job Role Matrix
    try {
      const storedMatrix = localStorage.getItem(PPE_JOB_ROLE_MATRIX_KEY);
      if (storedMatrix) setPpeJobRoleMatrix(JSON.parse(storedMatrix));
      else setPpeJobRoleMatrix([]);
    } catch (e) { console.error("Error loading PPE Job Role Matrix:", e); setPpeJobRoleMatrix([]); }
  };

  // Initial data load and load on window focus
  useEffect(() => {
    loadAllPpeData(); // Load on mount

    const handleFocus = () => {
      loadAllPpeData(); // Reload when window gains focus
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // This effect runs once to set up initial load and listener

  // --- Save PPE Items ---
  useEffect(() => {
    try { localStorage.setItem(PPE_ITEMS_KEY, JSON.stringify(ppeItems)); }
    catch (e) { console.error("Error saving PPE items:", e); }
  }, [ppeItems]);

  // --- Save PPE Issuances ---
  useEffect(() => {
    try { localStorage.setItem(PPE_ISSUANCES_KEY, JSON.stringify(ppeIssuances)); }
    catch (e) { console.error("Error saving PPE issuances:", e); }
  }, [ppeIssuances]);

  // --- Save PPE Inspections ---
  useEffect(() => {
    try { localStorage.setItem(PPE_INSPECTIONS_KEY, JSON.stringify(ppeInspections)); }
    catch (e) { console.error("Error saving PPE inspections:", e); }
  }, [ppeInspections]);

  // --- Save PPE Job Role Matrix ---
  useEffect(() => {
    try { localStorage.setItem(PPE_JOB_ROLE_MATRIX_KEY, JSON.stringify(ppeJobRoleMatrix)); }
    catch (e) { console.error("Error saving PPE Job Role Matrix:", e); }
  }, [ppeJobRoleMatrix]);


  const ppeItemsWithInspectionInfo = useMemo((): PpeItemWithInspectionInfo[] => {
    return ppeItems.map(item => {
      const itemInspections = ppeInspections
        .filter(insp => insp.ppeItemId === item.id && insp.nextInspectionDate && isValid(parseISO(insp.nextInspectionDate)))
        .sort((a, b) => parseISO(b.inspectionDate).getTime() - parseISO(a.inspectionDate).getTime()); 
      
      const latestRelevantInspection = itemInspections.find(insp => insp.nextInspectionDate); 

      let dueStatus: PpeItemWithInspectionInfo['dueStatus'] = 'OK';
      let nextDueDate: string | undefined = undefined;

      if (latestRelevantInspection?.nextInspectionDate) {
        nextDueDate = latestRelevantInspection.nextInspectionDate;
        const dueDate = parseISO(nextDueDate);
        const today = new Date();
        today.setHours(0,0,0,0); 

        if (isBefore(dueDate, today)) {
          dueStatus = 'Overdue';
        } else if (differenceInDays(dueDate, today) <= REMINDER_LEAD_DAYS) {
          dueStatus = 'Due Soon';
        } else {
          dueStatus = 'Scheduled';
        }
      }
      
      if (item.status && !['Available', 'Under Inspection'].includes(item.status)) {
         
      }


      return {
        ...item,
        latestInspection: latestRelevantInspection,
        nextInspectionDueDate: nextDueDate,
        dueStatus: (item.status && !['Available', 'Under Inspection'].includes(item.status || '')) ? undefined : dueStatus,
      };
    });
  }, [ppeItems, ppeInspections]);

  const upcomingOrOverdueInspections = useMemo(() => {
    return ppeItemsWithInspectionInfo.filter(item => item.dueStatus === 'Overdue' || item.dueStatus === 'Due Soon');
  }, [ppeItemsWithInspectionInfo]);

  useEffect(() => {
    if (upcomingOrOverdueInspections.length > 0) {
      const overdueCount = upcomingOrOverdueInspections.filter(item => item.dueStatus === 'Overdue').length;
      const dueSoonCount = upcomingOrOverdueInspections.filter(item => item.dueStatus === 'Due Soon').length;
      
      let messages: string[] = [];
      if (overdueCount > 0) messages.push(`${overdueCount} item(s) overdue`);
      if (dueSoonCount > 0) messages.push(`${dueSoonCount} item(s) due soon`);

      if (messages.length > 0) {
        toast({
          title: "PPE Inspection Reminders",
          description: `${messages.join(', ')}. Check the 'Upcoming/Overdue Inspections' list.`,
          variant: overdueCount > 0 ? "destructive" : "default", 
          duration: 10000,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingOrOverdueInspections, toast]); // Toast is stable, so this effectively runs when upcomingOrOverdueInspections changes


  const handleOpenNewPpeItemForm = () => router.push('/ppe-management/items/new');
  const handleEditPpeItem = (item: PpeItem) => router.push(`/ppe-management/items/edit/${item.id}`);
  const handleDeletePpeItem = (itemId: string) => {
    if (ppeIssuances.some(issuance => issuance.ppeItemId === itemId) || 
        ppeInspections.some(insp => insp.ppeItemId === itemId) ||
        ppeJobRoleMatrix.some(matrix => matrix.requiredPpeItemIds.includes(itemId)) ) {
      toast({ title: "Cannot Delete", description: "This PPE item is linked to issuance, inspection, or job role matrix records.", variant: "destructive" });
      return;
    }
    setPpeItems(prev => prev.filter(item => item.id !== itemId));
    toast({ title: "PPE Item Deleted" });
  };
  
  const handleOpenNewPpeIssuanceForm = () => {
    if (ppeItems.filter(item => (item.status || 'Available') === 'Available').length === 0) {
        toast({title: "No Available PPE Items", description: "Please add available PPE items to the inventory first.", variant: "destructive"});
        return;
    }
    router.push('/ppe-management/issuances/new');
  };
  const handleEditPpeIssuance = (issuance: PpeIssuanceRecord) => router.push(`/ppe-management/issuances/edit/${issuance.id}`);
  const handleDeletePpeIssuance = (issuanceId: string) => {
    setPpeIssuances(prev => prev.filter(item => item.id !== issuanceId));
    toast({ title: "PPE Issuance Record Deleted" });
  };

  const handleOpenNewPpeInspectionForm = () => {
     if (ppeItems.length === 0) {
        toast({title: "No PPE Items", description: "Please add PPE items to inventory before logging inspections.", variant: "destructive"});
        return;
    }
    router.push('/ppe-management/inspections/new');
  }
  const handleEditPpeInspection = (inspection: PpeInspectionRecord) => router.push(`/ppe-management/inspections/edit/${inspection.id}`);
  const handleDeletePpeInspection = (inspectionId: string) => {
    setPpeInspections(prev => prev.filter(insp => insp.id !== inspectionId));
    toast({ title: "PPE Inspection Record Deleted" });
  };

  // --- PPE Job Role Matrix Handlers ---
  const handleOpenNewJobRoleForm = () => {
    if (ppeItems.length === 0) {
        toast({title: "No PPE Items", description: "Please add PPE items to inventory first to define job role requirements.", variant: "destructive"});
        return;
    }
    setEditingJobRoleEntry(null);
    setIsJobRoleFormOpen(true);
  };
  const handleEditJobRoleEntry = (entry: PpeJobRoleMatrixEntry) => {
    setEditingJobRoleEntry(entry);
    setIsJobRoleFormOpen(true);
  };
  const handleDeleteJobRoleEntry = (entryId: string) => {
    setPpeJobRoleMatrix(prev => prev.filter(entry => entry.id !== entryId));
    toast({ title: "Job Role Matrix Entry Deleted" });
  };
  const handleSaveJobRoleEntry = (data: Omit<PpeJobRoleMatrixEntry, 'id'>) => {
    if (editingJobRoleEntry) {
      setPpeJobRoleMatrix(prev => prev.map(entry => entry.id === editingJobRoleEntry.id ? { ...editingJobRoleEntry, ...data } : entry));
      toast({ title: "Job Role Matrix Updated", description: `Requirements for "${data.jobRole}" updated.` });
    } else {
      const newEntry: PpeJobRoleMatrixEntry = { id: crypto.randomUUID(), ...data };
      setPpeJobRoleMatrix(prev => [newEntry, ...prev]);
      toast({ title: "Job Role Matrix Entry Created", description: `Requirements for "${data.jobRole}" defined.` });
    }
    setIsJobRoleFormOpen(false);
    setEditingJobRoleEntry(null);
  };


  const getPpeItemName = (itemId: string) => ppeItems.find(item => item.id === itemId)?.name || "Unknown PPE";
  
  const getPpeItemStatusColor = (status?: PpeItemStatus) => {
    switch (status) {
      case 'Available': return 'text-green-600 dark:text-green-400';
      case 'Under Inspection': return 'text-blue-500 dark:text-blue-400';
      case 'Awaiting Repair':
      case 'Awaiting Replacement': return 'text-yellow-600 dark:text-yellow-400';
      case 'Discarded': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };
  
  const getPpeInspectionStatusColor = (status: PpeInspectionRecord['overallStatus']) => {
    switch (status) {
      case 'Pass': return 'text-green-600 dark:text-green-400';
      case 'Requires Repair':
      case 'To be Replaced': return 'text-red-600 dark:text-red-400';
      case 'Action Pending': return 'text-yellow-500 dark:text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  const getDueDateStatusColor = (dueStatus?: PpeItemWithInspectionInfo['dueStatus']) => {
    if (!dueStatus) return 'text-muted-foreground';
    switch (dueStatus) {
      case 'Overdue': return 'text-red-500 font-bold';
      case 'Due Soon': return 'text-yellow-600 font-semibold';
      case 'Scheduled': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image
            src="https://storage.googleapis.com/project-gameface-dev-assets/sheild/ppe-banner.png"
            alt="Person wearing Personal Protective Equipment"
            layout="fill"
            objectFit="cover"
            data-ai-hint="safety gear"
            className="transform -scale-y-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">PPE Management</h1>
            <p className="text-sm text-neutral-300">Track inventory, issuance, inspections, and compliance for Personal Protective Equipment.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module helps manage all aspects of Personal Protective Equipment, including inventory, status, issuance, inspections (with scheduling reminders), and a job role PPE matrix. Data is stored locally.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarClock className="h-6 w-6 text-orange-500"/>Upcoming/Overdue Inspections</CardTitle>
          <CardDescription>PPE items requiring inspection soon or currently overdue.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingOrOverdueInspections.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No PPE items currently due or overdue for inspection.</p>
          ) : (
            <ScrollArea className="max-h-[300px] pr-3">
              <div className="space-y-3">
                {upcomingOrOverdueInspections.map(item => (
                  <Card key={`due-${item.id}`} className={`p-3 shadow-sm border-l-4 ${item.dueStatus === 'Overdue' ? 'border-red-500' : 'border-yellow-500'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-1 sm:mb-0">
                        <h4 className="font-semibold text-md">{item.name} {item.latestInspection?.uniquePpeIdentifier ? `(ID: ${item.latestInspection.uniquePpeIdentifier})` : ''}</h4>
                        <p className={`text-xs font-semibold ${getDueDateStatusColor(item.dueStatus)}`}>
                          Status: {item.dueStatus}
                          {item.nextInspectionDueDate && ` (Due: ${format(parseISO(item.nextInspectionDueDate), "PPP")})`}
                        </p>
                        <p className="text-xs text-muted-foreground">Last Inspected: {item.latestInspection ? format(parseISO(item.latestInspection.inspectionDate), "PPP") : "N/A"}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/ppe-management/inspections/new?ppeItemId=${item.id}`)}>
                         Inspect Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      <Separator/>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary" />PPE Inventory</CardTitle>
            <CardDescription>View and manage all PPE items, their status, and next inspection due dates.</CardDescription>
          </div>
          <Button onClick={handleOpenNewPpeItemForm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add PPE to Inventory
          </Button>
        </CardHeader>
        <CardContent>
          {ppeItemsWithInspectionInfo.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No PPE items in inventory yet.</p>
          ) : (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {ppeItemsWithInspectionInfo.map(item => (
                  <Card key={item.id} className="p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">{item.name} <span className="text-sm text-muted-foreground">({item.type} - {item.category})</span></h4>
                        <p className="text-xs text-muted-foreground">Stock: {item.currentStock} | Reorder: {item.reorderLevel}
                          {item.currentStock < item.reorderLevel && <span className="ml-2 text-red-500 font-bold">(Low Stock!)</span>}
                        </p>
                         <p className={`text-xs font-semibold ${getPpeItemStatusColor(item.status)} flex items-center gap-1`}><Activity className="h-3 w-3"/>Status: {item.status || 'Available'}</p>
                         {item.nextInspectionDueDate && ['Available', 'Under Inspection'].includes(item.status || '') && (
                           <p className={`text-xs flex items-center gap-1 ${getDueDateStatusColor(item.dueStatus)}`}>
                             <ClockIcon className="h-3 w-3"/>
                             Next Inspection: {format(parseISO(item.nextInspectionDueDate), "PPP")}
                             {item.dueStatus && ` (${item.dueStatus})`}
                           </p>
                         )}
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setViewingPpeItem(item)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditPpeItem(item)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete PPE Item?</AlertDialogTitle><AlertDialogDescription>Delete "{item.name}"? This action cannot be undone. Ensure it's not linked to active records.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePpeItem(item.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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
      
      {viewingPpeItem && <PpeItemDetailsDialog item={viewingPpeItem} onClose={() => setViewingPpeItem(null)} />}

      <Separator />

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><CheckCheck className="h-6 w-6 text-accent" />PPE Issuance & Return Log</CardTitle>
            <CardDescription>Track PPE issued to employees and its return.</CardDescription>
          </div>
          <Button onClick={handleOpenNewPpeIssuanceForm} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={ppeItems.filter(i => (i.status || 'Available') === 'Available').length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" /> Log New Issuance
          </Button>
        </CardHeader>
        <CardContent>
          {ppeItems.filter(i => (i.status || 'Available') === 'Available').length === 0 && ppeItems.length > 0 && <p className="text-center text-muted-foreground py-4">No PPE items currently marked 'Available' in inventory to log issuances.</p>}
          {ppeIssuances.length === 0 && ppeItems.length > 0 && (
            <p className="text-muted-foreground text-center py-4">No PPE issuances logged yet.</p>
          )}
          {ppeIssuances.length > 0 && (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {ppeIssuances.map(issuance => (
                  <Card key={issuance.id} className="p-4 shadow-sm">
                     <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">{issuance.employeeName} - {getPpeItemName(issuance.ppeItemId)} (x{issuance.quantityIssued})</h4>
                        <p className="text-xs text-muted-foreground">Issued: {format(parseISO(issuance.issuedDate), "PPP")}</p>
                        {issuance.actualReturnDate ? 
                           <p className="text-xs text-green-600">Returned: {format(parseISO(issuance.actualReturnDate), "PPP")} ({issuance.conditionOnReturn})</p>
                           : issuance.expectedReturnDate ? 
                           <p className="text-xs text-yellow-600">Expected Return: {format(parseISO(issuance.expectedReturnDate), "PPP")}</p>
                           : <p className="text-xs text-muted-foreground">No return date set.</p>
                        }
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setViewingPpeIssuance(issuance)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditPpeIssuance(issuance)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Issuance Record?</AlertDialogTitle><AlertDialogDescription>Delete this record? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePpeIssuance(issuance.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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
      
      {viewingPpeIssuance && <PpeIssuanceDetailsDialog issuance={viewingPpeIssuance} ppeItemName={getPpeItemName(viewingPpeIssuance.ppeItemId)} onClose={() => setViewingPpeIssuance(null)} />}

      <Separator />

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-teal-600" />PPE Inspection Log</CardTitle>
            <CardDescription>Record and track inspections of PPE items.</CardDescription>
          </div>
          <Button onClick={handleOpenNewPpeInspectionForm} className="bg-teal-600 hover:bg-teal-700 text-white" disabled={ppeItems.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" /> Log New Inspection
          </Button>
        </CardHeader>
        <CardContent>
          {ppeItems.length === 0 && <p className="text-center text-muted-foreground py-4">Add PPE items to inventory first to log inspections.</p>}
          {ppeInspections.length === 0 && ppeItems.length > 0 && (
            <p className="text-muted-foreground text-center py-4">No PPE inspections logged yet.</p>
          )}
          {ppeInspections.length > 0 && (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {ppeInspections.map(inspection => (
                  <Card key={inspection.id} className="p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">{getPpeItemName(inspection.ppeItemId)} {inspection.uniquePpeIdentifier ? `(ID: ${inspection.uniquePpeIdentifier})`: ''}</h4>
                        <p className="text-xs text-muted-foreground">Inspector: {inspection.inspectorName} | Date: {format(parseISO(inspection.inspectionDate), "PPP")}</p>
                        <p className={`text-sm font-semibold ${getPpeInspectionStatusColor(inspection.overallStatus)}`}>Status: {inspection.overallStatus}</p>
                        {inspection.nextInspectionDate && isValid(parseISO(inspection.nextInspectionDate)) && (
                             <p className="text-xs text-muted-foreground">Next Insp: {format(parseISO(inspection.nextInspectionDate), "PPP")}</p>
                        )}
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setViewingPpeInspection(inspection)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditPpeInspection(inspection)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Inspection Record?</AlertDialogTitle><AlertDialogDescription>Delete this inspection record? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePpeInspection(inspection.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                     {inspection.notes && <p className="text-xs text-muted-foreground mt-1 italic">Notes: {inspection.notes.substring(0,100)}{inspection.notes.length > 100 ? '...' : ''}</p>}
                     {inspection.followUpAction && <p className="text-xs text-muted-foreground mt-1">Follow-up: {inspection.followUpAction.substring(0,100)}{inspection.followUpAction.length > 100 ? '...' : ''}</p>}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {viewingPpeInspection && <PpeInspectionDetailsDialog inspection={viewingPpeInspection} ppeItemName={getPpeItemName(viewingPpeInspection.ppeItemId)} onClose={() => setViewingPpeInspection(null)} />}
      
      <Separator />

      {/* PPE Job Role Matrix Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-indigo-600" />PPE Job Role Matrix</CardTitle>
            <CardDescription>Define standard PPE requirements for different job roles.</CardDescription>
          </div>
          <Button onClick={handleOpenNewJobRoleForm} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={ppeItems.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" /> Define New Job Role PPE
          </Button>
        </CardHeader>
        <CardContent>
          {ppeItems.length === 0 && <p className="text-center text-muted-foreground py-4">Add PPE items to inventory first to define job role requirements.</p>}
          {ppeJobRoleMatrix.length === 0 && ppeItems.length > 0 && (
            <p className="text-muted-foreground text-center py-4">No job role PPE requirements defined yet.</p>
          )}
          {ppeJobRoleMatrix.length > 0 && (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {ppeJobRoleMatrix.map(entry => (
                  <Card key={entry.id} className="p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">{entry.jobRole}</h4>
                        <p className="text-xs text-muted-foreground">Requires: {entry.requiredPpeItemIds.length} PPE item(s)</p>
                        {entry.riskAssessmentReference && <p className="text-xs text-muted-foreground">RA Ref: {entry.riskAssessmentReference}</p>}
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setViewingJobRoleEntry(entry)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditJobRoleEntry(entry)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Job Role Entry?</AlertDialogTitle><AlertDialogDescription>Delete requirements for "{entry.jobRole}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteJobRoleEntry(entry.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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

      {isJobRoleFormOpen && (
        <Dialog open={isJobRoleFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsJobRoleFormOpen(false); setEditingJobRoleEntry(null); }}}>
            <PpeJobRoleMatrixForm 
                ppeItems={ppeItems} 
                initialData={editingJobRoleEntry}
                onSave={handleSaveJobRoleEntry}
                onCancel={() => { setIsJobRoleFormOpen(false); setEditingJobRoleEntry(null); }}
            />
        </Dialog>
      )}
      {viewingJobRoleEntry && <PpeJobRoleMatrixDetailsDialog entry={viewingJobRoleEntry} ppeItems={ppeItems} onClose={() => setViewingJobRoleEntry(null)} />}


      <Separator />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ListFilter className="h-6 w-6 text-gray-400"/>Advanced Inspection Scheduling (Placeholder)</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">More advanced features like rule-based scheduling and automated reminders (via backend) will be here.</p></CardContent>
      </Card>

    </div>
  );
}
    
