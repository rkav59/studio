
"use client";

import { useRouter, useParams } from 'next/navigation';
import { PpeJobRoleMatrixForm, type PpeJobRoleMatrixFormValues } from "@/components/ppe-management/ppe-job-role-matrix-form";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PpeItem, PpeJobRoleMatrixEntry } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users } from 'lucide-react';

const PPE_JOB_ROLE_MATRIX_COLLECTION = 'ppeJobRoleMatrix';
const PPE_ITEMS_COLLECTION = 'ppeItems';

export default function EditJobRoleMatrixPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const entryId = params.id as string;

  const { data: ppeItems = [], isLoading: isLoadingPpeItems, error: ppeItemsError } = useQuery<PpeItem[]>({
    queryKey: [PPE_ITEMS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PPE_ITEMS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PpeItem));
    },
    enabled: !!user?.uid,
  });

  const { data: entryToEdit, isLoading: isLoadingEntry, error: entryError } = useQuery<PpeJobRoleMatrixEntry | null>({
    queryKey: [PPE_JOB_ROLE_MATRIX_COLLECTION, entryId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !entryId) return null;
      const entryRef = doc(db, PPE_JOB_ROLE_MATRIX_COLLECTION, entryId);
      const entrySnap = await getDoc(entryRef);
      if (entrySnap.exists() && entrySnap.data().userId === user.uid) {
        return { id: entrySnap.id, ...entrySnap.data() } as PpeJobRoleMatrixEntry;
      }
      return null;
    },
    enabled: !!user?.uid && !!entryId,
  });

  const updateJobRoleEntryMutation = useMutation({
    mutationFn: async (entryToUpdate: PpeJobRoleMatrixEntry) => {
      if (!user?.uid || !entryToUpdate.id) throw new Error("Missing user or entry ID.");
      const { id, ...data } = entryToUpdate;
      await updateDoc(doc(db, PPE_JOB_ROLE_MATRIX_COLLECTION, id), { ...data, userId: user.uid });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PPE_JOB_ROLE_MATRIX_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [PPE_JOB_ROLE_MATRIX_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Job Role Matrix Updated", description: `Requirements for "${variables.jobRole}" updated.` });
      router.push('/ppe-management');
    },
    onError: (e: Error) => toast({ title: "Error Updating Job Role Matrix", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveJobRoleEntry = (data: PpeJobRoleMatrixFormValues) => {
    if (!entryToEdit) return;
    const updatedEntry: PpeJobRoleMatrixEntry = {
      ...entryToEdit,
      ...data,
    };
    updateJobRoleEntryMutation.mutate(updatedEntry);
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };

  if (isLoadingPpeItems || isLoadingEntry) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
    );
  }

  if (entryError || ppeItemsError || !entryToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card><CardHeader><CardTitle>Record Not Found</CardTitle></CardHeader><CardContent><p>The job role entry could not be found or you don't have permission to edit it.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to PPE Management">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Users className="h-6 w-6 text-indigo-600" /> Edit Job Role: {entryToEdit.jobRole}
            </h1>
        </div>
        <PpeJobRoleMatrixForm
            ppeItems={ppeItems}
            initialData={entryToEdit}
            onSave={handleSaveJobRoleEntry}
            onCancel={handleCancel}
            isSubmitting={updateJobRoleEntryMutation.isPending}
        />
    </div>
  );
}
