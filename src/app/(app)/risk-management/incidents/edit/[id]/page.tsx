
"use client";

import { useRouter, useParams } from 'next/navigation';
import { IncidentForm, type IncidentFormValues } from "@/components/risk-management/incident-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Incident } from '@/lib/types';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { parseISO, format } from 'date-fns';

const INCIDENTS_COLLECTION = 'incidents';

export default function EditIncidentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const incidentId = params.id as string;

  const { data: incidentToEdit, isLoading: isLoadingIncident, error: incidentError } = useQuery<Incident | null>({
    queryKey: [INCIDENTS_COLLECTION, incidentId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !incidentId) return null;
      const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentId);
      const incidentSnap = await getDoc(incidentRef);
      if (incidentSnap.exists() && incidentSnap.data().userId === user.uid) {
        const data = incidentSnap.data();
        // Ensure timestamp is converted to Date object for the form if it's a string or Timestamp
        const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp;
        return { 
          id: incidentSnap.id, 
          ...data,
          timestamp, // Already ISO string or becomes ISO string
        } as Incident;
      }
      return null;
    },
    enabled: !!user?.uid && !!incidentId,
  });

  const updateIncidentMutation = useMutation({
    mutationFn: async (updatedIncidentData: IncidentFormValues) => { 
      if (!user?.uid || !incidentToEdit?.id) throw new Error("User or incident ID missing.");
      const incidentRef = doc(db, INCIDENTS_COLLECTION, incidentToEdit.id);
      const dataForDb: Omit<Incident, 'id'> = { // Type to match DB structure
        userId: user.uid,
        type: updatedIncidentData.type,
        description: updatedIncidentData.description,
        location: updatedIncidentData.location,
        timestamp: updatedIncidentData.timestamp.toISOString(), // Convert Date to ISO string
        region: updatedIncidentData.region,
        reportedBy: updatedIncidentData.reportedBy,
        classification: updatedIncidentData.classification,
        isRecordable: updatedIncidentData.isRecordable,
        lostWorkDays: updatedIncidentData.lostWorkDays,
        isFatality: updatedIncidentData.isFatality,
        severityLevel: updatedIncidentData.severityLevel,
        rootCauseAnalyzed: updatedIncidentData.rootCauseAnalyzed,
        status: updatedIncidentData.status,
      };
      await updateDoc(incidentRef, dataForDb); 
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_COLLECTION, incidentToEdit?.id, user?.uid] });
      toast({ title: "Incident Updated", description: `Incident record has been updated.` });
      router.push('/risk-management');
    },
    onError: (e: Error) => toast({ title: "Error Updating Incident", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveIncident = (formData: IncidentFormValues) => {
    updateIncidentMutation.mutate(formData);
  };

  const handleCancel = () => {
    router.push('/risk-management');
  };

  if (isLoadingIncident) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-6 space-y-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent>
        </Card>
      </div>
    );
  }

  if (incidentError || !incidentToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Incident Not Found</CardTitle></CardHeader>
          <CardContent><p>The incident could not be found or you don't have permission to edit it.</p></CardContent>
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
                 <Megaphone className="h-6 w-6 text-orange-500" /> Edit Incident / Event
            </h1>
        </div>
        <IncidentForm 
            initialData={incidentToEdit} 
            onSave={handleSaveIncident} 
            onCancel={handleCancel}
            isSubmitting={updateIncidentMutation.isPending}
        />
    </div>
  );
}
