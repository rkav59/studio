
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog"; // Dialog will be used by forms
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, ClipboardList, FileText, CheckSquare, ShieldAlert } from "lucide-react";
import type { Contractor, PermitToWork, ContractorVettingStatus, PtwStatus } from "@/lib/types";
import { ContractorForm } from "@/components/contractor-safety/contractor-form";
import { PermitToWorkForm } from "@/components/contractor-safety/permit-to-work-form";
import { ContractorDetailsDialog } from "@/components/contractor-safety/contractor-details-dialog";
import { PtwDetailsDialog } from "@/components/contractor-safety/ptw-details-dialog";
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
import { Alert, AlertTitle } from '@/components/ui/alert';

const CONTRACTORS_STORAGE_KEY = 'sheild-contractors-v1';
const PTWS_STORAGE_KEY = 'sheild-ptws-v1';

export default function ContractorSafetyPage() {
  const { toast } = useToast();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [ptws, setPtws] = useState<PermitToWork[]>([]);

  const [isContractorFormOpen, setIsContractorFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [viewingContractor, setViewingContractor] = useState<Contractor | null>(null);

  const [isPtwFormOpen, setIsPtwFormOpen] = useState(false);
  const [editingPtw, setEditingPtw] = useState<PermitToWork | null>(null);
  const [viewingPtw, setViewingPtw] = useState<PermitToWork | null>(null);

  // Load contractors
  useEffect(() => {
    try {
      const storedContractors = localStorage.getItem(CONTRACTORS_STORAGE_KEY);
      if (storedContractors) setContractors(JSON.parse(storedContractors));
    } catch (error) {
      console.error("Error loading contractors:", error);
      toast({ title: "Error", description: "Could not load contractor data.", variant: "destructive" });
    }
  }, [toast]);

  // Save contractors
  useEffect(() => {
    try {
      localStorage.setItem(CONTRACTORS_STORAGE_KEY, JSON.stringify(contractors));
    } catch (error) {
      console.error("Error saving contractors:", error);
    }
  }, [contractors]);

  // Load PTWs
  useEffect(() => {
    try {
      const storedPtws = localStorage.getItem(PTWS_STORAGE_KEY);
      if (storedPtws) setPtws(JSON.parse(storedPtws));
    } catch (error) {
      console.error("Error loading PTWs:", error);
      toast({ title: "Error", description: "Could not load PTW data.", variant: "destructive" });
    }
  }, [toast]);

  // Save PTWs
  useEffect(() => {
    try {
      localStorage.setItem(PTWS_STORAGE_KEY, JSON.stringify(ptws));
    } catch (error) {
      console.error("Error saving PTWs:", error);
    }
  }, [ptws]);


  // Contractor Management
  const handleOpenNewContractorForm = () => {
    setEditingContractor(null);
    setIsContractorFormOpen(true);
  };

  const handleEditContractor = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setIsContractorFormOpen(true);
  };

  const handleDeleteContractor = (contractorId: string) => {
    // Optional: Check if contractor is linked to any PTWs before deleting
    if (ptws.some(ptw => ptw.contractorId === contractorId)) {
      toast({
        title: "Cannot Delete Contractor",
        description: "This contractor is associated with active or past Permits to Work. Please reassign or delete those PTWs first.",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    setContractors(prev => prev.filter(c => c.id !== contractorId));
    toast({ title: "Contractor Deleted", description: "The contractor has been deleted." });
  };

  const handleSaveContractor = (data: Omit<Contractor, 'id'>) => {
    if (editingContractor) {
      setContractors(prev => prev.map(c => c.id === editingContractor.id ? { ...editingContractor, ...data } : c));
      toast({ title: "Contractor Updated", description: `Details for ${data.companyName} updated.` });
    } else {
      const newContractor: Contractor = { id: crypto.randomUUID(), ...data };
      setContractors(prev => [newContractor, ...prev]);
      toast({ title: "Contractor Added", description: `${data.companyName} has been added.` });
    }
    setIsContractorFormOpen(false);
    setEditingContractor(null);
  };

  // PTW Management
  const handleOpenNewPtwForm = () => {
    if (contractors.length === 0) {
        toast({ title: "No Contractors", description: "Please add a contractor before creating a Permit to Work.", variant: "destructive"});
        return;
    }
    setEditingPtw(null);
    setIsPtwFormOpen(true);
  };

  const handleEditPtw = (ptw: PermitToWork) => {
    setEditingPtw(ptw);
    setIsPtwFormOpen(true);
  };

  const handleDeletePtw = (ptwId: string) => {
    setPtws(prev => prev.filter(p => p.id !== ptwId));
    toast({ title: "Permit Deleted", description: "The Permit to Work has been deleted." });
  };

  const handleSavePtw = (data: Omit<PermitToWork, 'id'>) => {
    if (editingPtw) {
      setPtws(prev => prev.map(p => p.id === editingPtw.id ? { ...editingPtw, ...data } : p));
      toast({ title: "Permit Updated", description: `Permit ${data.ptwNumber} updated.` });
    } else {
      const newPtw: PermitToWork = { id: crypto.randomUUID(), ...data };
      setPtws(prev => [newPtw, ...prev]);
      toast({ title: "Permit Created", description: `Permit ${data.ptwNumber} has been created.` });
    }
    setIsPtwFormOpen(false);
    setEditingPtw(null);
  };
  
  const getContractorName = (contractorId: string) => contractors.find(c => c.id === contractorId)?.companyName || "Unknown Contractor";

  const getVettingStatusColor = (status: ContractorVettingStatus) => {
    switch (status) {
      case 'Approved': return 'text-green-600 dark:text-green-400';
      case 'Pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'Rejected': return 'text-red-600 dark:text-red-400';
      case 'Requires Review': return 'text-orange-500 dark:text-orange-400';
      default: return 'text-muted-foreground';
    }
  };
  const getPtwStatusColor = (status: PtwStatus) => {
    switch (status) {
      case 'Approved':
      case 'Active': return 'text-green-600 dark:text-green-400';
      case 'Requested': return 'text-yellow-600 dark:text-yellow-400';
      case 'Closed': return 'text-gray-500 dark:text-gray-400';
      case 'Cancelled': 
      case 'Expired': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Contractors working safely on site" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="construction safety"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Contractor Safety</h1>
                <p className="text-sm text-neutral-300">Oversee contractor safety from vetting to on-site work.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module facilitates the management of contractor safety, including pre-qualification/vetting (with simulated document tracking), 
                induction status, and a Permit-to-Work (PTW) system. All data is stored locally in your browser.
            </p>
             <Alert variant="info" className="mt-4">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Backend Required for Full Functionality</AlertTitle>
                <div className="text-xs text-muted-foreground">
                    Features like actual document uploads, shared real-time data, automated notifications for PTW expiry or document renewals, and AI-assisted vetting require a backend system. 
                    The current implementation uses local browser storage for demonstration.
                </div>
            </Alert>
        </CardContent>
      </Card>

      {/* Contractor Management Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary"/>Contractor Register</CardTitle>
                <CardDescription>Manage contractor information, vetting status, and inductions.</CardDescription>
            </div>
            <Button onClick={handleOpenNewContractorForm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Contractor
            </Button>
        </CardHeader>
        <CardContent>
            {contractors.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No contractors registered yet.</p>
            ) : (
                <ScrollArea className="max-h-[400px] pr-3">
                    <div className="space-y-3">
                        {contractors.map(contractor => (
                            <Card key={contractor.id} className="p-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start">
                                    <div className="mb-2 sm:mb-0">
                                        <h4 className="font-semibold text-lg">{contractor.companyName}</h4>
                                        <p className="text-sm text-muted-foreground">Trade: {contractor.tradeOrService}</p>
                                        <p className="text-xs text-muted-foreground">Contact: {contractor.contactPerson}</p>
                                    </div>
                                    <div className="flex gap-2 self-start sm:self-center shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => setViewingContractor(contractor)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                                        <Button variant="secondary" size="sm" onClick={() => handleEditContractor(contractor)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete Contractor?</AlertDialogTitle>
                                                <AlertDialogDescription>Are you sure you want to delete {contractor.companyName}? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteContractor(contractor.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    <p>Vetting: <span className={`font-semibold ${getVettingStatusColor(contractor.vettingStatus)}`}>{contractor.vettingStatus}</span></p>
                                    <p>Induction: <span className={contractor.inductionCompleted ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{contractor.inductionCompleted ? "Completed" : "Pending"}</span></p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
      </Card>

      {isContractorFormOpen && (
        <Dialog open={isContractorFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsContractorFormOpen(false); setEditingContractor(null); }}}>
            <ContractorForm initialData={editingContractor} onSave={handleSaveContractor} onCancel={() => { setIsContractorFormOpen(false); setEditingContractor(null); }} />
        </Dialog>
      )}
      {viewingContractor && (
        <ContractorDetailsDialog contractor={viewingContractor} onClose={() => setViewingContractor(null)} />
      )}

      <Separator />

      {/* Permit to Work (PTW) Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6 text-accent"/>Permit to Work (PTW) Log</CardTitle>
                <CardDescription>Manage and track Permits to Work issued to contractors.</CardDescription>
            </div>
            <Button onClick={handleOpenNewPtwForm} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={contractors.length === 0}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New PTW
            </Button>
        </CardHeader>
        <CardContent>
            {contractors.length === 0 && <p className="text-center text-muted-foreground py-4">Please add a contractor first to enable PTW creation.</p>}
            {ptws.length === 0 && contractors.length > 0 && (
                <p className="text-muted-foreground text-center py-4">No Permits to Work logged yet.</p>
            )}
            {ptws.length > 0 && (
                <ScrollArea className="max-h-[400px] pr-3">
                    <div className="space-y-3">
                        {ptws.map(ptw => (
                            <Card key={ptw.id} className="p-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start">
                                    <div className="mb-2 sm:mb-0">
                                        <h4 className="font-semibold text-lg">PTW #: {ptw.ptwNumber}</h4>
                                        <p className="text-sm text-muted-foreground">For: {getContractorName(ptw.contractorId)}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-md">Work: {ptw.workDescription}</p>
                                    </div>
                                     <div className="flex gap-2 self-start sm:self-center shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => setViewingPtw(ptw)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                                        <Button variant="secondary" size="sm" onClick={() => handleEditPtw(ptw)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete PTW?</AlertDialogTitle>
                                                <AlertDialogDescription>Are you sure you want to delete PTW #{ptw.ptwNumber}? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePtw(ptw.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    <p>Status: <span className={`font-semibold ${getPtwStatusColor(ptw.status)}`}>{ptw.status}</span></p>
                                    <p>Location: {ptw.location}</p>
                                    <p>Valid: {format(parseISO(ptw.startDate), "Pp")} to {format(parseISO(ptw.endDate), "Pp")}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
      </Card>
      
      {isPtwFormOpen && (
         <Dialog open={isPtwFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsPtwFormOpen(false); setEditingPtw(null); }}}>
            <PermitToWorkForm contractors={contractors} initialData={editingPtw} onSave={handleSavePtw} onCancel={() => { setIsPtwFormOpen(false); setEditingPtw(null); }} />
        </Dialog>
      )}
       {viewingPtw && (
        <PtwDetailsDialog ptw={viewingPtw} contractorName={getContractorName(viewingPtw.contractorId)} onClose={() => setViewingPtw(null)} />
      )}

      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Further Enhancements (Require Backend)</CardTitle>
        </CardHeader>
        <CardContent>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Actual document uploads and secure storage (insurance, certifications).</li>
                    <li>Online safety induction training module with content and completion tracking.</li>
                    <li>Automated notifications for PTW expiry or document renewals.</li>
                    <li>Workflow for PTW approvals.</li>
                    <li>On-site supervision checklists and performance monitoring tools integrated with PTWs.</li>
                    <li>Linkage to incident logging for incidents involving contractors.</li>
                    <li>Contractor performance reviews and scoring based on historical data.</li>
                    <li>AI-assisted vetting using historical safety performance data.</li>
                </ul>
        </CardContent>
      </Card>

    </div>
  );
}
