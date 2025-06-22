
"use client";

import { useRouter } from 'next/navigation';
import { EmergencyResourceForm } from "@/components/emergency-preparedness/emergency-resource-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmergencyResource } from '@/lib/types';
import { ArrowLeft, Box } from 'lucide-react';
import { parseISO } from 'date-fns';

const RESOURCES_COLLECTION = 'emergencyResources';

export default function NewEmergencyResourcePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addResourceMutation = useMutation({
    mutationFn: async (newResourceData: Omit<EmergencyResource, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newResourceData, 
        userId: user.uid,
        lastCheckedDate: newResourceData.lastCheckedDate ? Timestamp.fromDate(parseISO(newResourceData.lastCheckedDate)) : null,
        nextCheckDate: newResourceData.nextCheckDate ? Timestamp.fromDate(parseISO(newResourceData.nextCheckDate)) : null,
      };
      return addDoc(collection(db, RESOURCES_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCES_COLLECTION, user?.uid] });
      toast({ title: "Emergency Resource Added", description: "The new resource has been successfully added to inventory." });
      router.push('/emergency-preparedness');
    },
    onError: (e: Error) => toast({ title: "Error Adding Resource", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveResource = (data: Omit<EmergencyResource, 'id' | 'userId'>) => {
    addResourceMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/emergency-preparedness');
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Emergency Preparedness">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Box className="h-6 w-6 text-accent" /> Add New Emergency Resource
            </h1>
        </div>
        <EmergencyResourceForm 
          onSave={handleSaveResource} 
          onCancel={handleCancel} 
          isSubmitting={addResourceMutation.isPending}
        />
    </div>
  );
}
