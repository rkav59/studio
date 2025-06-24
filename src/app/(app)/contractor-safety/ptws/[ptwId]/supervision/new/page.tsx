
"use client";

import { useRouter, useParams } from 'next/navigation';
import { PtwSupervisionForm, type PtwSupervisionFormValues } from "@/components/contractor-safety/ptw-supervision-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PtwSupervisionRecord, PermitToWork } from '@/lib/types';
import { parseISO, format } from 'date-fns';
import { ArrowLeft, Search } from 'lucide-react';

const PTW_SUPERVISION_RECORDS_COLLECTION = 'ptwSupervisionRecords';
const PTWS_COLLECTION = 'permitsToWork';

export default function NewPtwSupervisionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ptwId = params.ptwId as string;

  const { data: ptw, isLoading: isLoadingPtw, error: ptwError } = useQuery<PermitToWork | null>({
    queryKey: [PTWS_COLLECTION, ptwId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !ptwId) return null;
      const ptwRef = doc(db, PTWS_COLLECTION, ptwId);
      const ptwSnap = await getDoc(ptwRef);
      return ptwSnap.exists() && ptwSnap.data().userId === user.uid ? { id: ptwSnap.id, ...ptwSnap.data() } as PermitToWork : null;
    },
    enabled: !!user?.uid && !!ptwId,
  });

  const addSupervisionMutation = useMutation({
    mutationFn: async (newData: PtwSupervisionFormValues) => {
      if (!user?.uid || !ptw) throw new Error("User or PTW data missing.");
      const dataForDb: Omit<PtwSupervisionRecord, 'id'> = {
        userId: user.uid,
        ptwId: ptw.id,
        ptwNumber: ptw.ptwNumber,
        ...newData,
        supervisionDate: Timestamp.fromDate(parseISO(newData.supervisionDate as string)),
      };
      return addDoc(collection(db, PTW_SUPERVISION_RECORDS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PTW_SUPERVISION_RECORDS_COLLECTION, ptwId, user?.uid] });
      toast({ title: "Supervision Record Added", description: "The new supervision record has been successfully logged." });
      router.push(`/contractor-safety/ptws/${ptwId}/supervision`);
    },
    onError: (e: Error) => toast({ title: "Error Adding Record", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSave = (data: PtwSupervisionFormValues) => {
    addSupervisionMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push(`/contractor-safety/ptws/${ptwId}/supervision`);
  };

  if (isLoadingPtw) {
    return (
      <div className="space-y-6"><Skeleton className="h-10 w-64" /><Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</CardContent></Card></div>
    );
  }

  if (ptwError || !ptw) {
    return (
      <div className="space-y-6"><Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>Could not load the associated Permit to Work.</p></CardContent></Card></div>
    );
  }


  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Supervision List"><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Search className="h-6 w-6 text-blue-500" /> New Supervision for PTW: {ptw.ptwNumber}</h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader><CardDescription>Fill in the details for the on-site supervision record.</CardDescription></CardHeader>
        <PtwSupervisionForm 
          ptwNumber={ptw.ptwNumber}
          onSave={handleSave} 
          onCancel={handleCancel}
          isSubmitting={addSupervisionMutation.isPending}
        />
      </Card>
    </div>
  );
}
