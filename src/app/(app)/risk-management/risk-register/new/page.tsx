"use client";

import { useRouter } from 'next/navigation';
import { RiskRegisterEntryForm, type RiskRegisterEntryFormValues } from "@/components/risk-management/risk-register-entry-form";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RiskRegisterEntry, SheqAudit } from '@/lib/types';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const RISK_REGISTER_ENTRIES_COLLECTION = 'riskRegisterEntries';
const SHEQ_AUDITS_COLLECTION = 'sheqAudits';


export default function NewRiskRegisterEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sheqAudits = [], isLoading: isLoadingSheqAudits, error: sheqAuditsError } = useQuery<SheqAudit[]>({
    queryKey: [SHEQ_AUDITS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, SHEQ_AUDITS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ 
        id: docSnap.id, 
        ...docSnap.data(),
        auditDate: (docSnap.data().auditDate as Timestamp)?.toDate().toISOString(),
      } as SheqAudit));
    },
    enabled: !!user?.uid,
  });

  const addEntryMutation = useMutation({
    mutationFn: async (newEntryData: RiskRegisterEntryFormValues) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb: Omit<RiskRegisterEntry, 'id'> = {
        userId: user.uid,
        ...newEntryData,
        dateIdentified: newEntryData.dateIdentified ? Timestamp.fromDate(parseISO(newEntryData.dateIdentified as string)) : Timestamp.now(),
        treatmentDueDate: newEntryData.treatmentDueDate ? Timestamp.fromDate(parseISO(newEntryData.treatmentDueDate as string)) : undefined,
        lastReviewedDate: newEntryData.lastReviewedDate ? Timestamp.fromDate(parseISO(newEntryData.lastReviewedDate as string)) : undefined,
        nextReviewDate: newEntryData.nextReviewDate ? Timestamp.fromDate(parseISO(newEntryData.nextReviewDate as string)) : undefined,
      };
      return addDoc(collection(db, RISK_REGISTER_ENTRIES_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, user?.uid] });
      toast({ title: "Risk Entry Created", description: "The new risk has been added to the register." });
      router.push('/risk-management');
    },
    onError: (e: Error) => toast({ title: "Error Creating Risk Entry", description: e.message, variant: "destructive" }),
  });

  const handleSaveEntry = (data: RiskRegisterEntryFormValues) => {
    addEntryMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/risk-management');
  };

  if (isLoadingSheqAudits) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /></CardContent></Card>
        </div>
    );
  }

  if (sheqAuditsError) {
     return <div className="text-red-500 text-center py-10">Error loading supporting data. Please try again later.</div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Risk Management">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <BookOpen className="h-6 w-6 text-green-600" /> Add New Risk to Register
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Define a new risk entry for the organization's risk register.
          </CardDescription>
        </CardHeader>
        <RiskRegisterEntryForm 
            sheqAudits={sheqAudits}
            onSave={handleSaveEntry} 
            onCancel={handleCancel}
            isSubmitting={addEntryMutation.isPending}
        />
      </Card>
    </div>
  );
}
