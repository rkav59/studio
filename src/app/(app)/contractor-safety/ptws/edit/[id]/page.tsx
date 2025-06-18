
"use client";

import { useRouter, useParams } from 'next/navigation';
import { PermitToWorkForm } from "@/components/contractor-safety/permit-to-work-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseISO, format } from 'date-fns';
import type { PermitToWork, Contractor } from '@/lib/types';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';

const PTWS_COLLECTION = 'permitsToWork';
const CONTRACTORS_COLLECTION = 'contractors';

export default function EditPtwPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const ptwId = params.id as string;

  // Fetch Contractors for the dropdown
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

  // Fetch the specific PTW to edit
  const { data: ptwToEdit, isLoading: isLoadingPtw, error: ptwFetchError } = useQuery<PermitToWork | null>({
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
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data.startDate,
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data.endDate,
          authorizationDate: data.authorizationDate instanceof Timestamp ? data.authorizationDate.toDate().toISOString() : data.authorizationDate,
          closureDate: data.closureDate instanceof Timestamp ? data.closureDate.toDate().toISOString() : data.closureDate,
        } as PermitToWork;
      }
      return null;
    },
    enabled: !!user?.uid && !!ptwId,
  });

  const updatePtwMutation = useMutation({
    mutationFn: async (updatedPtwData: Omit<PermitToWork, 'id' | 'userId'>) => {
      if (!user?.uid || !ptwId) throw new Error("Missing user or PTW ID.");
      const ptwRef = doc(db, PTWS_COLLECTION, ptwId);
      const dataForDb = {
        ...updatedPtwData,
        userId: user.uid, // Ensure userId is maintained
        startDate: Timestamp.fromDate(parseISO(updatedPtwData.startDate)),
        endDate: Timestamp.fromDate(parseISO(updatedPtwData.endDate)),
        authorizationDate: updatedPtwData.authorizationDate ? Timestamp.fromDate(parseISO(updatedPtwData.authorizationDate)) : null,
        closureDate: updatedPtwData.closureDate ? Timestamp.fromDate(parseISO(updatedPtwData.closureDate)) : null,
      };
      await updateDoc(ptwRef, dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PTWS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [PTWS_COLLECTION, ptwId, user?.uid] });
      toast({ title: "Permit Updated", description: `PTW "${ptwToEdit?.ptwNumber || ''}" has been successfully updated.` });
      router.push('/contractor-safety');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error Updating PTW", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSavePtw = (data: Omit<PermitToWork, 'id' | 'userId'>) => {
    updatePtwMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/contractor-safety');
  };

  if (isLoadingContractors || isLoadingPtw) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contractorsError || ptwFetchError || !ptwToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Permit to Work Not Found</CardTitle></CardHeader>
          <CardContent><p>{contractorsError?.message || ptwFetchError?.message || "The PTW could not be found or you don't have permission to edit it."}</p></CardContent>
        </Card>
      </div>
    );
  }
  
  // Ensure initialData for the form uses Date objects for date pickers
  const initialDataForForm = {
      ...ptwToEdit,
      startDate: ptwToEdit.startDate ? parseISO(ptwToEdit.startDate) : new Date(),
      endDate: ptwToEdit.endDate ? parseISO(ptwToEdit.endDate) : new Date(),
      authorizationDate: ptwToEdit.authorizationDate ? parseISO(ptwToEdit.authorizationDate) : null,
      closureDate: ptwToEdit.closureDate ? parseISO(ptwToEdit.closureDate) : null,
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Contractor Safety">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <FileText className="h-6 w-6 text-accent" /> Edit Permit to Work: {ptwToEdit.ptwNumber}
            </h1>
        </div>
      <PermitToWorkForm 
        contractors={contractors}
        initialData={ptwToEdit} // Pass the fetched PTW data correctly
        onSave={handleSavePtw} 
        onCancel={handleCancel}
        isSubmitting={updatePtwMutation.isPending}
      />
    </div>
  );
}

    