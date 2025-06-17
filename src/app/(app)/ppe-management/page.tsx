
"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, Package, CheckCheck, ClipboardList, Users, Settings2, AlertTriangle, ListFilter, Search, ShieldCheck, Activity } from "lucide-react";
import type { PpeItem, PpeIssuanceRecord, PpeInspectionRecord, PpeItemStatus } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
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
import { PpeInspectionDetailsDialog } from '@/components/ppe-management/ppe-inspection-details-dialog'; // New Dialog

const PPE_ITEMS_KEY = 'sheild-ppe-items-v1';
const PPE_ISSUANCES_KEY = 'sheild-ppe-issuances-v1';
const PPE_INSPECTIONS_KEY = 'sheild-ppe-inspections-v1'; // New key for inspections

export default function PpeManagementPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [ppeItems, setPpeItems] = useState<PpeItem[]>([]);
  const [viewingPpeItem, setViewingPpeItem] = useState<PpeItem | null>(null);

  const [ppeIssuances, setPpeIssuances] = useState<PpeIssuanceRecord[]>([]);
  const [viewingPpeIssuance, setViewingPpeIssuance] = useState<PpeIssuanceRecord | null>(null);
  
  const [ppeInspections, setPpeInspections] = useState<PpeInspectionRecord[]>([]);
  const [viewingPpeInspection, setViewingPpeInspection] = useState<PpeInspectionRecord | null>(null);


  // --- Load & Save PPE Items ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PPE_ITEMS_KEY);
      if (stored) setPpeItems(JSON.parse(stored).map((item: PpeItem) => ({...item, status: item.status || 'Available'})));
    } catch (e) { console.error("Error loading PPE items:", e); }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(PPE_ITEMS_KEY, JSON.stringify(ppeItems)); }
    catch (e) { console.error("Error saving PPE items:", e); }
  }, [ppeItems]);

  // --- Load & Save PPE Issuances ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PPE_ISSUANCES_KEY);
      if (stored) setPpeIssuances(JSON.parse(stored));
    } catch (e) { console.error("Error loading PPE issuances:", e); }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(PPE_ISSUANCES_KEY, JSON.stringify(ppeIssuances)); }
    catch (e) { console.error("Error saving PPE issuances:", e); }
  }, [ppeIssuances]);

  // --- Load & Save PPE Inspections ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PPE_INSPECTIONS_KEY);
      if (stored) setPpeInspections(JSON.parse(stored));
    } catch (e) { console.error("Error loading PPE inspections:", e); }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(PPE_INSPECTIONS_KEY, JSON.stringify(ppeInspections)); }
    catch (e) { console.error("Error saving PPE inspections:", e); }
  }, [ppeInspections]);


  // --- PPE Item Management Handlers ---
  const handleOpenNewPpeItemForm = () => router.push('/ppe-management/items/new');
  const handleEditPpeItem = (item: PpeItem) => router.push(`/ppe-management/items/edit/${item.id}`);
  const handleDeletePpeItem = (itemId: string) => {
    if (ppeIssuances.some(issuance => issuance.ppeItemId === itemId) || ppeInspections.some(insp => insp.ppeItemId === itemId)) {
      toast({ title: "Cannot Delete", description: "This PPE item is linked to issuance or inspection records.", variant: "destructive" });
      return;
    }
    setPpeItems(prev => prev.filter(item => item.id !== itemId));
    toast({ title: "PPE Item Deleted" });
  };
  
  // --- PPE Issuance Management Handlers ---
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

  // --- PPE Inspection Management Handlers ---
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
            This module helps manage all aspects of Personal Protective Equipment, including inventory, status, issuance, and inspections. Data is stored locally.
          </p>
        </CardContent>
      </Card>

      {/* PPE Inventory Management Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary" />PPE Inventory</CardTitle>
            <CardDescription>View and manage all PPE items in your inventory, including types, stock levels, specifications, and current status.</CardDescription>
          </div>
          <Button onClick={handleOpenNewPpeItemForm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add PPE to Inventory
          </Button>
        </CardHeader>
        <CardContent>
          {ppeItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No PPE items in inventory yet.</p>
          ) : (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {ppeItems.map(item => (
                  <Card key={item.id} className="p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">{item.name} <span className="text-sm text-muted-foreground">({item.type} - {item.category})</span></h4>
                        <p className="text-xs text-muted-foreground">Stock: {item.currentStock} | Reorder: {item.reorderLevel}
                          {item.currentStock < item.reorderLevel && <span className="ml-2 text-red-500 font-bold">(Low Stock!)</span>}
                        </p>
                         <p className={`text-xs font-semibold ${getPpeItemStatusColor(item.status)} flex items-center gap-1`}><Activity className="h-3 w-3"/>Status: {item.status || 'Available'}</p>
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

      {/* PPE Issuance & Return Log */}
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

      {/* PPE Inspection Log Section */}
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


      {/* Placeholder Sections for Future Development */}
      <Separator />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-6 w-6 text-gray-400"/>PPE Job Role Matrix (Placeholder)</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Feature to define PPE requirements by job role will be implemented here.</p></CardContent>
      </Card>
       <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ListFilter className="h-6 w-6 text-gray-400"/>Inspection Scheduling (Placeholder)</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Advanced scheduling and reminder features for PPE inspections will be here.</p></CardContent>
      </Card>


    </div>
  );
}
    
