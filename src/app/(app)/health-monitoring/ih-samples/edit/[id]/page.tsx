
"use client";

import { useRouter, useParams } from 'next/navigation';
import { IhSampleForm, type IhSampleFormValues } from "@/components/health-monitoring/ih-sample-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SimilarExposureGroup, IndustrialHygieneSample } from '@/lib/types';
import { parseISO, format } from 'date-fns';
import { ArrowLeft, FlaskConical } from 'lucide-react';

const IH_SAMPLES_COLLECTION = 'industrialHygieneSamples';
const SEGS_COLLECTION = 'similarExposureGroups';

export default function EditIhSamplePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const sampleId = params.id as string;

  const { data: segs = [], isLoading: isLoadingSegs, error: segsError } = useQuery<SimilarExposureGroup[]>({
    queryKey: [SEGS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, SEGS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SimilarExposureGroup));
    },
    enabled: !!user?.uid,
  });

  const { data: sampleToEdit, isLoading: isLoadingSample, error: sampleError } = useQuery<IndustrialHygieneSample | null>({
    queryKey: [IH_SAMPLES_COLLECTION, sampleId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !sampleId) return null;
      const sampleRef = doc(db, IH_SAMPLES_COLLECTION, sampleId);
      const sampleSnap = await getDoc(sampleRef);
      if (sampleSnap.exists() && sampleSnap.data().userId === user.uid) {
        const data = sampleSnap.data();
        return { 
          id: sampleSnap.id, 
          ...data,
          sampleDate: (data.sampleDate as Timestamp)?.toDate().toISOString(),
        } as IndustrialHygieneSample;
      }
      return null;
    },
    enabled: !!user?.uid && !!sampleId,
  });

  const updateIhSampleMutation = useMutation({
    mutationFn: async (updatedSampleData: IndustrialHygieneSample) => { 
      if (!user?.uid || !updatedSampleData.id) throw new Error("User or sample ID missing.");
      const { id, ...dataToUpdate } = updatedSampleData; 
      const sampleRef = doc(db, IH_SAMPLES_COLLECTION, id);
      const dataForDb = { 
        ...dataToUpdate, 
        userId: user.uid, 
        sampleDate: Timestamp.fromDate(parseISO(dataToUpdate.sampleDate as string)) 
      };
      await updateDoc(sampleRef, dataForDb); 
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [IH_SAMPLES_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [IH_SAMPLES_COLLECTION, variables.id, user?.uid] });
      toast({ title: "IH Sample Updated", description: `Sample for "${variables.agent}" has been updated.` });
      router.push('/health-monitoring');
    },
    onError: (e: Error) => toast({ title: "Error Updating IH Sample", description: e.message, variant: "destructive" }),
  });

  const handleSaveIhSample = (formData: IhSampleFormValues) => {
    if (!sampleToEdit) return;
    const sampleDataToSave: IndustrialHygieneSample = {
      ...sampleToEdit, 
      ...formData,
      sampleDate: parseISO(formData.sampleDate).toISOString(), // Ensure date is ISO string for DB
    };
    updateIhSampleMutation.mutate(sampleDataToSave);
  };

  const handleCancel = () => {
    router.push('/health-monitoring');
  };

  if (isLoadingSegs || isLoadingSample) {
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

  if (segsError || sampleError || !sampleToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>IH Sample Not Found</CardTitle></CardHeader>
          <CardContent><p>{segsError?.message || sampleError?.message || "The IH Sample could not be found or you don't have permission to edit it."}</p></CardContent>
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
                 <FlaskConical className="h-6 w-6 text-accent" /> Edit IH Sample: {sampleToEdit.agent} on {format(parseISO(sampleToEdit.sampleDate), 'PPP')}
            </h1>
        </div>
      <Card className="shadow-lg">
         <CardHeader>
          <CardDescription>
            Modify the details for this Industrial Hygiene Sample.
          </CardDescription>
        </CardHeader>
        <IhSampleForm 
            segs={segs}
            initialData={sampleToEdit} 
            onSave={handleSaveIhSample} 
            onCancel={handleCancel}
            isSubmitting={updateIhSampleMutation.isPending}
        />
      </Card>
    </div>
  );
}
