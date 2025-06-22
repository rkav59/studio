
"use client";

import { useRouter } from 'next/navigation';
import { SheMeetingForm } from "@/components/she-meetings/she-meeting-form";
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SheMeeting, SheProgram, MeetingActionItem } from '@/lib/types';
import { ArrowLeft, Users } from 'lucide-react';
import { parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const MEETINGS_COLLECTION = 'sheMeetings';
const PROGRAMS_COLLECTION = 'shePrograms';

export default function NewSheMeetingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading: isLoadingPrograms, error: programsError } = useQuery<SheProgram[]>({
    queryKey: [PROGRAMS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PROGRAMS_COLLECTION), where("userId", "==", user.uid), orderBy("programName"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SheProgram));
    },
    enabled: !!user?.uid,
  });

  const addMeetingMutation = useMutation({
    mutationFn: async (newMeetingData: Omit<SheMeeting, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newMeetingData,
        userId: user.uid,
        meetingDate: Timestamp.fromDate(parseISO(newMeetingData.meetingDate as string)),
        actionItems: (newMeetingData.actionItems || []).map(ai => ({
          ...ai,
          dueDate: ai.dueDate ? Timestamp.fromDate(parseISO(ai.dueDate as string)) : null,
        })),
        linkedProgramId: newMeetingData.linkedProgramId || null, // Convert undefined to null
        linkedProgramName: newMeetingData.linkedProgramName || null, // Convert undefined to null
      };
      return addDoc(collection(db, MEETINGS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEETINGS_COLLECTION, user?.uid] });
      toast({ title: "SHE Meeting Created", description: "The new SHE meeting has been successfully logged." });
      router.push('/she-meetings');
    },
    onError: (e: Error) => toast({ title: "Error Creating Meeting", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveMeeting = (data: Omit<SheMeeting, 'id' | 'userId'>) => {
    addMeetingMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/she-meetings');
  };

  if (isLoadingPrograms) {
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

  if (programsError) {
     return <div className="text-red-500 text-center py-10">Error loading SHE programs. Please try again later.</div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to SHE Meetings & Programs">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Users className="h-6 w-6 text-accent" /> Create New SHE Meeting
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Define the details for the new SHE meeting below.
          </CardDescription>
        </CardHeader>
        <SheMeetingForm
          programs={programs}
          onSave={handleSaveMeeting}
          onCancel={handleCancel}
          isSubmitting={addMeetingMutation.isPending}
        />
      </Card>
    </div>
  );
}
