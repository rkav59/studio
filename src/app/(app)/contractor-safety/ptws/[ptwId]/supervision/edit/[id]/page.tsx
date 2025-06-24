
"use client";

import { useRouter, useParams } from 'next/navigation';
import { PtwSupervisionForm, type PtwSupervisionFormValues } from "@/components/contractor-safety/ptw-supervision-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PtwSupervisionRecord, PermitToWork } from '@/lib/types';
import { parseISO, format } from 'date-fns';
import { ArrowLeft, Search } from 'lucide-react';

const PTW_SUPERVISION_RECORDS_COLLECTION = 'ptwSupervisionRecords';
const PTWS_COLLECTION = 'permitsToWork';

export default function EditPtwSupervisionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const ptwId = params.ptwId as string;
  const supervisionId = params.id as string;

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

  const { data: recordToEdit, isLoading: isLoadingRecord, error: recordError } = useQuery<PtwSupervisionRecord | null>({
    queryKey: [PTW_SUPERVISION_RECORDS_COLLECTION, supervisionId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !supervisionId) return null;
      const recordRef = doc(db, PTW_SUPERVISION_RECORDS_COLLECTION, supervisionId);
      const recordSnap = await getDoc(recordRef);
      if (recordSnap.exists() && recordSnap.data().userId === user.uid) {
        const data = recordSnap.data();
        return { 
          id: recordSnap.id, 
          ...data,
          supervisionDate: (data.supervisionDate as Timestamp)?.toDate().toISOString(),
        } as PtwSupervisionRecord;
      }
      return null;
    },
    enabled: !!user?.uid && !!supervisionId,
  });

  const updateSupervisionMutation = useMutation({
    mutationFn: async (updatedData: PtwSupervisionRecord) => {
      if (!user?.uid || !updatedData.id) throw new Error("User or record ID missing.");
      const { id, ...dataToUpdate } = updatedData;
      const recordRef = doc(db, PTW_SUPERVISION_RECORDS_COLLECTION, id);
      const dataForDb = {
        ...dataToUpdate,
        userId: user.uid,
        supervisionDate: Timestamp.fromDate(parseISO(dataToUpdate.supervisionDate as string)),
      };
      await updateDoc(recordRef, dataForDb);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PTW_SUPERVISION_RECORDS_COLLECTION, ptwId, user?.uid] });
      toast({ title: "Supervision Record Updated", description: `Record for PTW #${variables.ptwNumber} has been updated.` });
      router.push(`/contractor-safety/ptws/${ptwId}/supervision`);
    },
    onError: (e: Error) => toast({ title: "Error Updating Record", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });


  const handleSave = (formData: PtwSupervisionFormValues) => {
    if (!recordToEdit || !ptw) return;
    const dataToSave: PtwSupervisionRecord = {
      ...recordToEdit,
      ...formData,
      supervisionDate: parseISO(formData.supervisionDate).toISOString(),
    };
    updateSupervisionMutation.mutate(dataToSave);
  };

  const handleCancel = () => {
    router.push(`/contractor-safety/ptws/${ptwId}/supervision`);
  };

  if (isLoadingPtw || isLoadingRecord) {
    return (
      <div className="space-y-6"><Skeleton className="h-10 w-64" /><Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</CardContent></Card></div>
    );
  }

  if (ptwError || recordError || !ptw || !recordToEdit) {
    return (
      <div className="space-y-6"><Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>Supervision record or associated PTW not found.</p></CardContent></Card></div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Supervision List"><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Search className="h-6 w-6 text-blue-500" /> Edit Supervision for PTW: {ptw.ptwNumber}</h1>
        </div>
      <Card className="shadow-lg">
         <CardHeader><CardDescription>Modify the details for this on-site supervision record.</CardDescription></CardHeader>
        <PtwSupervisionForm 
            ptwNumber={ptw.ptwNumber}
            initialData={recordToEdit}
            onSave={handleSave} 
            onCancel={handleCancel}
            isSubmitting={updateSupervisionMutation.isPending}
        />
      </Card>
    </div>
  );
}

    