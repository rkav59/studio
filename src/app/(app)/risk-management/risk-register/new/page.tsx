
"use client";

import { useRouter } from 'next/navigation';
import { RiskRegisterEntryForm, type RiskRegisterEntryFormValues } from "@/components/risk-management/risk-register-entry-form";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore'; // Added getDocs
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'; // Added useQuery
import type { RiskRegisterEntry, SheqAudit } from '@/lib/types'; // Added SheqAudit
import { ArrowLeft, BookOpen } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const RISK_REGISTER_ENTRIES_COLLECTION = 'riskRegisterEntries';
const SHEQ_AUDITS_COLLECTION = 'sheqAudits'; // For fetching SHEQ Audits

export default function NewRiskRegisterEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch SHEQ Audits for the dropdown
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
      const dataForDb: Omit<RiskRegisterEntry, 'id' | 'userId'> & { userId: string } = {
        ...newEntryData,
        userId: user.uid,
        dateIdentified: Timestamp.fromDate(parseISO(newEntryData.dateIdentified as string)),
        treatmentDueDate: newEntryData.treatmentDueDate ? Timestamp.fromDate(parseISO(newEntryData.treatmentDueDate as string)) : null,
        lastReviewedDate: newEntryData.lastReviewedDate ? Timestamp.fromDate(parseISO(newEntryData.lastReviewedDate as string)) : null,
        nextReviewDate: newEntryData.nextReviewDate ? Timestamp.fromDate(parseISO(newEntryData.nextReviewDate as string)) : null,
        linkedSheqAuditId: newEntryData.linkedSheqAuditId || undefined, // Ensure it's undefined if empty
        linkedSheqAuditName: newEntryData.linkedSheqAuditName || undefined,
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
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sheqAuditsError) {
     return <div className="text-red-500 text-center py-10">Error loading SHEQ Audits: {sheqAuditsError.message}</div>;
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
            Fill in the details for the new risk entry. Use the risk matrix guidance for likelihood and severity.
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
