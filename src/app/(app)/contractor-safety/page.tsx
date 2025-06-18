
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, ClipboardList, FileText, CheckSquare, ShieldAlert, Loader2 } from "lucide-react";
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
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CONTRACTORS_COLLECTION = 'contractors';
const PTWS_COLLECTION = 'permitsToWork';

export default function ContractorSafetyPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isContractorFormOpen, setIsContractorFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [viewingContractor, setViewingContractor] = useState<Contractor | null>(null);

  const [isPtwFormOpen, setIsPtwFormOpen] = useState(false);
  const [editingPtw, setEditingPtw] = useState<PermitToWork | null>(null);
  const [viewingPtw, setViewingPtw] = useState<PermitToWork | null>(null);

  // Fetch Contractors
  const { data: contractors = [], isLoading: isLoadingContractors, error: contractorsError } = useQuery<Contractor[]>({
    queryKey: [CONTRACTORS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, CONTRACTORS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contractor));
    },
    enabled: !!user?.uid,
  });

  // Fetch PTWs
  const { data: ptws = [], isLoading: isLoadingPtws, error: ptwsError } = useQuery<PermitToWork[]>({
    queryKey: [PTWS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PTWS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PermitToWork));
    },
    enabled: !!user?.uid,
  });

  // Contractor Mutations
  const addContractorMutation = useMutation({
    mutationFn: (newContractorData: Omit<Contractor, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      return addDoc(collection(db, CONTRACTORS_COLLECTION), { ...newContractorData, userId: user.uid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, user?.uid] });
      toast({ title: "Contractor Added" });
      setIsContractorFormOpen(false); setEditingContractor(null);
    },
    onError: (e: Error) => toast({ title: "Error Adding Contractor", description: e.message, variant: "destructive" }),
  });

  const updateContractorMutation = useMutation({
    mutationFn: (contractorToUpdate: Contractor) => {
      if (!user?.uid || !contractorToUpdate.id) throw new Error("Missing user or contractor ID.");
      const { id, ...data } = contractorToUpdate;
      return updateDoc(doc(db, CONTRACTORS_COLLECTION, id), { ...data, userId: user.uid });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, user?.uid] });
      toast({ title: "Contractor Updated", description: `Details for ${vars.companyName} updated.` });
      setIsContractorFormOpen(false); setEditingContractor(null);
    },
    onError: (e: Error) => toast({ title: "Error Updating Contractor", description: e.message, variant: "destructive" }),
  });

  const deleteContractorMutation = useMutation({
    mutationFn: async (contractorId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      if (ptws.some(ptw => ptw.contractorId === contractorId)) {
        throw new Error("Contractor is associated with PTWs. Delete PTWs first.");
      }
      await deleteDoc(doc(db, CONTRACTORS_COLLECTION, contractorId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, user?.uid] });
      toast({ title: "Contractor Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Contractor", description: e.message, variant: "destructive" }),
  });

  // PTW Mutations
  const addPtwMutation = useMutation({
    mutationFn: (newPtwData: Omit<PermitToWork, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      return addDoc(collection(db, PTWS_COLLECTION), { ...newPtwData, userId: user.uid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PTWS_COLLECTION, user?.uid] });
      toast({ title: "Permit Created" });
      setIsPtwFormOpen(false); setEditingPtw(null);
    },
    onError: (e: Error) => toast({ title: "Error Creating PTW", description: e.message, variant: "destructive" }),
  });

  const updatePtwMutation = useMutation({
    mutationFn: (ptwToUpdate: PermitToWork) => {
      if (!user?.uid || !ptwToUpdate.id) throw new Error("Missing user or PTW ID.");
      const { id, ...data } = ptwToUpdate;
      return updateDoc(doc(db, PTWS_COLLECTION, id), { ...data, userId: user.uid });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [PTWS_COLLECTION, user?.uid] });
      toast({ title: "Permit Updated", description: `Permit ${vars.ptwNumber} updated.` });
      setIsPtwFormOpen(false); setEditingPtw(null);
    },
    onError: (e: Error) => toast({ title: "Error Updating PTW", description: e.message, variant: "destructive" }),
  });

  const deletePtwMutation = useMutation({
    mutationFn: (ptwId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      return deleteDoc(doc(db, PTWS_COLLECTION, ptwId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PTWS_COLLECTION, user?.uid] });
      toast({ title: "Permit Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting PTW", description: e.message, variant: "destructive" }),
  });


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
    deleteContractorMutation.mutate(contractorId);
  };

  const handleSaveContractor = (data: Omit<Contractor, 'id'>) => {
    if (editingContractor) {
      updateContractorMutation.mutate({ ...editingContractor, ...data });
    } else {
      addContractorMutation.mutate(data);
    }
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
    deletePtwMutation.mutate(ptwId);
  };

  const handleSavePtw = (data: Omit<PermitToWork, 'id'>) => {
    if (editingPtw) {
      updatePtwMutation.mutate({ ...editingPtw, ...data });
    } else {
      addPtwMutation.mutate(data);
    }
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

  if (isLoadingContractors || isLoadingPtws) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading contractor safety data...</p>
      </div>
    );
  }
  if (contractorsError || ptwsError) {
    return <div className="text-red-500 text-center py-10">Error loading data: {(contractorsError || ptwsError)?.message}</div>;
  }


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
                <p className="text-sm text-neutral-300">Oversee contractor safety from vetting to on-site work. Data stored in Firestore.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module facilitates the management of contractor safety, including pre-qualification/vetting, 
                induction status, and a Permit-to-Work (PTW) system. All data is now stored securely in Firebase Firestore.
            </p>
             <Alert variant="info" className="mt-4">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Real-time & Secure Data</AlertTitle>
                <div className="text-xs text-muted-foreground">
                    With Firestore integration, your data is persistent and can be accessed across sessions. 
                    Actual document uploads, shared real-time data, and automated notifications would require further backend development (e.g., Cloud Functions for Firebase).
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
            <Button onClick={handleOpenNewContractorForm} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={addContractorMutation.isPending || updateContractorMutation.isPending}>
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
                                        <Button variant="secondary" size="sm" onClick={() => handleEditContractor(contractor)} disabled={updateContractorMutation.isPending}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" disabled={deleteContractorMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
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
            <Button onClick={handleOpenNewPtwForm} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={contractors.length === 0 || addPtwMutation.isPending || updatePtwMutation.isPending}>
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
                                        <Button variant="secondary" size="sm" onClick={() => handleEditPtw(ptw)} disabled={updatePtwMutation.isPending}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" disabled={deletePtwMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
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
            <CardTitle>Further Enhancements (Require Backend/Cloud Functions)</CardTitle>
        </CardHeader>
        <CardContent>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Actual document uploads and secure storage (Firebase Storage).</li>
                    <li>Online safety induction training module with content and completion tracking.</li>
                    <li>Automated notifications (Cloud Functions) for PTW expiry or document renewals.</li>
                    <li>Workflow for PTW approvals (Cloud Functions and Firestore status updates).</li>
                    <li>On-site supervision checklists and performance monitoring tools integrated with PTWs.</li>
                    <li>Linkage to incident logging for incidents involving contractors.</li>
                    <li>Contractor performance reviews and scoring based on historical data.</li>
                    <li>AI-assisted vetting using historical safety performance data (Genkit/Cloud AI).</li>
                </ul>
        </CardContent>
      </Card>

    </div>
  );
}
