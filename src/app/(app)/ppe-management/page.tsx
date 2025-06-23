
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, CheckCheck, ClipboardList, Settings2, AlertTriangle, ListFilter, Search, ShieldCheck, Activity, CalendarClock, ClockIcon, AlertCircle, Users, Loader2, HardHat } from "lucide-react";
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
import { PpeJobRoleMatrixDetailsDialog } from '@/components/ppe-management/ppe-job-role-matrix-details-dialog';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';

const PPE_ITEMS_COLLECTION = 'ppeItems';
const PPE_ISSUANCES_COLLECTION = 'ppeIssuances';
const PPE_INSPECTIONS_COLLECTION = 'ppeInspections';
const PPE_JOB_ROLE_MATRIX_COLLECTION = 'ppeJobRoleMatrix';
const REMINDER_LEAD_DAYS = 7; 

interface PpeItemWithInspectionInfo extends PpeItem {
  latestInspection?: PpeInspectionRecord;
  nextInspectionDueDate?: string; 
  dueStatus?: 'Overdue' | 'Due Soon' | 'Scheduled' | 'OK';
}

export default function PpeManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [viewingPpeItem, setViewingPpeItem] = useState<PpeItem | null>(null);
  const [viewingPpeIssuance, setViewingPpeIssuance] = useState<PpeIssuanceRecord | null>(null);
  const [viewingPpeInspection, setViewingPpeInspection] = useState<PpeInspectionRecord | null>(null);
  const [viewingJobRoleEntry, setViewingJobRoleEntry] = useState<PpeJobRoleMatrixEntry | null>(null);
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [issuanceSearchTerm, setIssuanceSearchTerm] = useState("");
  const [inspectionSearchTerm, setInspectionSearchTerm] = useState("");
  const [jobRoleSearchTerm, setJobRoleSearchTerm] = useState("");

  // Fetch PPE Items
  const { data: ppeItems = [], isLoading: isLoadingPpeItems, error: ppeItemsError } = useQuery<PpeItem[]>({
    queryKey: [PPE_ITEMS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PPE_ITEMS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: doc.data().status || 'Available' } as PpeItem));
    },
    enabled: !!user?.uid,
  });

  // Fetch PPE Issuances
  const { data: ppeIssuances = [], isLoading: isLoadingPpeIssuances, error: ppeIssuancesError } = useQuery<PpeIssuanceRecord[]>({
    queryKey: [PPE_ISSUANCES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PPE_ISSUANCES_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            issuedDate: (data.issuedDate as Timestamp)?.toDate().toISOString(),
          } as PpeIssuanceRecord;
      });
    },
    enabled: !!user?.uid,
  });
  
  // Fetch PPE Inspections
  const { data: ppeInspections = [], isLoading: isLoadingPpeInspections, error: ppeInspectionsError } = useQuery<PpeInspectionRecord[]>({
    queryKey: [PPE_INSPECTIONS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PPE_INSPECTIONS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          inspectionDate: (data.inspectionDate as Timestamp)?.toDate().toISOString(),
          nextInspectionDate: data.nextInspectionDate ? data.nextInspectionDate.toDate().toISOString() : undefined,
        } as PpeInspectionRecord
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch PPE Job Role Matrix
  const { data: ppeJobRoleMatrix = [], isLoading: isLoadingJobRoleMatrix, error: jobRoleMatrixError } = useQuery<PpeJobRoleMatrixEntry[]>({
    queryKey: [PPE_JOB_ROLE_MATRIX_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PPE_JOB_ROLE_MATRIX_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PpeJobRoleMatrixEntry));
    },
    enabled: !!user?.uid,
  });

  // Mutations (example for PPE Item delete, others would follow similar pattern)
  const deletePpeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      if (ppeIssuances.some(issuance => issuance.ppeItemId === itemId) || 
          ppeInspections.some(insp => insp.ppeItemId === itemId) ||
          ppeJobRoleMatrix.some(matrix => matrix.requiredPpeItemIds.includes(itemId)) ) {
        throw new Error("Cannot delete: This PPE item is linked to existing issuance, inspection, or job role matrix records.");
      }
      await deleteDoc(doc(db, PPE_ITEMS_COLLECTION, itemId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PPE_ITEMS_COLLECTION, user?.uid] });
      toast({ title: "PPE Item Deleted" });
    },
    onError: (e: Error) => {
        const userFriendlyMessage = e.message.includes("linked to existing") 
            ? e.message
            : "An unexpected error occurred. Please try again.";
        toast({ title: "Error Deleting PPE Item", description: userFriendlyMessage, variant: "destructive" });
    },
  });

  const deletePpeIssuanceMutation = useMutation({
    mutationFn: (issuanceId: string) => deleteDoc(doc(db, PPE_ISSUANCES_COLLECTION, issuanceId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PPE_ISSUANCES_COLLECTION, user?.uid] });
      toast({ title: "PPE Issuance Record Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Issuance", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const deletePpeInspectionMutation = useMutation({
    mutationFn: (inspectionId: string) => deleteDoc(doc(db, PPE_INSPECTIONS_COLLECTION, inspectionId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PPE_INSPECTIONS_COLLECTION, user?.uid] });
      toast({ title: "PPE Inspection Record Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Inspection", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });
  
  const deleteJobRoleEntryMutation = useMutation({
    mutationFn: (entryId: string) => deleteDoc(doc(db, PPE_JOB_ROLE_MATRIX_COLLECTION, entryId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PPE_JOB_ROLE_MATRIX_COLLECTION, user?.uid] });
      toast({ title: "Job Role Entry Deleted" });
    },
    onError: (e:Error) => toast({title: "Error Deleting Job Role Entry", description: "An unexpected error occurred. Please try again.", variant: "destructive"}),
  });


  const ppeItemsWithInspectionInfo = useMemo((): PpeItemWithInspectionInfo[] => {
    return ppeItems.map(item => {
      const itemInspections = ppeInspections
        .filter(insp => insp.ppeItemId === item.id && insp.nextInspectionDueDate && isValid(parseISO(insp.nextInspectionDueDate)))
        .sort((a, b) => parseISO(b.inspectionDate).getTime() - parseISO(a.inspectionDate).getTime()); 
      
      const latestRelevantInspection = itemInspections.find(insp => insp.nextInspectionDueDate); 

      let dueStatus: PpeItemWithInspectionInfo['dueStatus'] = 'OK';
      let nextDueDate: string | undefined = undefined;

      if (latestRelevantInspection?.nextInspectionDueDate) {
        nextDueDate = latestRelevantInspection.nextInspectionDueDate;
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
      if (overdueCount > 0 || dueSoonCount > 0) {
        toast({
          title: "PPE Inspection Reminders",
          description: `${overdueCount} item(s) overdue, ${dueSoonCount} item(s) due soon. Check 'Upcoming/Overdue Inspections'.`,
          variant: overdueCount > 0 ? "destructive" : "default", 
          duration: 10000,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingOrOverdueInspections]);


  const handleOpenNewPpeItemForm = () => router.push('/ppe-management/items/new');
  const handleEditPpeItem = (item: PpeItem) => router.push(`/ppe-management/items/edit/${item.id}`);
  const handleDeletePpeItem = (itemId: string) => deletePpeItemMutation.mutate(itemId);
  
  const handleOpenNewPpeIssuanceForm = () => {
    if (ppeItems.filter(item => (item.status || 'Available') === 'Available').length === 0) {
        toast({title: "No Available PPE Items", description: "Please add available PPE items to the inventory first.", variant: "destructive"});
        return;
    }
    router.push('/ppe-management/issuances/new');
  };
  const handleEditPpeIssuance = (issuance: PpeIssuanceRecord) => router.push(`/ppe-management/issuances/edit/${issuance.id}`);
  const handleDeletePpeIssuance = (issuanceId: string) => deletePpeIssuanceMutation.mutate(issuanceId);

  const handleOpenNewPpeInspectionForm = () => {
     if (ppeItems.length === 0) {
        toast({title: "No PPE Items", description: "Please add PPE items to inventory before logging inspections.", variant: "destructive"});
        return;
    }
    router.push('/ppe-management/inspections/new');
  }
  const handleEditPpeInspection = (inspection: PpeInspectionRecord) => router.push(`/ppe-management/inspections/edit/${inspection.id}`);
  const handleDeletePpeInspection = (inspectionId: string) => deletePpeInspectionMutation.mutate(inspectionId);

  const handleOpenNewJobRoleForm = () => {
    if (ppeItems.length === 0) {
        toast({title: "No PPE Items", description: "Please add PPE items to inventory first to define job role requirements.", variant: "destructive"});
        return;
    }
    router.push('/ppe-management/job-role-matrix/new');
  };
  const handleEditJobRoleEntry = (entry: PpeJobRoleMatrixEntry) => {
    router.push(`/ppe-management/job-role-matrix/edit/${entry.id}`);
  };
  const handleDeleteJobRoleEntry = (entryId: string) => deleteJobRoleEntryMutation.mutate(entryId);

  const getPpeItemName = (itemId: string) => ppeItems.find(item => item.id === itemId)?.name || "Unknown PPE";
  
  // Filtering Logic
  const filteredPpeItems = useMemo(() => ppeItemsWithInspectionInfo.filter(item => item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) || item.type.toLowerCase().includes(inventorySearchTerm.toLowerCase()) || item.category.toLowerCase().includes(inventorySearchTerm.toLowerCase())), [ppeItemsWithInspectionInfo, inventorySearchTerm]);
  const filteredPpeIssuances = useMemo(() => ppeIssuances.filter(issuance => issuance.employeeName.toLowerCase().includes(issuanceSearchTerm.toLowerCase()) || getPpeItemName(issuance.ppeItemId).toLowerCase().includes(issuanceSearchTerm.toLowerCase())), [ppeIssuances, issuanceSearchTerm, ppeItems]);
  const filteredPpeInspections = useMemo(() => ppeInspections.filter(insp => getPpeItemName(insp.ppeItemId).toLowerCase().includes(inspectionSearchTerm.toLowerCase()) || (insp.uniquePpeIdentifier && insp.uniquePpeIdentifier.toLowerCase().includes(inspectionSearchTerm.toLowerCase())) || insp.inspectorName.toLowerCase().includes(inspectionSearchTerm.toLowerCase())), [ppeInspections, inspectionSearchTerm, ppeItems]);
  const filteredJobRoleMatrix = useMemo(() => ppeJobRoleMatrix.filter(entry => entry.jobRole.toLowerCase().includes(jobRoleSearchTerm.toLowerCase())), [ppeJobRoleMatrix, jobRoleSearchTerm]);


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

  const isLoading = isLoadingPpeItems || isLoadingPpeIssuances || isLoadingPpeInspections || isLoadingJobRoleMatrix;
  const anyError = ppeItemsError || ppeIssuancesError || ppeInspectionsError || jobRoleMatrixError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading PPE data...</p>
      </div>
    );
  }

  if (anyError) {
    return <div className="text-red-500 text-center py-10">Error loading PPE data. Please try again later.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <HardHat className="h-8 w-8"/> PPE Management
        </h1>
        <p className="text-muted-foreground">
          Track inventory, issuance, inspections, and compliance for Personal Protective Equipment. Data stored in Firestore.
        </p>
      </div>

      <Separator/>

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
            <CardTitle>PPE Inventory</CardTitle>
            <CardDescription>View and manage all PPE items, their status, and next inspection due dates.</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search inventory..." className="pl-8 w-full sm:w-[200px]" value={inventorySearchTerm} onChange={(e) => setInventorySearchTerm(e.target.value)} /></div>
            <Button onClick={handleOpenNewPpeItemForm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPpeItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{inventorySearchTerm ? "No matching items found." : "No PPE items in inventory yet."}</p>
          ) : (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {filteredPpeItems.map(item => (
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
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deletePpeItemMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
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
            <CardTitle>PPE Issuance Log</CardTitle>
            <CardDescription>Track PPE issued to employees.</CardDescription>
          </div>
           <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search issuances..." className="pl-8 w-full sm:w-[200px]" value={issuanceSearchTerm} onChange={(e) => setIssuanceSearchTerm(e.target.value)} /></div>
            <Button onClick={handleOpenNewPpeIssuanceForm} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={ppeItems.filter(i => (i.status || 'Available') === 'Available').length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log Issuance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ppeItems.filter(i => (i.status || 'Available') === 'Available').length === 0 && ppeItems.length > 0 && <p className="text-center text-muted-foreground py-4">No PPE items currently marked 'Available' in inventory to log issuances.</p>}
          {filteredPpeIssuances.length === 0 && ppeItems.length > 0 && (
            <p className="text-muted-foreground text-center py-4">{issuanceSearchTerm ? "No matching issuances found." : "No PPE issuances logged yet."}</p>
          )}
          {filteredPpeIssuances.length > 0 && (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {filteredPpeIssuances.map(issuance => (
                  <Card key={issuance.id} className="p-4 shadow-sm">
                     <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">{issuance.employeeName} - {getPpeItemName(issuance.ppeItemId)} (x{issuance.quantityIssued})</h4>
                        <p className="text-xs text-muted-foreground">Issued: {format(parseISO(issuance.issuedDate), "PPP")}</p>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setViewingPpeIssuance(issuance)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditPpeIssuance(issuance)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deletePpeIssuanceMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search inspections..." className="pl-8 w-full sm:w-[200px]" value={inspectionSearchTerm} onChange={(e) => setInspectionSearchTerm(e.target.value)} /></div>
            <Button onClick={handleOpenNewPpeInspectionForm} className="bg-teal-600 hover:bg-teal-700 text-white" disabled={ppeItems.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log Inspection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ppeItems.length === 0 && <p className="text-center text-muted-foreground py-4">Add PPE items to inventory first to log inspections.</p>}
          {filteredPpeInspections.length === 0 && ppeItems.length > 0 && (
            <p className="text-muted-foreground text-center py-4">{inspectionSearchTerm ? "No matching inspections found." : "No PPE inspections logged yet."}</p>
          )}
          {filteredPpeInspections.length > 0 && (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {filteredPpeInspections.map(inspection => (
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
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deletePpeInspectionMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
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
           <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search job roles..." className="pl-8 w-full sm:w-[200px]" value={jobRoleSearchTerm} onChange={(e) => setJobRoleSearchTerm(e.target.value)} /></div>
            <Button onClick={handleOpenNewJobRoleForm} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={ppeItems.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" /> Define Job Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ppeItems.length === 0 && <p className="text-center text-muted-foreground py-4">Add PPE items to inventory first to define job role requirements.</p>}
          {filteredJobRoleMatrix.length === 0 && ppeItems.length > 0 && (
            <p className="text-muted-foreground text-center py-4">{jobRoleSearchTerm ? "No matching job roles found." : "No job role PPE requirements defined yet."}</p>
          )}
          {filteredJobRoleMatrix.length > 0 && (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {filteredJobRoleMatrix.map(entry => (
                  <Card key={entry.id} className="p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">{entry.jobRole}</h4>
                        <p className="text-xs text-muted-foreground">Requires: {entry.requiredPpeItemIds.length} PPE item(s)</p>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setViewingJobRoleEntry(entry)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditJobRoleEntry(entry)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteJobRoleEntryMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
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
      
      {viewingJobRoleEntry && <PpeJobRoleMatrixDetailsDialog entry={viewingJobRoleEntry} ppeItems={ppeItems} onClose={() => setViewingJobRoleEntry(null)} />}

      <Separator />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ListFilter className="h-6 w-6 text-gray-400"/>Advanced Functionality (Future)</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Future enhancements include rule-based inspection scheduling, automated reminders (via backend), and integration with inventory for stock level alerts.</p></CardContent>
      </Card>

    </div>
  );
}
