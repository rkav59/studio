
"use client";

import { useRouter, useParams } from 'next/navigation';
import { SheProgramForm } from "@/components/she-meetings/she-program-form";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SheProgram } from '@/lib/types';
import { ArrowLeft, Activity } from 'lucide-react';
import { parseISO } from 'date-fns';

const PROGRAMS_COLLECTION = 'shePrograms';

export default function EditSheProgramPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const programId = params.id as string;

  const { data: programToEdit, isLoading: isLoadingProgram, error: programError } = useQuery<SheProgram | null>({
    queryKey: [PROGRAMS_COLLECTION, programId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !programId) return null;
      const programRef = doc(db, PROGRAMS_COLLECTION, programId);
      const programSnap = await getDoc(programRef);
      if (programSnap.exists() && programSnap.data().userId === user.uid) {
        const data = programSnap.data();
        return {
          id: programSnap.id,
          ...data,
          startDate: (data.startDate as Timestamp)?.toDate().toISOString(),
          endDate: data.endDate ? (data.endDate as Timestamp).toDate().toISOString() : undefined,
        } as SheProgram;
      }
      return null;
    },
    enabled: !!user?.uid && !!programId,
  });

  const updateProgramMutation = useMutation({
    mutationFn: async (updatedProgramData: SheProgram) => {
      if (!user?.uid || !updatedProgramData.id) throw new Error("Missing user or program ID.");
      const { id, ...dataToUpdate } = updatedProgramData;
      const programRef = doc(db, PROGRAMS_COLLECTION, id);
      const dataForDb = {
        ...dataToUpdate,
        userId: user.uid,
        startDate: Timestamp.fromDate(parseISO(dataToUpdate.startDate as string)),
        endDate: dataToUpdate.endDate ? Timestamp.fromDate(parseISO(dataToUpdate.endDate as string)) : null,
      };
      await updateDoc(programRef, dataForDb);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROGRAMS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [PROGRAMS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Program Updated", description: `SHE Program "${variables.programName}" has been updated.` });
      router.push('/she-meetings');
    },
    onError: (e: Error) => toast({ title: "Error Updating Program", description: e.message, variant: "destructive" }),
  });

  const handleSaveProgram = (formData: Omit<SheProgram, 'id' | 'userId'>) => {
    if (!programToEdit) return;
    const programDataToSave: SheProgram = {
      ...programToEdit,
      ...formData,
    };
    updateProgramMutation.mutate(programDataToSave);
  };

  const handleCancel = () => {
    router.push('/she-meetings');
  };

  if (isLoadingProgram) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-6 space-y-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent>
        </Card>
      </div>
    );
  }

  if (programError || !programToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>SHE Program Not Found</CardTitle></CardHeader>
          <CardContent><p>{programError ? programError.message : "The program could not be found or you don't have permission to edit it."}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to SHE Meetings & Programs">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Activity className="h-6 w-6 text-primary" /> Edit SHE Program: {programToEdit.programName}
            </h1>
        </div>
        <Card className="shadow-lg">
            <CardHeader>
                <CardDescription>
                    Modify the details for this SHE Program.
                </CardDescription>
            </CardHeader>
            <SheProgramForm
                initialData={programToEdit}
                onSave={handleSaveProgram}
                onCancel={handleCancel}
                isSubmitting={updateProgramMutation.isPending}
            />
        </Card>
    </div>
  );
}
