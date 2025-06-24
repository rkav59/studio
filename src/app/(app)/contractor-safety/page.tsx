
"use client";

import { useState, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, ClipboardList, FileText, CheckSquare, ShieldAlert, Loader2, Download, Users, Settings, Search, ListChecks, ClipboardCheck } from "lucide-react"; // Added ClipboardCheck
import type { Contractor, PermitToWork, ContractorVettingStatus, PtwStatus, ContractorDocument, PtwSupervisionRecord, JobCard, JobCardStatus } from "@/lib/types"; // Added JobCard types
import { ContractorDetailsDialog } from "@/components/contractor-safety/contractor-details-dialog";
import { PtwDetailsDialog } from "@/components/contractor-safety/ptw-details-dialog";
import { JobCardDetailsDialog } from "@/components/contractor-safety/job-card-details-dialog"; // New import
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
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore'; 
import { ref as storageRef, deleteObject } from "firebase/storage";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';


const CONTRACTORS_COLLECTION = 'contractors';
const PTWS_COLLECTION = 'permitsToWork';
const PTW_SUPERVISION_RECORDS_COLLECTION = 'ptwSupervisionRecords';
const JOB_CARDS_COLLECTION = 'jobCards'; // New collection constant


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
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [viewingContractor, setViewingContractor] = useState<Contractor | null>(null);
  const [viewingPtw, setViewingPtw] = useState<PermitToWork | null>(null);
  const [viewingJobCard, setViewingJobCard] = useState<JobCard | null>(null); // New state
  const [contractorSearchTerm, setContractorSearchTerm] = useState("");
  const [ptwSearchTerm, setPtwSearchTerm] = useState("");
  const [jobCardSearchTerm, setJobCardSearchTerm] = useState(""); // New state

  const canManage = useMemo(() => user?.email === 'sentriq263@gmail.com' || (userProfile && ['admin', 'she_officer'].includes(userProfile.role)), [user, userProfile]);
  const disabledTooltipContent = "You do not have permission to perform this action.";


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

  // Fetch Job Cards
  const { data: jobCards = [], isLoading: isLoadingJobCards, error: jobCardsError } = useQuery<JobCard[]>({
    queryKey: [JOB_CARDS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, JOB_CARDS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id, ...data,
          workDate: (data.workDate as Timestamp)?.toDate().toISOString(),
        } as JobCard;
      });
      data.sort((a,b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime());
      return data;
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

      if (ptws.some(ptw => ptw.contractorId === contractorId) || jobCards.some(jc => jc.contractorId === contractorId)) {
        throw new Error("Cannot delete: Contractor is associated with existing Permits to Work or Job Cards.");
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
    onError: (e: Error) => {
        const userFriendlyMessage = e.message.includes("associated with existing") 
            ? e.message
            : "An unexpected error occurred. Please try again.";
        toast({ title: "Error Deleting Contractor", description: userFriendlyMessage, variant: "destructive" });
    },
  });

  // PTW Deletion Mutation
  const deletePtwMutation = useMutation({
    mutationFn: async (ptwId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      // Check if PTW has supervision records
      if (ptwSupervisionRecords.some(sr => sr.ptwId === ptwId)) {
        throw new Error("Cannot delete: This PTW has associated supervision records. Please delete them first.");
      }
      await deleteDoc(doc(db, PTWS_COLLECTION, ptwId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PTWS_COLLECTION, user?.uid] });
      toast({ title: "Permit Deleted" });
    },
    onError: (e: Error) => {
        const userFriendlyMessage = e.message.includes("associated supervision records")
            ? e.message
            : "An unexpected error occurred. Please try again.";
        toast({ title: "Error Deleting PTW", description: userFriendlyMessage, variant: "destructive" });
    },
  });

  // Job Card Deletion Mutation
  const deleteJobCardMutation = useMutation({
    mutationFn: async (jobCardId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      await deleteDoc(doc(db, JOB_CARDS_COLLECTION, jobCardId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOB_CARDS_COLLECTION, user?.uid] });
      toast({ title: "Job Card Deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error Deleting Job Card", description: "An unexpected error occurred.", variant: "destructive" });
    },
  });


  const getContractorName = (contractorId: string) => contractors.find(c => c.id === contractorId)?.companyName || "Unknown Contractor";

  const filteredContractors = useMemo(() => {
    if (!contractorSearchTerm) return contractors;
    const lowercasedTerm = contractorSearchTerm.toLowerCase();
    return contractors.filter(c =>
      c.companyName.toLowerCase().includes(lowercasedTerm) ||
      c.tradeOrService.toLowerCase().includes(lowercasedTerm) ||
      c.contactPerson.toLowerCase().includes(lowercasedTerm)
    );
  }, [contractors, contractorSearchTerm]);

  const filteredPtws = useMemo(() => {
    if (!ptwSearchTerm) return ptws;
    const lowercasedTerm = ptwSearchTerm.toLowerCase();
    return ptws.filter(ptw =>
      ptw.ptwNumber.toLowerCase().includes(lowercasedTerm) ||
      ptw.workDescription.toLowerCase().includes(lowercasedTerm) ||
      getContractorName(ptw.contractorId).toLowerCase().includes(lowercasedTerm)
    );
  }, [ptws, ptwSearchTerm, contractors]);

  const filteredJobCards = useMemo(() => {
    if (!jobCardSearchTerm) return jobCards;
    const lowercasedTerm = jobCardSearchTerm.toLowerCase();
    return jobCards.filter(jc =>
      jc.jobCardNumber.toLowerCase().includes(lowercasedTerm) ||
      jc.jobDescription.toLowerCase().includes(lowercasedTerm) ||
      getContractorName(jc.contractorId).toLowerCase().includes(lowercasedTerm)
    );
  }, [jobCards, jobCardSearchTerm, getContractorName]);



  // Navigation Handlers
  const handleOpenNewContractorForm = () => canManage && router.push('/contractor-safety/contractors/new');
  const handleEditContractor = (contractorId: string) => canManage && router.push(`/contractor-safety/contractors/edit/${contractorId}`);
  const handleDeleteContractor = (contractorId: string) => deleteContractorMutation.mutate(contractorId);

  const handleOpenNewPtwForm = () => {
    if (!canManage) return;
    if (contractors.length === 0) {
        toast({ title: "No Contractors", description: "Please add a contractor before creating a Permit to Work.", variant: "destructive"});
        return;
    }
    router.push('/contractor-safety/ptws/new');
  };
  const handleEditPtw = (ptwId: string) => canManage && router.push(`/contractor-safety/ptws/edit/${ptwId}`);
  const handleDeletePtw = (ptwId: string) => deletePtwMutation.mutate(ptwId);
  const handleManageSupervision = (ptwId: string) => router.push(`/contractor-safety/ptws/${ptwId}/supervision`);
  
  const handleOpenNewJobCardForm = () => {
    if (!canManage) return;
    if (contractors.length === 0) {
      toast({ title: "No Contractors", description: "Please add a contractor before creating a Job Card.", variant: "destructive"});
      return;
    }
    router.push('/contractor-safety/job-cards/new');
  };
  const handleEditJobCard = (jobCardId: string) => canManage && router.push(`/contractor-safety/job-cards/edit/${jobCardId}`);
  const handleDeleteJobCard = (jobCardId: string) => deleteJobCardMutation.mutate(jobCardId);


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
  const getJobCardStatusColor = (status: JobCardStatus) => {
    switch (status) {
      case 'Issued':
      case 'In Progress': return 'text-green-600 dark:text-green-400';
      case 'Draft': return 'text-yellow-600 dark:text-yellow-400';
      case 'Completed': return 'text-gray-500 dark:text-gray-400';
      case 'Cancelled': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };


  if (isLoadingContractors || isLoadingPtws || isLoadingSupervision || isLoadingJobCards) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading contractor safety data...</p>
      </div>
    );
  }
  if (contractorsError || ptwsError || supervisionError || jobCardsError) {
    return <div className="text-red-500 text-center py-10">Error loading data. Please try again later.</div>;
  }


  return (
    <TooltipProvider>
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <ListChecks className="h-8 w-8"/> Contractor Safety
        </h1>
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

       <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="#contractor-register">Contractor Register</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#job-cards">Job Cards</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#ptw-log">Permit to Work Log</Link>
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Contractor Management Section */}
      <Card id="contractor-register">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Contractor Register</CardTitle>
                <CardDescription>Manage contractor information, vetting status, and inductions.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search contractors..."
                        className="pl-8 w-full sm:w-[250px]"
                        value={contractorSearchTerm}
                        onChange={(e) => setContractorSearchTerm(e.target.value)}
                    />
                </div>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}>
                            <Button onClick={handleOpenNewContractorForm} disabled={!canManage} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New Contractor
                            </Button>
                        </div>
                    </TooltipTrigger>
                    {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                 </Tooltip>
            </div>
        </CardHeader>
        <CardContent>
            {filteredContractors.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{contractorSearchTerm ? "No matching contractors found." : "No contractors registered yet."}</p>
            ) : (
                <ScrollArea className="max-h-[400px] pr-3">
                    <div className="space-y-3">
                        {filteredContractors.map(contractor => (
                            <Card key={contractor.id} className="p-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start">
                                    <div className="mb-2 sm:mb-0">
                                        <h4 className="font-semibold text-lg">{contractor.companyName}</h4>
                                        <p className="text-sm text-muted-foreground">Trade: {contractor.tradeOrService}</p>
                                        <p className="text-xs text-muted-foreground">Contact: {contractor.contactPerson}</p>
                                    </div>
                                    <div className="flex gap-2 self-start sm:self-center shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => setViewingContractor(contractor)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                                        <Tooltip>
                                            <TooltipTrigger asChild><div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}><Button variant="secondary" size="sm" onClick={() => handleEditContractor(contractor.id)} disabled={!canManage}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button></div></TooltipTrigger>
                                            {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                                        </Tooltip>
                                        <AlertDialog>
                                        <Tooltip>
                                            <TooltipTrigger asChild><div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={!canManage || deleteContractorMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger></div></TooltipTrigger>
                                            {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                                        </Tooltip>
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

      {/* Job Card Section */}
      <Card id="job-cards">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-6 w-6 text-indigo-500"/>Job Cards</CardTitle>
                <CardDescription>Manage general work authorizations and safety checks.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search job cards..."
                        className="pl-8 w-full sm:w-[250px]"
                        value={jobCardSearchTerm}
                        onChange={(e) => setJobCardSearchTerm(e.target.value)}
                    />
                </div>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}>
                           <Button onClick={handleOpenNewJobCardForm} className="bg-indigo-500 hover:bg-indigo-600 text-white" disabled={!canManage || contractors.length === 0}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create New Job Card
                           </Button>
                        </div>
                    </TooltipTrigger>
                    {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                 </Tooltip>
            </div>
        </CardHeader>
        <CardContent>
          {contractors.length === 0 && <p className="text-center text-muted-foreground py-4">Please add a contractor first to enable Job Card creation.</p>}
          {filteredJobCards.length === 0 && contractors.length > 0 && (
              <p className="text-muted-foreground text-center py-4">{jobCardSearchTerm ? "No matching job cards found." : "No job cards logged yet."}</p>
          )}
          {filteredJobCards.length > 0 && (
              <ScrollArea className="max-h-[400px] pr-3">
                  <div className="space-y-3">
                      {filteredJobCards.map(jc => (
                          <Card key={jc.id} className="p-4 shadow-sm">
                              <div className="flex flex-col sm:flex-row justify-between items-start">
                                  <div className="mb-2 sm:mb-0">
                                      <h4 className="font-semibold text-lg">Job Card #: {jc.jobCardNumber}</h4>
                                      <p className="text-sm text-muted-foreground">For: {getContractorName(jc.contractorId)}</p>
                                      <p className="text-xs text-muted-foreground truncate max-w-md">Job: {jc.jobDescription}</p>
                                  </div>
                                   <div className="flex flex-wrap gap-2 self-start sm:self-center shrink-0">
                                      <Button variant="outline" size="sm" onClick={() => setViewingJobCard(jc)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                                       <Tooltip>
                                            <TooltipTrigger asChild><div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}><Button variant="secondary" size="sm" onClick={() => handleEditJobCard(jc.id)} disabled={!canManage}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button></div></TooltipTrigger>
                                            {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                                        </Tooltip>
                                      <AlertDialog>
                                        <Tooltip>
                                            <TooltipTrigger asChild><div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={!canManage || deleteJobCardMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger></div></TooltipTrigger>
                                            {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                                        </Tooltip>
                                          <AlertDialogContent>
                                              <AlertDialogHeader><AlertDialogTitle>Delete Job Card?</AlertDialogTitle>
                                              <AlertDialogDescription>Are you sure you want to delete Job Card #{jc.jobCardNumber}? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteJobCard(jc.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>
                                  </div>
                              </div>
                              <Separator className="my-2" />
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                  <p>Status: <span className={`font-semibold ${getJobCardStatusColor(jc.status)}`}>{jc.status}</span></p>
                                  <p>Location: {jc.location}</p>
                                  <p>Work Date: {format(parseISO(jc.workDate), "PPP")}</p>
                              </div>
                          </Card>
                      ))}
                  </div>
              </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {viewingJobCard && (
        <JobCardDetailsDialog 
            jobCard={viewingJobCard} 
            contractorName={getContractorName(viewingJobCard.contractorId)} 
            onClose={() => setViewingJobCard(null)}
        />
      )}

      <Separator />


      {/* Permit to Work (PTW) Section */}
      <Card id="ptw-log">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div>
                <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6 text-accent"/>Permit to Work (PTW) Log</CardTitle>
                <CardDescription>Manage PTWs and linked on-site supervision records.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search PTWs..."
                        className="pl-8 w-full sm:w-[250px]"
                        value={ptwSearchTerm}
                        onChange={(e) => setPtwSearchTerm(e.target.value)}
                    />
                </div>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}>
                           <Button onClick={handleOpenNewPtwForm} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!canManage || contractors.length === 0}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create New PTW
                           </Button>
                        </div>
                    </TooltipTrigger>
                    {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                 </Tooltip>
            </div>
        </CardHeader>
        <CardContent>
            {contractors.length === 0 && <p className="text-center text-muted-foreground py-4">Please add a contractor first to enable PTW creation.</p>}
            {filteredPtws.length === 0 && contractors.length > 0 && (
                <p className="text-muted-foreground text-center py-4">{ptwSearchTerm ? "No matching PTWs found." : "No Permits to Work logged yet."}</p>
            )}
            {filteredPtws.length > 0 && (
                <ScrollArea className="max-h-[400px] pr-3">
                    <div className="space-y-3">
                        {filteredPtws.map(ptw => {
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
                                        <Tooltip>
                                            <TooltipTrigger asChild><div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}><Button variant="secondary" size="sm" onClick={() => handleEditPtw(ptw.id)} disabled={!canManage}><Edit2 className="mr-1 h-3 w-3" /> Edit PTW</Button></div></TooltipTrigger>
                                            {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                                        </Tooltip>
                                        <AlertDialog>
                                            <Tooltip>
                                                <TooltipTrigger asChild><div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={!canManage || deletePtwMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete PTW</Button></AlertDialogTrigger></div></TooltipTrigger>
                                                {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                                            </Tooltip>
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
    </TooltipProvider>
  );
}
