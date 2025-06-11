
"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, Package, CheckCheck, ClipboardList, Users, Settings2, AlertTriangle } from "lucide-react";
import type { PpeItem, PpeIssuanceRecord, PpeInspectionRecord, PpeComplianceAudit, PpeJobRoleMatrixEntry } from "@/lib/types";
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
import { PpeItemForm } from '@/components/ppe-management/ppe-item-form';
import { PpeItemDetailsDialog } from '@/components/ppe-management/ppe-item-details-dialog';
import { PpeIssuanceForm } from '@/components/ppe-management/ppe-issuance-form';
import { PpeIssuanceDetailsDialog } from '@/components/ppe-management/ppe-issuance-details-dialog';
// Placeholders for other forms/dialogs to be created
// import { PpeInspectionForm } from '@/components/ppe-management/ppe-inspection-form';
// import { PpeInspectionDetailsDialog } from '@/components/ppe-management/ppe-inspection-details-dialog';
// import { PpeComplianceAuditForm } from '@/components/ppe-management/ppe-compliance-audit-form';
// import { PpeComplianceAuditDetailsDialog } from '@/components/ppe-management/ppe-compliance-audit-details-dialog';
// import { PpeMatrixForm } from '@/components/ppe-management/ppe-matrix-form';
// import { PpeMatrixDetailsDialog } from '@/components/ppe-management/ppe-matrix-details-dialog';


const PPE_ITEMS_KEY = 'sheild-ppe-items-v1';
const PPE_ISSUANCES_KEY = 'sheild-ppe-issuances-v1';
// const PPE_INSPECTIONS_KEY = 'sheild-ppe-inspections-v1';
// const PPE_AUDITS_KEY = 'sheild-ppe-compliance-audits-v1';
// const PPE_MATRIX_KEY = 'sheild-ppe-jobrole-matrix-v1';


