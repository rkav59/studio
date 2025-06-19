
"use client";

import { useRouter, useParams } from 'next/navigation';
import { RiskRegisterEntryForm, type RiskRegisterEntryFormValues } from "@/components/risk-management/risk-register-entry-form";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore'; // Added collection, query, getDocs
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RiskRegisterEntry, SheqAudit } from '@/lib/types'; // Added SheqAudit
import { ArrowLeft, BookOpen } from 'lucide-react';
import { parseISO, format } from 'date-fns';

const RISK_REGISTER_ENTRIES_COLLECTION = 'riskRegisterEntries';
const SHEQ_AUDITS_COLLECTION = 'sheqAudits'; // For fetching SHEQ Audits

export default function EditRiskRegisterEntryPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const entryId = params.id as string;

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

  const { data: entryToEdit, isLoading: isLoadingEntry, error: entryError } = useQuery<RiskRegisterEntry | null>({
    queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, entryId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !entryId) return null;
      const entryRef = doc(db, RISK_REGISTER_ENTRIES_COLLECTION, entryId);
      const entrySnap = await getDoc(entryRef);
      if (entrySnap.exists() && entrySnap.data().userId === user.uid) {
        const data = entrySnap.data();
        return { 
          id: entrySnap.id, 
          ...data,
          dateIdentified: (data.dateIdentified as Timestamp)?.toDate().toISOString(),
          treatmentDueDate: data.treatmentDueDate ? (data.treatmentDueDate as Timestamp).toDate().toISOString() : undefined,
          lastReviewedDate: data.lastReviewedDate ? (data.lastReviewedDate as Timestamp).toDate().toISOString() : undefined,
          nextReviewDate: data.nextReviewDate ? (data.nextReviewDate as Timestamp).toDate().toISOString() : undefined,
        } as RiskRegisterEntry;
      }
      return null;
    },
    enabled: !!user?.uid && !!entryId,
  });

  const updateEntryMutation = useMutation({
    mutationFn: async (updatedEntryData: RiskRegisterEntry) => { 
      if (!user?.uid || !updatedEntryData.id) throw new Error("User or entry ID missing.");
      const { id, ...dataToUpdate } = updatedEntryData; 
      const entryRef = doc(db, RISK_REGISTER_ENTRIES_COLLECTION, id);
      const dataForDb = { 
        ...dataToUpdate, 
        userId: user.uid, 
        dateIdentified: Timestamp.fromDate(parseISO(dataToUpdate.dateIdentified as string)),
        treatmentDueDate: dataToUpdate.treatmentDueDate ? Timestamp.fromDate(parseISO(dataToUpdate.treatmentDueDate as string)) : null,
        lastReviewedDate: dataToUpdate.lastReviewedDate ? Timestamp.fromDate(parseISO(dataToUpdate.lastReviewedDate as string)) : null,
        nextReviewDate: dataToUpdate.nextReviewDate ? Timestamp.fromDate(parseISO(dataToUpdate.nextReviewDate as string)) : null,
        linkedSheqAuditId: dataToUpdate.linkedSheqAuditId || null, // Store null if undefined
        linkedSheqAuditName: dataToUpdate.linkedSheqAuditName || null, // Store null if undefined
      };
      await updateDoc(entryRef, dataForDb); 
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Risk Entry Updated", description: `Risk "${variables.riskTitle}" has been updated.` });
      router.push('/risk-management');
    },
    onError: (e: Error) => toast({ title: "Error Updating Risk Entry", description: e.message, variant: "destructive" }),
  });

  const handleSaveEntry = (formData: RiskRegisterEntryFormValues) => {
    if (!entryToEdit) return;
    const entryDataToSave: RiskRegisterEntry = {
      ...entryToEdit, 
      ...formData,
      dateIdentified: parseISO(formData.dateIdentified).toISOString(),
      treatmentDueDate: formData.treatmentDueDate ? parseISO(formData.treatmentDueDate).toISOString() : undefined,
      lastReviewedDate: formData.lastReviewedDate ? parseISO(formData.lastReviewedDate).toISOString() : undefined,
      nextReviewDate: formData.nextReviewDate ? parseISO(formData.nextReviewDate).toISOString() : undefined,
      linkedSheqAuditId: formData.linkedSheqAuditId || undefined,
      linkedSheqAuditName: formData.linkedSheqAuditName || undefined,
    };
    updateEntryMutation.mutate(entryDataToSave);
  };

  const handleCancel = () => {
    router.push('/risk-management');
  };

  if (isLoadingEntry || isLoadingSheqAudits) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-6 space-y-4">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent>
        </Card>
      </div>
    );
  }

  if (entryError || !entryToEdit || sheqAuditsError) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Error Loading Data</CardTitle></CardHeader>
          <CardContent><p>{entryError?.message || sheqAuditsError?.message || "The risk entry or SHEQ audit data could not be found or you don't have permission to edit it."}</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Risk Management">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <BookOpen className="h-6 w-6 text-green-600" /> Edit Risk: {entryToEdit.riskTitle}
            </h1>
        </div>
      <Card className="shadow-lg">
         <CardHeader>
          <CardDescription>
            Modify the details for this risk register entry.
          </CardDescription>
        </CardHeader>
        <RiskRegisterEntryForm 
            initialData={entryToEdit}
            sheqAudits={sheqAudits} 
            onSave={handleSaveEntry} 
            onCancel={handleCancel}
            isSubmitting={updateEntryMutation.isPending}
        />
      </Card>
    </div>
  );
}
