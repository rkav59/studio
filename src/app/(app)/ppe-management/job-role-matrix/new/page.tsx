
"use client";

import { useRouter } from 'next/navigation';
import { PpeJobRoleMatrixForm, type PpeJobRoleMatrixFormValues } from "@/components/ppe-management/ppe-job-role-matrix-form";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PpeItem, PpeJobRoleMatrixEntry, ManualRiskAssessment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PPE_JOB_ROLE_MATRIX_COLLECTION = 'ppeJobRoleMatrix';
const PPE_ITEMS_COLLECTION = 'ppeItems';
const MANUAL_RISK_ASSESSMENTS_COLLECTION = 'manualRiskAssessments';

export default function NewJobRoleMatrixPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: riskAssessments = [], isLoading: isLoadingRiskAssessments, error: riskAssessmentsError } = useQuery<ManualRiskAssessment[]>({
    queryKey: [MANUAL_RISK_ASSESSMENTS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, MANUAL_RISK_ASSESSMENTS_COLLECTION), where("userId", "==", user.uid), orderBy("assessmentDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        assessmentDate: (doc.data().assessmentDate as Timestamp)?.toDate().toISOString()
      } as ManualRiskAssessment));
    },
    enabled: !!user?.uid,
  });

  const addJobRoleEntryMutation = useMutation({
    mutationFn: (newEntryData: Omit<PpeJobRoleMatrixEntry, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      return addDoc(collection(db, PPE_JOB_ROLE_MATRIX_COLLECTION), { ...newEntryData, userId: user.uid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PPE_JOB_ROLE_MATRIX_COLLECTION, user?.uid] });
      toast({ title: "Job Role PPE Defined", description: "The new job role requirements have been saved." });
      router.push('/ppe-management');
    },
    onError: (e: Error) => toast({ title: "Error Defining Job Role PPE", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveJobRoleEntry = (data: PpeJobRoleMatrixFormValues) => {
    addJobRoleEntryMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };

  const isLoading = isLoadingPpeItems || isLoadingRiskAssessments;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (ppeItemsError || riskAssessmentsError) {
    return <div className="text-red-500 text-center py-10">Error loading data. Please try again later.</div>;
  }
  
  if (ppeItems.length === 0 && !isLoadingPpeItems) {
      return (
          <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to PPE Management"><ArrowLeft className="h-4 w-4" /></Button>
                  <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Users className="h-6 w-6 text-indigo-600" /> Define New Job Role PPE</h1>
              </div>
              <Card>
                  <CardHeader><CardTitle>Cannot Define Job Role</CardTitle><CardDescription>There are no PPE items in the inventory. Please add PPE items before defining job role requirements.</CardDescription></CardHeader>
                  <CardContent><Button onClick={() => router.push('/ppe-management/items/new')}>Add PPE Item</Button></CardContent>
              </Card>
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
                 <Users className="h-6 w-6 text-indigo-600" /> Define New Job Role PPE
            </h1>
        </div>
        <PpeJobRoleMatrixForm
            ppeItems={ppeItems}
            riskAssessments={riskAssessments}
            onSave={handleSaveJobRoleEntry}
            onCancel={handleCancel}
            isSubmitting={addJobRoleEntryMutation.isPending}
        />
    </div>
  );
}
