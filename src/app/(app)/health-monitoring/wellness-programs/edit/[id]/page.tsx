
"use client";

import { useRouter, useParams } from 'next/navigation';
import { WellnessProgramForm, type WellnessProgramFormValues } from "@/components/health-monitoring/wellness-program-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WellnessProgram } from '@/lib/types';
import { parseISO, format } from 'date-fns';
import { ArrowLeft, Award } from 'lucide-react';

const WELLNESS_PROGRAMS_COLLECTION = 'wellnessPrograms';

export default function EditWellnessProgramPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const programId = params.id as string;

  const { data: programToEdit, isLoading: isLoadingProgram, error: programError } = useQuery<WellnessProgram | null>({
    queryKey: [WELLNESS_PROGRAMS_COLLECTION, programId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !programId) return null;
      const programRef = doc(db, WELLNESS_PROGRAMS_COLLECTION, programId);
      const programSnap = await getDoc(programRef);
      if (programSnap.exists() && programSnap.data().userId === user.uid) {
        const data = programSnap.data();
        return { 
          id: programSnap.id, 
          ...data,
          startDate: (data.startDate as Timestamp)?.toDate().toISOString(),
          endDate: data.endDate ? (data.endDate as Timestamp).toDate().toISOString() : undefined,
        } as WellnessProgram;
      }
      return null;
    },
    enabled: !!user?.uid && !!programId,
  });

  const updateWellnessProgramMutation = useMutation({
    mutationFn: async (updatedProgramData: WellnessProgram) => { 
      if (!user?.uid || !updatedProgramData.id) throw new Error("User or program ID missing.");
      const { id, ...dataToUpdate } = updatedProgramData; 
      const programRef = doc(db, WELLNESS_PROGRAMS_COLLECTION, id);
      const dataForDb = { 
        ...dataToUpdate, 
        userId: user.uid, 
        startDate: Timestamp.fromDate(parseISO(dataToUpdate.startDate as string)),
        endDate: dataToUpdate.endDate ? Timestamp.fromDate(parseISO(dataToUpdate.endDate as string)) : null,
      };
      await updateDoc(programRef, dataForDb); 
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [WELLNESS_PROGRAMS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [WELLNESS_PROGRAMS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Wellness Program Updated", description: `Program "${variables.programName}" has been updated.` });
      router.push('/health-monitoring');
    },
    onError: (e: Error) => toast({ title: "Error Updating Wellness Program", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveWellnessProgram = (formData: WellnessProgramFormValues) => {
    if (!programToEdit) return;
    const programDataToSave: WellnessProgram = {
      ...programToEdit, 
      ...formData,
      startDate: parseISO(formData.startDate).toISOString(), 
      endDate: formData.endDate ? parseISO(formData.endDate).toISOString() : undefined,
    };
    updateWellnessProgramMutation.mutate(programDataToSave);
  };

  const handleCancel = () => {
    router.push('/health-monitoring');
  };

  if (isLoadingProgram) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
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
          <CardHeader><CardTitle>Wellness Program Not Found</CardTitle></CardHeader>
          <CardContent><p>The Wellness Program could not be found or you don't have permission to edit it.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Health Monitoring">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Award className="h-6 w-6 text-purple-500" /> Edit Wellness Program: {programToEdit.programName}
            </h1>
        </div>
      <Card className="shadow-lg">
         <CardHeader>
          <CardDescription>
            Modify the details for this Wellness Program.
          </CardDescription>
        </CardHeader>
        <WellnessProgramForm 
            initialData={programToEdit} 
            onSave={handleSaveWellnessProgram} 
            onCancel={handleCancel}
            isSubmitting={updateWellnessProgramMutation.isPending}
        />
      </Card>
    </div>
  );
}
