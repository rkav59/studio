
"use client";

import { useRouter, useParams } from 'next/navigation';
import { SheMeetingForm } from "@/components/she-meetings/she-meeting-form";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SheMeeting, SheProgram, MeetingActionItem } from '@/lib/types';
import { ArrowLeft, Users } from 'lucide-react';
import { parseISO } from 'date-fns';

const MEETINGS_COLLECTION = 'sheMeetings';
const PROGRAMS_COLLECTION = 'shePrograms';

export default function EditSheMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const meetingId = params.id as string;

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

  const { data: meetingToEdit, isLoading: isLoadingMeeting, error: meetingError } = useQuery<SheMeeting | null>({
    queryKey: [MEETINGS_COLLECTION, meetingId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !meetingId) return null;
      const meetingRef = doc(db, MEETINGS_COLLECTION, meetingId);
      const meetingSnap = await getDoc(meetingRef);
      if (meetingSnap.exists() && meetingSnap.data().userId === user.uid) {
        const data = meetingSnap.data();
        return {
          id: meetingSnap.id,
          ...data,
          meetingDate: (data.meetingDate as Timestamp)?.toDate().toISOString(),
          actionItems: (data.actionItems || []).map((ai: any) => ({
            ...ai,
            dueDate: ai.dueDate ? (ai.dueDate as Timestamp).toDate().toISOString() : undefined,
          })),
        } as SheMeeting;
      }
      return null;
    },
    enabled: !!user?.uid && !!meetingId,
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async (updatedMeetingData: SheMeeting) => {
      if (!user?.uid || !updatedMeetingData.id) throw new Error("Missing user or meeting ID.");
      const { id, ...dataToUpdate } = updatedMeetingData;
      const meetingRef = doc(db, MEETINGS_COLLECTION, id);
      const dataForDb = {
        ...dataToUpdate,
        userId: user.uid,
        meetingDate: Timestamp.fromDate(parseISO(dataToUpdate.meetingDate as string)),
        actionItems: (dataToUpdate.actionItems || []).map(ai => ({
          ...ai,
          dueDate: ai.dueDate ? Timestamp.fromDate(parseISO(ai.dueDate as string)) : null,
        })),
      };
      await updateDoc(meetingRef, dataForDb);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MEETINGS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [MEETINGS_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Meeting Updated", description: `SHE Meeting "${variables.title}" has been updated.` });
      router.push('/she-meetings');
    },
    onError: (e: Error) => toast({ title: "Error Updating Meeting", description: e.message, variant: "destructive" }),
  });

  const handleSaveMeeting = (formData: Omit<SheMeeting, 'id' | 'userId'>) => {
    if (!meetingToEdit) return;
    const meetingDataToSave: SheMeeting = {
      ...meetingToEdit,
      ...formData,
    };
    updateMeetingMutation.mutate(meetingDataToSave);
  };

  const handleCancel = () => {
    router.push('/she-meetings');
  };

  if (isLoadingPrograms || isLoadingMeeting) {
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

  if (programsError || meetingError || !meetingToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>SHE Meeting Not Found</CardTitle></CardHeader>
          <CardContent><p>{programsError?.message || meetingError?.message || "The meeting could not be found or you don't have permission to edit it."}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to SHE Meetings & Programs">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <Users className="h-6 w-6 text-accent" /> Edit SHE Meeting: {meetingToEdit.title}
            </h1>
        </div>
        <Card className="shadow-lg">
            <CardHeader>
                <CardDescription>
                    Modify the details for this SHE Meeting.
                </CardDescription>
            </CardHeader>
            <SheMeetingForm
                programs={programs}
                initialData={meetingToEdit}
                onSave={handleSaveMeeting}
                onCancel={handleCancel}
                isSubmitting={updateMeetingMutation.isPending}
            />
        </Card>
    </div>
  );
}
