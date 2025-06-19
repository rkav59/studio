
"use client";

import { useRouter } from 'next/navigation';
import { IncidentForm, type IncidentFormValues } from "@/components/risk-management/incident-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Incident } from '@/lib/types';
import { ArrowLeft, Megaphone } from 'lucide-react';

const INCIDENTS_COLLECTION = 'incidents';

export default function NewIncidentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addIncidentMutation = useMutation({
    mutationFn: async (newIncidentData: IncidentFormValues) => { 
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb: Omit<Incident, 'id'> = { // Explicitly match the Incident type minus 'id'
        userId: user.uid,
        type: newIncidentData.type,
        description: newIncidentData.description,
        location: newIncidentData.location,
        timestamp: newIncidentData.timestamp.toISOString(), // Convert Date to ISO string
        region: newIncidentData.region,
        reportedBy: newIncidentData.reportedBy,
        classification: newIncidentData.classification,
        isRecordable: newIncidentData.isRecordable,
        lostWorkDays: newIncidentData.lostWorkDays,
        isFatality: newIncidentData.isFatality,
        severityLevel: newIncidentData.severityLevel,
        rootCauseAnalyzed: newIncidentData.rootCauseAnalyzed,
        status: newIncidentData.status,
      };
      return addDoc(collection(db, INCIDENTS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_COLLECTION, user?.uid] });
      toast({ title: "Incident Logged", description: "The new incident/event has been successfully recorded." });
      router.push('/risk-management');
    },
    onError: (e: Error) => toast({ title: "Error Logging Incident", description: e.message, variant: "destructive" }),
  });

  const handleSaveIncident = (data: IncidentFormValues) => {
    addIncidentMutation.mutate(data);
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
                 <Megaphone className="h-6 w-6 text-orange-500" /> Log New Incident / Event
            </h1>
        </div>
        <IncidentForm 
          onSave={handleSaveIncident} 
          onCancel={handleCancel} 
          isSubmitting={addIncidentMutation.isPending}
        />
    </div>
  );
}
