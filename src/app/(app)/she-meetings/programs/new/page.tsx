
"use client";

import { useRouter } from 'next/navigation';
import { SheProgramForm } from "@/components/she-meetings/she-program-form";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SheProgram } from '@/lib/types';
import { ArrowLeft, Activity } from 'lucide-react';
import { parseISO } from 'date-fns';

const PROGRAMS_COLLECTION = 'shePrograms';

export default function NewSheProgramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addProgramMutation = useMutation({
    mutationFn: async (newProgramData: Omit<SheProgram, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newProgramData,
        userId: user.uid,
        startDate: Timestamp.fromDate(parseISO(newProgramData.startDate as string)),
        endDate: newProgramData.endDate ? Timestamp.fromDate(parseISO(newProgramData.endDate as string)) : null,
      };
      return addDoc(collection(db, PROGRAMS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROGRAMS_COLLECTION, user?.uid] });
      toast({ title: "SHE Program Created", description: "The new SHE program has been successfully added." });
      router.push('/she-meetings');
    },
    onError: (e: Error) => toast({ title: "Error Creating Program", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveProgram = (data: Omit<SheProgram, 'id' | 'userId'>) => {
    addProgramMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/she-meetings');
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to SHE Meetings & Programs">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Activity className="h-6 w-6 text-primary" /> Create New SHE Program
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Define the details for the new SHE program below.
          </CardDescription>
        </CardHeader>
        <SheProgramForm
          onSave={handleSaveProgram}
          onCancel={handleCancel}
          isSubmitting={addProgramMutation.isPending}
        />
      </Card>
    </div>
  );
}
