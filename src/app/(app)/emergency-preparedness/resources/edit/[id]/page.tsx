
"use client";

import { useRouter, useParams } from 'next/navigation';
import { EmergencyResourceForm } from "@/components/emergency-preparedness/emergency-resource-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmergencyResource } from '@/lib/types';
import { ArrowLeft, Box } from 'lucide-react';
import { parseISO } from 'date-fns';

const RESOURCES_COLLECTION = 'emergencyResources';

export default function EditEmergencyResourcePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const resourceId = params.id as string;

  const { data: resourceToEdit, isLoading: isLoadingResource, error: resourceError } = useQuery<EmergencyResource | null>({
    queryKey: [RESOURCES_COLLECTION, resourceId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !resourceId) return null;
      const resourceRef = doc(db, RESOURCES_COLLECTION, resourceId);
      const resourceSnap = await getDoc(resourceRef);
      if (resourceSnap.exists() && resourceSnap.data().userId === user.uid) {
        const data = resourceSnap.data();
        return { 
          id: resourceSnap.id, 
          ...data,
          lastCheckedDate: data.lastCheckedDate instanceof Timestamp ? data.lastCheckedDate.toDate().toISOString() : data.lastCheckedDate,
          nextCheckDate: data.nextCheckDate instanceof Timestamp ? data.nextCheckDate.toDate().toISOString() : data.nextCheckDate,
        } as EmergencyResource;
      }
      return null;
    },
    enabled: !!user?.uid && !!resourceId,
  });

  const updateResourceMutation = useMutation({
    mutationFn: async (updatedResourceData: EmergencyResource) => {
      if (!user?.uid || !updatedResourceData.id) throw new Error("User or resource ID missing.");
      const { id, ...dataToUpdate } = updatedResourceData;
      const resourceRef = doc(db, RESOURCES_COLLECTION, id);
      const dataForDb = {
        ...dataToUpdate,
        userId: user.uid,
        lastCheckedDate: dataToUpdate.lastCheckedDate ? Timestamp.fromDate(parseISO(dataToUpdate.lastCheckedDate)) : null,
        nextCheckDate: dataToUpdate.nextCheckDate ? Timestamp.fromDate(parseISO(dataToUpdate.nextCheckDate)) : null,
      };
      await updateDoc(resourceRef, dataForDb);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RESOURCES_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [RESOURCES_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Resource Updated", description: `Emergency Resource "${variables.name}" has been updated.` });
      router.push('/emergency-preparedness');
    },
    onError: (e: Error) => toast({ title: "Error Updating Resource", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveResource = (formData: Omit<EmergencyResource, 'id' | 'userId'>) => {
    if (!resourceToEdit) return;
    const resourceDataToSave: EmergencyResource = {
      ...resourceToEdit, 
      ...formData,
    };
    updateResourceMutation.mutate(resourceDataToSave);
  };

  const handleCancel = () => {
    router.push('/emergency-preparedness');
  };

  if (isLoadingResource) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="p-0">
             <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resourceError || !resourceToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Emergency Resource Not Found</CardTitle></CardHeader>
          <CardContent><p>The resource could not be found or you don't have permission to edit it.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Emergency Preparedness">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Box className="h-6 w-6 text-accent" /> Edit Emergency Resource: {resourceToEdit.name}
            </h1>
        </div>
        <EmergencyResourceForm 
            initialData={resourceToEdit} 
            onSave={handleSaveResource} 
            onCancel={handleCancel}
            isSubmitting={updateResourceMutation.isPending}
        />
    </div>
  );
}