export default function PpeManagementPage() {
  const { toast } = useToast();

  // State for PPE Inventory
  const [ppeItems, setPpeItems] = useState<PpeItem[]>([]);
  const [isPpeItemFormOpen, setIsPpeItemFormOpen] = useState(false);
  const [editingPpeItem, setEditingPpeItem] = useState<PpeItem | null>(null);
  const [viewingPpeItem, setViewingPpeItem] = useState<PpeItem | null>(null);

  // State for PPE Issuances
  const [ppeIssuances, setPpeIssuances] = useState<PpeIssuanceRecord[]>([]);
  const [isPpeIssuanceFormOpen, setIsPpeIssuanceFormOpen] = useState(false);
  const [editingPpeIssuance, setEditingPpeIssuance] = useState<PpeIssuanceRecord | null>(null);
  const [viewingPpeIssuance, setViewingPpeIssuance] = useState<PpeIssuanceRecord | null>(null);

  // Placeholder states for other sections
  // const [ppeInspections, setPpeInspections] = useState<PpeInspectionRecord[]>([]);
  // const [ppeAudits, setPpeAudits] = useState<PpeComplianceAudit[]>([]);
  // const [ppeMatrix, setPpeMatrix] = useState<PpeJobRoleMatrixEntry[]>([]);

  // --- Load & Save PPE Items ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PPE_ITEMS_KEY);
      if (stored) setPpeItems(JSON.parse(stored));
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


  // --- PPE Item Management Handlers ---
  const handleOpenNewPpeItemForm = () => { setEditingPpeItem(null); setIsPpeItemFormOpen(true); };
  const handleEditPpeItem = (item: PpeItem) => { setEditingPpeItem(item); setIsPpeItemFormOpen(true); };
  const handleDeletePpeItem = (itemId: string) => {
    if (ppeIssuances.some(issuance => issuance.ppeItemId === itemId)) {
      toast({ title: "Cannot Delete", description: "This PPE item is linked to issuance records.", variant: "destructive" });
      return;
    }
    setPpeItems(prev => prev.filter(item => item.id !== itemId));
    toast({ title: "PPE Item Deleted" });
  };
  const handleSavePpeItem = (data: Omit<PpeItem, 'id'>) => {
    if (editingPpeItem) {
      setPpeItems(prev => prev.map(item => item.id === editingPpeItem.id ? { ...editingPpeItem, ...data } : item));
      toast({ title: "PPE Item Updated" });
    } else {
      setPpeItems(prev => [{ id: crypto.randomUUID(), ...data }, ...prev]);
      toast({ title: "PPE Item Added" });
    }
    setIsPpeItemFormOpen(false); setEditingPpeItem(null);
  };

  // --- PPE Issuance Management Handlers ---
  const handleOpenNewPpeIssuanceForm = () => {
    if (ppeItems.length === 0) {
        toast({title: "No PPE Items", description: "Please add PPE items to the inventory first.", variant: "destructive"});
        return;
    }
    setEditingPpeIssuance(null); setIsPpeIssuanceFormOpen(true);
  };
  const handleEditPpeIssuance = (issuance: PpeIssuanceRecord) => { setEditingPpeIssuance(issuance); setIsPpeIssuanceFormOpen(true); };
  const handleDeletePpeIssuance = (issuanceId: string) => {
    setPpeIssuances(prev => prev.filter(item => item.id !== issuanceId));
    toast({ title: "PPE Issuance Record Deleted" });
  };
  const handleSavePpeIssuance = (data: Omit<PpeIssuanceRecord, 'id'>) => {
    if (editingPpeIssuance) {
      setPpeIssuances(prev => prev.map(item => item.id === editingPpeIssuance.id ? { ...editingPpeIssuance, ...data } : item));
      toast({ title: "PPE Issuance Updated" });
    } else {
      setPpeIssuances(prev => [{ id: crypto.randomUUID(), ...data }, ...prev]);
      toast({ title: "PPE Issuance Logged" });
    }
    setIsPpeIssuanceFormOpen(false); setEditingPpeIssuance(null);
  };
  const getPpeItemName = (itemId: string) => ppeItems.find(item => item.id === itemId)?.name || "Unknown PPE";


  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image
            src="https://placehold.co/1200x400.png"
            alt="Various types of PPE"
            layout="fill"
            objectFit="cover"
            data-ai-hint="safety equipment"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">PPE Management</h1>
            <p className="text-sm text-neutral-300">Track inventory, issuance, inspections, and compliance for Personal Protective Equipment.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module helps manage all aspects of Personal Protective Equipment. Data is stored locally in your browser.
            Full scheduling, automated alerts, and complex reporting would require backend integration.
          </p>
        </CardContent>
      </Card>

      {/* PPE Inventory Management Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary" />PPE Inventory</CardTitle>
            <CardDescription>Manage PPE types, stock levels, and specifications.</CardDescription>
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
                        <p className="text-xs text-muted-foreground">Stock: {item.currentStock} | Reorder Level: {item.reorderLevel}
                          {item.currentStock < item.reorderLevel && <span className="ml-2 text-red-500 font-bold">(Low Stock!)</span>}
                        </p>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setViewingPpeItem(item)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditPpeItem(item)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete PPE Item?</AlertDialogTitle><AlertDialogDescription>Delete "{item.name}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
      {isPpeItemFormOpen && (
        <Dialog open={isPpeItemFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsPpeItemFormOpen(false); setEditingPpeItem(null); } }}>
          <PpeItemForm initialData={editingPpeItem} onSave={handleSavePpeItem} onCancel={() => { setIsPpeItemFormOpen(false); setEditingPpeItem(null); }} />
        </Dialog>
      )}
      {viewingPpeItem && <PpeItemDetailsDialog item={viewingPpeItem} onClose={() => setViewingPpeItem(null)} />}

      <Separator />

      {/* PPE Issuance & Return Log */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><CheckCheck className="h-6 w-6 text-accent" />PPE Issuance & Return Log</CardTitle>
            <CardDescription>Track PPE issued to employees and its return.</CardDescription>
          </div>
          <Button onClick={handleOpenNewPpeIssuanceForm} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={ppeItems.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" /> Log New Issuance
          </Button>
        </CardHeader>
        <CardContent>
          {ppeItems.length === 0 && <p className="text-center text-muted-foreground py-4">Add PPE items to inventory first to log issuances.</p>}
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
      {isPpeIssuanceFormOpen && (
        <Dialog open={isPpeIssuanceFormOpen} onOpenChange={(isOpen) => { if (!isOpen) { setIsPpeIssuanceFormOpen(false); setEditingPpeIssuance(null); } }}>
          <PpeIssuanceForm ppeItems={ppeItems} initialData={editingPpeIssuance} onSave={handleSavePpeIssuance} onCancel={() => { setIsPpeIssuanceFormOpen(false); setEditingPpeIssuance(null); }} />
        </Dialog>
      )}
      {viewingPpeIssuance && <PpeIssuanceDetailsDialog issuance={viewingPpeIssuance} ppeItemName={getPpeItemName(viewingPpeIssuance.ppeItemId)} onClose={() => setViewingPpeIssuance(null)} />}


      {/* Placeholder Sections for Future Development */}
      <Separator />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-6 w-6 text-gray-400"/>PPE Inspection Records (Placeholder)</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Feature to log and track PPE inspections will be implemented here.</p></CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-gray-400"/>PPE Compliance Audits (Placeholder)</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Feature for conducting PPE compliance audits will be implemented here.</p></CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-6 w-6 text-gray-400"/>PPE Job Role Matrix (Placeholder)</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Feature to define PPE requirements by job role will be implemented here.</p></CardContent>
      </Card>

    </div>
  );
}
