
"use client";

import { useRouter } from 'next/navigation';
import { PpeIssuanceForm, type PpeIssuanceFormValues } from "@/components/ppe-management/ppe-issuance-form";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import type { PpeItem, PpeIssuanceRecord, PpeJobRoleMatrixEntry } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PPE_ISSUANCES_COLLECTION = 'ppeIssuances';
const PPE_ITEMS_COLLECTION = 'ppeItems';
const PPE_JOB_ROLE_MATRIX_COLLECTION = 'ppeJobRoleMatrix';


export default function NewPpeIssuancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch PPE Items for dropdown
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

  // Fetch PPE Job Role Matrix for dropdown
  const { data: ppeJobRoleMatrix = [], isLoading: isLoadingJobRoleMatrix, error: jobRoleMatrixError } = useQuery<PpeJobRoleMatrixEntry[]>({
    queryKey: [PPE_JOB_ROLE_MATRIX_COLLECTION, user?.uid],
    queryFn: async () => {
        if (!user?.uid) return [];
        const q = query(collection(db, PPE_JOB_ROLE_MATRIX_COLLECTION), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PpeJobRoleMatrixEntry));
    },
    enabled: !!user?.uid,
  });

  const addIssuanceMutation = useMutation({
    mutationFn: async (newIssuanceData: Omit<PpeIssuanceRecord, 'id'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      return addDoc(collection(db, PPE_ISSUANCES_COLLECTION), newIssuanceData);
    },
    onSuccess: (docRef, variables) => {
      queryClient.invalidateQueries({ queryKey: [PPE_ISSUANCES_COLLECTION, user?.uid] });
      toast({ 
        title: "PPE Issuance Logged", 
        description: `The new issuance has been successfully logged.` 
      });
      router.push('/ppe-management');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error Logging Issuance", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const handleSaveNewIssuance = (formData: PpeIssuanceFormValues) => {
    if (!user?.uid) return;

    const dataForDb: Omit<PpeIssuanceRecord, 'id'> = {
      userId: user.uid,
      ...formData,
      issuedDate: formData.issuedDate.toISOString(),
    };
    addIssuanceMutation.mutate(dataForDb);
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };
  
  const isLoading = isLoadingPpeItems || isLoadingJobRoleMatrix;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
          <CardHeader><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-6 p-4 md:p-6">{[...Array(5)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>))}</CardContent>
        </Card>
      </div>
    );
  }

  if (ppeItemsError || jobRoleMatrixError) {
    return <div className="text-red-500 text-center py-10">Error loading data. Please try again later.</div>;
  }
  
  if (ppeItems.length === 0 && !isLoadingPpeItems) {
    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to PPE Management"><ArrowLeft className="h-4 w-4" /></Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Cannot Log Issuance</CardTitle>
                    <CardDescription>There are no PPE items in the inventory. Please add items before logging an issuance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/ppe-management/items/new')}>Add PPE Item</Button>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="h-full flex flex-col">
      <PpeIssuanceForm
        ppeItems={ppeItems}
        ppeJobRoleMatrix={ppeJobRoleMatrix}
        onSave={handleSaveNewIssuance}
        onCancel={handleCancel}
        isSubmitting={addIssuanceMutation.isPending}
      />
    </div>
  );
}
