
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, ClipboardList, FileText, CheckSquare, ShieldAlert, Loader2, Download, Users, Settings, Search } from "lucide-react"; // Added Search
import type { Contractor, PermitToWork, ContractorVettingStatus, PtwStatus, ContractorDocument, PtwSupervisionRecord } from "@/lib/types";
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
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore'; // Added orderBy
import { ref as storageRef, deleteObject } from "firebase/storage";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CONTRACTORS_COLLECTION = 'contractors';
const PTWS_COLLECTION = 'permitsToWork';
const PTW_SUPERVISION_RECORDS_COLLECTION = 'ptwSupervisionRecords';


// Helper function to delete a single document from storage
async function deleteContractorDocumentFile(filePath: string) {
  if (!filePath) return;
  const fileRef = storageRef(storage, filePath);
  try {
    await deleteObject(fileRef);
  } catch (error: any) {
    if (error.code !== 'storage/object-not-found') {
      console.error("Error deleting file from storage:", error);
    }
  }
}


export default function ContractorSafetyPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [viewingContractor, setViewingContractor] = useState<Contractor | null>(null);
  const [viewingPtw, setViewingPtw] = useState<PermitToWork | null>(null);

  // Fetch Contractors
  const { data: contractors = [], isLoading: isLoadingContractors, error: contractorsError } = useQuery<Contractor[]>({
    queryKey: [CONTRACTORS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, CONTRACTORS_COLLECTION), where("userId", "==", user.uid), orderBy("companyName")); // Ordered by companyName
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return { 
              id: docSnap.id, ...data, 
              inductionDate: data.inductionDate instanceof Timestamp ? data.inductionDate.toDate().toISOString() : data.inductionDate,
              documents: (data.documents || []).map((d: any) => ({
                  ...d,
                  uploadedDate: d.uploadedDate instanceof Timestamp ? d.uploadedDate.toDate().toISOString() : d.uploadedDate,
                  expiryDate: d.expiryDate instanceof Timestamp ? d.expiryDate.toDate().toISOString() : d.expiryDate,
              }))
          } as Contractor;
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch PTWs
  const { data: ptws = [], isLoading: isLoadingPtws, error: ptwsError } = useQuery<PermitToWork[]>({
    queryKey: [PTWS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PTWS_COLLECTION), where("userId", "==", user.uid), orderBy("startDate", "desc")); // Ordered by startDate desc
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return { 
              id: docSnap.id, ...data,
              startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data.startDate,
              endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data.endDate,
              authorizationDate: data.authorizationDate instanceof Timestamp ? data.authorizationDate.toDate().toISOString() : data.authorizationDate,
              closureDate: data.closureDate instanceof Timestamp ? data.closureDate.toDate().toISOString() : data.closureDate,
          } as PermitToWork;
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch PTW Supervision Records
  const { data: ptwSupervisionRecords = [], isLoading: isLoadingSupervision, error: supervisionError } = useQuery<PtwSupervisionRecord[]>({
    queryKey: [PTW_SUPERVISION_RECORDS_COLLECTION, user?.uid],
    queryFn: async () => {
        if (!user?.uid) return [];
        const q = query(collection(db, PTW_SUPERVISION_RECORDS_COLLECTION), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                supervisionDate: (data.supervisionDate as Timestamp)?.toDate().toISOString(),
            } as PtwSupervisionRecord;
        });
    },
    enabled: !!user?.uid,
  });


  // Contractor Deletion Mutation
 const deleteContractorMutation = useMutation({
    mutationFn: async (contractorId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      
      const contractorToDelete = contractors.find(c => c.id === contractorId);
      if (!contractorToDelete) throw new Error("Contractor not found.");

      if (ptws.some(ptw => ptw.contractorId === contractorId)) {
        throw new Error("Contractor is associated with PTWs. Delete PTWs first or reassign them.");
      }

      if (contractorToDelete.documents && contractorToDelete.documents.length > 0) {
        const deletePromises = contractorToDelete.documents
          .filter(doc => doc.filePath)
          .map(doc => deleteContractorDocumentFile(doc.filePath!));
        await Promise.all(deletePromises);
      }
      
      await deleteDoc(doc(db, CONTRACTORS_COLLECTION, contractorId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, user?.uid] });
      toast({ title: "Contractor Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Contractor", description: e.message, variant: "destructive" }),
  });

  // PTW Deletion Mutation
  const deletePtwMutation = useMutation({
    mutationFn: async (ptwId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      // Check if PTW has supervision records
      if (ptwSupervisionRecords.some(sr => sr.ptwId === ptwId)) {
        throw new Error("This PTW has associated supervision records. Please delete them first.");
      }
      await deleteDoc(doc(db, PTWS_COLLECTION, ptwId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PTWS_COLLECTION, user?.uid] });
      toast({ title: "Permit Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting PTW", description: e.message, variant: "destructive" }),
  });

  // Navigation Handlers
  const handleOpenNewContractorForm = () => router.push('/contractor-safety/contractors/new');
  const handleEditContractor = (contractorId: string) => router.push(`/contractor-safety/contractors/edit/${contractorId}`);
  const handleDeleteContractor = (contractorId: string) => deleteContractorMutation.mutate(contractorId);

  const handleOpenNewPtwForm = () => {
    if (contractors.length === 0) {
        toast({ title: "No Contractors", description: "Please add a contractor before creating a Permit to Work.", variant: "destructive"});
        return;
    }
    router.push('/contractor-safety/ptws/new');
  };
  const handleEditPtw = (ptwId: string) => router.push(`/contractor-safety/ptws/edit/${ptwId}`);
  const handleDeletePtw = (ptwId: string) => deletePtwMutation.mutate(ptwId);
  const handleManageSupervision = (ptwId: string) => router.push(`/contractor-safety/ptws/${ptwId}/supervision`);
  
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

  if (isLoadingContractors || isLoadingPtws || isLoadingSupervision) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading contractor safety data...</p>
      </div>
    );
  }
  if (contractorsError || ptwsError || supervisionError) {
    return <div className="text-red-500 text-center py-10">Error loading data: {(contractorsError || ptwsError || supervisionError)?.message}</div>;
  }


  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Contractor Safety</h1>
        <p className="text-muted-foreground">
          Oversee contractor vetting, inductions, Permits-to-Work (PTW), and on-site supervision.
        </p>
         <Alert variant="info" className="!mt-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Data Storage & Security</AlertTitle>
            <div className="text-xs text-muted-foreground">
                Contractor metadata & PTW data is stored in Firestore. Documents are uploaded to Firebase Storage.
                Ensure appropriate Firebase Storage & Firestore security rules are in place.
            </div>
        </Alert>
      </div>

      {/* Contractor Management Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Contractor Register</CardTitle>
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
                                        <Button variant="secondary" size="sm" onClick={() => handleEditContractor(contractor.id)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" disabled={deleteContractorMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete Contractor?</AlertDialogTitle>
                                                <AlertDialogDescription>Are you sure you want to delete {contractor.companyName}? This will also delete associated documents from storage. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteContractor(contractor.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    <p>Vetting: <span className={`font-semibold ${getVettingStatusColor(contractor.vettingStatus)}`}>{contractor.vettingStatus}</span></p>
                                    <p>Induction: <span className={contractor.inductionCompleted ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{contractor.inductionCompleted ? "Completed" : "Pending"}</span></p>
                                    <p>Documents: <span className="font-semibold">{(contractor.documents || []).length}</span></p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
      </Card>

      {viewingContractor && (
        <ContractorDetailsDialog contractor={viewingContractor} onClose={() => setViewingContractor(null)} />
      )}

      <Separator />

      {/* Permit to Work (PTW) Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6 text-accent"/>Permit to Work (PTW) Log</CardTitle>
                <CardDescription>Manage PTWs and linked on-site supervision records.</CardDescription>
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
                        {ptws.map(ptw => {
                          const supervisionCount = ptwSupervisionRecords.filter(sr => sr.ptwId === ptw.id).length;
                          return (
                            <Card key={ptw.id} className="p-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start">
                                    <div className="mb-2 sm:mb-0">
                                        <h4 className="font-semibold text-lg">PTW #: {ptw.ptwNumber}</h4>
                                        <p className="text-sm text-muted-foreground">For: {getContractorName(ptw.contractorId)}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-md">Work: {ptw.workDescription}</p>
                                    </div>
                                     <div className="flex flex-wrap gap-2 self-start sm:self-center shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => setViewingPtw(ptw)}><Eye className="mr-1 h-3 w-3" /> View PTW</Button>
                                        <Button variant="outline" size="sm" onClick={() => handleManageSupervision(ptw.id)}>
                                            <Search className="mr-1 h-3 w-3" /> Supervision ({supervisionCount})
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={() => handleEditPtw(ptw.id)}><Edit2 className="mr-1 h-3 w-3" /> Edit PTW</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" disabled={deletePtwMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete PTW</Button>
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
                          );
                        })}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
      </Card>
      
       {viewingPtw && (
        <PtwDetailsDialog 
            ptw={viewingPtw} 
            contractorName={getContractorName(viewingPtw.contractorId)} 
            onClose={() => setViewingPtw(null)}
            supervisionRecordsCount={ptwSupervisionRecords.filter(sr => sr.ptwId === viewingPtw.id).length}
            onNavigateToSupervision={() => {
                handleManageSupervision(viewingPtw.id);
                setViewingPtw(null);
            }}
        />
      )}

      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-muted-foreground" />Further Enhancements</CardTitle>
        </CardHeader>
        <CardContent>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>On-site supervision checklists and performance monitoring tools integrated with PTWs.</li>
                    <li>Upload progress indicators.</li>
                    <li>Online safety induction training module with content and completion tracking.</li>
                    <li>Automated notifications (Cloud Functions) for PTW expiry or document renewals.</li>
                    <li>Workflow for PTW approvals (Cloud Functions and Firestore status updates).</li>
                    <li>Contractor performance reviews and scoring based on historical data.</li>
                    <li>AI-assisted vetting using historical safety performance data (Genkit/Cloud AI).</li>
                    <li>Supervision checklist template management.</li>
                </ul>
        </CardContent>
      </Card>

    </div>
  );
}
