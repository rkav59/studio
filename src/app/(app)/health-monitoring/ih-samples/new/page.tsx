
"use client";

import { useRouter } from 'next/navigation';
import { IhSampleForm, type IhSampleFormValues } from "@/components/health-monitoring/ih-sample-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SimilarExposureGroup, IndustrialHygieneSample } from '@/lib/types';
import { parseISO } from 'date-fns';
import { ArrowLeft, FlaskConical } from 'lucide-react';

const IH_SAMPLES_COLLECTION = 'industrialHygieneSamples';
const SEGS_COLLECTION = 'similarExposureGroups';

export default function NewIhSamplePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const addIhSampleMutation = useMutation({
    mutationFn: async (newIhSampleData: IhSampleFormValues) => { 
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = { 
        ...newIhSampleData, 
        userId: user.uid, 
        sampleDate: Timestamp.fromDate(parseISO(newIhSampleData.sampleDate as string)) 
      };
      return addDoc(collection(db, IH_SAMPLES_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [IH_SAMPLES_COLLECTION, user?.uid] });
      toast({ title: "IH Sample Logged", description: "The new Industrial Hygiene Sample has been added." });
      router.push('/health-monitoring');
    },
    onError: (e: Error) => toast({ title: "Error Logging IH Sample", description: e.message, variant: "destructive" }),
  });

  const handleSaveIhSample = (data: IhSampleFormValues) => {
    addIhSampleMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/health-monitoring');
  };
  
  if (isLoadingSegs) {
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

  if (segsError) {
     return <div className="text-red-500 text-center py-10">Error loading SEGs: {segsError.message}</div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Health Monitoring">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <FlaskConical className="h-6 w-6 text-accent" /> Log New Industrial Hygiene Sample
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Enter details for a new industrial hygiene sample.
          </CardDescription>
        </CardHeader>
        <IhSampleForm 
          segs={segs}
          onSave={handleSaveIhSample} 
          onCancel={handleCancel}
          isSubmitting={addIhSampleMutation.isPending}
        />
      </Card>
    </div>
  );
}
