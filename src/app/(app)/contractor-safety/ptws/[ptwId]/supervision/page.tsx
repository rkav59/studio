
"use client";

import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, FileText, ArrowLeft, Search, Loader2 } from "lucide-react";
import type { PtwSupervisionRecord, PermitToWork, Contractor } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
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
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const PTW_SUPERVISION_RECORDS_COLLECTION = 'ptwSupervisionRecords';
const PTWS_COLLECTION = 'permitsToWork';
const CONTRACTORS_COLLECTION = 'contractors';

export default function PtwSupervisionListPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ptwId = params.ptwId as string;

  const { data: contractors = [], isLoading: isLoadingContractors, error: contractorsError } = useQuery<Contractor[]>({
    queryKey: [CONTRACTORS_COLLECTION, user?.uid],
    queryFn: async () => {
        if (!user?.uid) return [];
        const q = query(collection(db, CONTRACTORS_COLLECTION), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Contractor));
    },
    enabled: !!user?.uid,
  });


  const { data: ptw, isLoading: isLoadingPtw, error: ptwError } = useQuery<PermitToWork | null>({
    queryKey: [PTWS_COLLECTION, ptwId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !ptwId) return null;
      const ptwRef = doc(db, PTWS_COLLECTION, ptwId);
      const ptwSnap = await getDoc(ptwRef);
      if (ptwSnap.exists() && ptwSnap.data().userId === user.uid) {
        const data = ptwSnap.data();
        return { 
          id: ptwSnap.id, 
          ...data,
          startDate: (data.startDate as Timestamp)?.toDate().toISOString(),
          endDate: (data.endDate as Timestamp)?.toDate().toISOString(),
          authorizationDate: data.authorizationDate ? (data.authorizationDate as Timestamp).toDate().toISOString() : undefined,
          closureDate: data.closureDate ? (data.closureDate as Timestamp).toDate().toISOString() : undefined,
        } as PermitToWork;
      }
      return null;
    },
    enabled: !!user?.uid && !!ptwId,
  });

  const { data: supervisionRecords = [], isLoading: isLoadingSupervision, error: supervisionError } = useQuery<PtwSupervisionRecord[]>({
    queryKey: [PTW_SUPERVISION_RECORDS_COLLECTION, ptwId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !ptwId) return [];
      const q = query(
        collection(db, PTW_SUPERVISION_RECORDS_COLLECTION),
        where("userId", "==", user.uid),
        where("ptwId", "==", ptwId),
        orderBy("supervisionDate", "desc")
      );
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
    enabled: !!user?.uid && !!ptwId,
  });

  const deleteSupervisionMutation = useMutation({
    mutationFn: async (supervisionId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      await deleteDoc(doc(db, PTW_SUPERVISION_RECORDS_COLLECTION, supervisionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PTW_SUPERVISION_RECORDS_COLLECTION, ptwId, user?.uid] });
      toast({ title: "Supervision Record Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Record", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleNavigateBack = () => router.push('/contractor-safety');
  const handleAddNewSupervision = () => router.push(`/contractor-safety/ptws/${ptwId}/supervision/new`);
  const handleEditSupervision = (supervisionId: string) => router.push(`/contractor-safety/ptws/${ptwId}/supervision/edit/${supervisionId}`);
  const handleDeleteSupervision = (supervisionId: string) => deleteSupervisionMutation.mutate(supervisionId);

  const getPerformanceRatingColor = (rating: PtwSupervisionRecord['overallPerformanceRating']) => {
    switch (rating) {
      case 'Excellent':
      case 'Good': return 'text-green-600 dark:text-green-400';
      case 'Fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'Poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };


  if (isLoadingPtw || isLoadingSupervision || isLoadingContractors) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ptwError || supervisionError || contractorsError || !ptw) {
    return (
      <div className="space-y-6 p-4">
        <Button variant="outline" onClick={handleNavigateBack}><ArrowLeft className="mr-2 h-4 w-4" />Back to Contractor Safety</Button>
        <Card>
          <CardHeader><CardTitle>Error</CardTitle></CardHeader>
          <CardContent><p>PTW not found or an error occurred while loading data.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleNavigateBack} aria-label="Back to Contractor Safety">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-500" /> Supervision Records for PTW: {ptw.ptwNumber}
          </h1>
          <p className="text-sm text-muted-foreground">Contractor: {contractors.find(c => c.id === ptw.contractorId)?.companyName || "Unknown"}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Supervision Log</CardTitle>
            <CardDescription>Manage on-site supervision and performance for this Permit to Work.</CardDescription>
          </div>
          <Button onClick={handleAddNewSupervision} className="bg-blue-500 hover:bg-blue-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Supervision Record
          </Button>
        </CardHeader>
        <CardContent>
          {supervisionRecords.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No supervision records yet for this PTW.</p>
          ) : (
            <ScrollArea className="max-h-[60vh] pr-3">
              <div className="space-y-3">
                {supervisionRecords.map(record => (
                  <Card key={record.id} className="p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">Supervision Date: {format(parseISO(record.supervisionDate), "PPP")}</h4>
                        <p className="text-sm text-muted-foreground">Supervisor: {record.supervisorName}</p>
                        <p className={`text-xs font-semibold ${getPerformanceRatingColor(record.overallPerformanceRating)}`}>
                          Overall Rating: {record.overallPerformanceRating}
                        </p>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0 mt-2 sm:mt-0">
                        <Button variant="secondary" size="sm" onClick={() => handleEditSupervision(record.id)}>
                          <Edit2 className="mr-1 h-3 w-3" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={deleteSupervisionMutation.isPending && deleteSupervisionMutation.variables === record.id}>
                              {deleteSupervisionMutation.isPending && deleteSupervisionMutation.variables === record.id ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Trash2 className="mr-1 h-3 w-3" />} Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Supervision Record?</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete this record from {format(parseISO(record.supervisionDate), "PPP")}? This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSupervision(record.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {record.summaryNotes && <p className="text-xs text-muted-foreground mt-1 italic">Notes: {record.summaryNotes.substring(0,150)}{record.summaryNotes.length > 150 ? '...' : ''}</p>}
                    {record.actionItemsRequired && <p className="text-xs text-red-500 mt-1">Actions: {record.actionItemsRequired.substring(0,150)}{record.actionItemsRequired.length > 150 ? '...' : ''}</p>}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    