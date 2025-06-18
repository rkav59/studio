
"use client";

import { useRouter } from 'next/navigation';
import { SegForm, type SegFormValues } from "@/components/health-monitoring/seg-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SimilarExposureGroup } from '@/lib/types';
import { ArrowLeft, Users } from 'lucide-react';

const SEGS_COLLECTION = 'similarExposureGroups';

export default function NewSegPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addSegMutation = useMutation({
    mutationFn: async (newSegData: SegFormValues) => { 
      if (!user?.uid) throw new Error("User not authenticated.");
      return addDoc(collection(db, SEGS_COLLECTION), { ...newSegData, userId: user.uid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SEGS_COLLECTION, user?.uid] });
      toast({ title: "SEG Created", description: "The new Similar Exposure Group has been added." });
      router.push('/health-monitoring');
    },
    onError: (e: Error) => toast({ title: "Error Creating SEG", description: e.message, variant: "destructive" }),
  });

  const handleSaveSeg = (data: SegFormValues) => {
    addSegMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/health-monitoring');
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Health Monitoring">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Users className="h-6 w-6 text-primary" /> Add New Similar Exposure Group (SEG)
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Define a new SEG for grouping employees with similar health exposures.
          </CardDescription>
        </CardHeader>
        <SegForm 
          onSave={handleSaveSeg} 
          onCancel={handleCancel} 
          isSubmitting={addSegMutation.isPending}
        />
      </Card>
    </div>
  );
}
