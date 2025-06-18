
"use client";

import { useRouter } from 'next/navigation';
import { RiskRegisterEntryForm, type RiskRegisterEntryFormValues } from "@/components/risk-management/risk-register-entry-form";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RiskRegisterEntry } from '@/lib/types';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { parseISO } from 'date-fns';

const RISK_REGISTER_ENTRIES_COLLECTION = 'riskRegisterEntries';

export default function NewRiskRegisterEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addEntryMutation = useMutation({
    mutationFn: async (newEntryData: RiskRegisterEntryFormValues) => { 
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newEntryData,
        userId: user.uid,
        dateIdentified: Timestamp.fromDate(parseISO(newEntryData.dateIdentified as string)),
        treatmentDueDate: newEntryData.treatmentDueDate ? Timestamp.fromDate(parseISO(newEntryData.treatmentDueDate as string)) : null,
        lastReviewedDate: newEntryData.lastReviewedDate ? Timestamp.fromDate(parseISO(newEntryData.lastReviewedDate as string)) : null,
        nextReviewDate: newEntryData.nextReviewDate ? Timestamp.fromDate(parseISO(newEntryData.nextReviewDate as string)) : null,
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
          onSave={handleSaveEntry} 
          onCancel={handleCancel}
          isSubmitting={addEntryMutation.isPending}
        />
      </Card>
    </div>
  );
}

```