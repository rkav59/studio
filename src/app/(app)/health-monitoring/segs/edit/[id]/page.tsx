
"use client";

import { useRouter, useParams } from 'next/navigation';
import { SegForm, type SegFormValues } from "@/components/health-monitoring/seg-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SimilarExposureGroup } from '@/lib/types';
import { ArrowLeft, Users } from 'lucide-react';

const SEGS_COLLECTION = 'similarExposureGroups';

export default function EditSegPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const segId = params.id as string;

  const { data: segToEdit, isLoading: isLoadingSeg, error: segError } = useQuery<SimilarExposureGroup | null>({
    queryKey: [SEGS_COLLECTION, segId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !segId) return null;
      const segRef = doc(db, SEGS_COLLECTION, segId);
      const segSnap = await getDoc(segRef);
      if (segSnap.exists() && segSnap.data().userId === user.uid) {
        return { id: segSnap.id, ...segSnap.data() } as SimilarExposureGroup;
      }
      return null;
    },
    enabled: !!user?.uid && !!segId,
  });

  const updateSegMutation = useMutation({
    mutationFn: async (updatedSegData: SimilarExposureGroup) => { 
      if (!user?.uid || !updatedSegData.id) throw new Error("User or SEG ID missing.");
      const { id, ...dataToUpdate } = updatedSegData; 
      const segRef = doc(db, SEGS_COLLECTION, id);
      await updateDoc(segRef, { ...dataToUpdate, userId: user.uid }); 
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SEGS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [SEGS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "SEG Updated", description: `SEG "${variables.name}" has been updated.` });
      router.push('/health-monitoring');
    },
    onError: (e: Error) => toast({ title: "Error Updating SEG", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveSeg = (formData: SegFormValues) => {
    if (!segToEdit) return;
    const segDataToSave: SimilarExposureGroup = {
      ...segToEdit, 
      ...formData,     
    };
    updateSegMutation.mutate(segDataToSave);
  };

  const handleCancel = () => {
    router.push('/health-monitoring');
  };

  if (isLoadingSeg) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent>
        </Card>
      </div>
    );
  }

  if (segError || !segToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>SEG Not Found</CardTitle></CardHeader>
          <CardContent><p>The SEG could not be found or you don't have permission to edit it.</p></CardContent>
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
                 <Users className="h-6 w-6 text-primary" /> Edit SEG: {segToEdit.name}
            </h1>
        </div>
      <Card className="shadow-lg">
         <CardHeader>
          <CardDescription>
            Modify the details for this Similar Exposure Group.
          </CardDescription>
        </CardHeader>
        <SegForm 
            initialData={segToEdit} 
            onSave={handleSaveSeg} 
            onCancel={handleCancel}
            isSubmitting={updateSegMutation.isPending}
        />
      </Card>
    </div>
  );
}
