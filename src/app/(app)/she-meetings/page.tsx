
"use client";

import { useState, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, CalendarRange, Users, ListChecks, Activity, Settings, Loader2 } from "lucide-react";
import type { SheProgram, SheMeeting, MeetingActionItem } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SheProgramDetailsDialog } from '@/components/she-meetings/she-program-details-dialog';
import { SheMeetingDetailsDialog } from '@/components/she-meetings/she-meeting-details-dialog';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PROGRAMS_COLLECTION = 'shePrograms';
const MEETINGS_COLLECTION = 'sheMeetings';

export default function SheMeetingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [viewingProgram, setViewingProgram] = useState<SheProgram | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<SheMeeting | null>(null);

  // Fetch SHE Programs
  const { data: programs = [], isLoading: isLoadingPrograms, error: programsError } = useQuery<SheProgram[]>({
    queryKey: [PROGRAMS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, PROGRAMS_COLLECTION), where("userId", "==", user.uid), orderBy("startDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id, ...data,
          startDate: (data.startDate as Timestamp)?.toDate().toISOString(),
          endDate: data.endDate ? (data.endDate as Timestamp).toDate().toISOString() : undefined,
        } as SheProgram;
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch SHE Meetings
  const { data: meetings = [], isLoading: isLoadingMeetings, error: meetingsError } = useQuery<SheMeeting[]>({
    queryKey: [MEETINGS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, MEETINGS_COLLECTION), where("userId", "==", user.uid), orderBy("meetingDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id, ...data,
          meetingDate: (data.meetingDate as Timestamp)?.toDate().toISOString(),
          actionItems: (data.actionItems || []).map((ai: any) => ({
            ...ai,
            dueDate: ai.dueDate ? (ai.dueDate as Timestamp).toDate().toISOString() : undefined,
          })),
        } as SheMeeting;
      });
    },
    enabled: !!user?.uid,
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      if (meetings.some(meeting => meeting.linkedProgramId === programId)) {
        throw new Error("This program is linked to meetings. Please unlink or delete them first.");
      }
      await deleteDoc(doc(db, PROGRAMS_COLLECTION, programId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROGRAMS_COLLECTION, user?.uid] });
      toast({ title: "Program Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Program", description: e.message, variant: "destructive" }),
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (meetingId: string) => deleteDoc(doc(db, MEETINGS_COLLECTION, meetingId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEETINGS_COLLECTION, user?.uid] });
      toast({ title: "Meeting Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Meeting", description: e.message, variant: "destructive" }),
  });

  const handleOpenNewProgramForm = () => router.push('/she-meetings/programs/new');
  const handleEditProgram = (program: SheProgram) => router.push(`/she-meetings/programs/edit/${program.id}`);
  const handleDeleteProgram = (programId: string) => deleteProgramMutation.mutate(programId);

  const handleOpenNewMeetingForm = () => router.push('/she-meetings/meetings/new');
  const handleEditMeeting = (meeting: SheMeeting) => router.push(`/she-meetings/meetings/edit/${meeting.id}`);
  const handleDeleteMeeting = (meetingId: string) => deleteMeetingMutation.mutate(meetingId);

  const getProgramStatusColor = (status: SheProgram['status']) => ({
    'Planned': 'text-blue-500', 'Ongoing': 'text-green-600', 'Completed': 'text-gray-500', 'On Hold': 'text-yellow-500', 'Cancelled': 'text-red-500'
  }[status] || 'text-muted-foreground');

  const getMeetingTypeColor = (type: SheMeeting['meetingType']) => ({
    'Safety Committee': 'text-orange-500', 'Management Review': 'text-purple-500', 'Toolbox Talk': 'text-teal-500', 'Program Kick-off': 'text-blue-500', 'Program Review': 'text-indigo-500', 'Other': 'text-gray-500'
  }[type] || 'text-muted-foreground');

  const isLoading = isLoadingPrograms || isLoadingMeetings;
  const anyError = programsError || meetingsError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading SHE Meetings & Programs data...</p>
      </div>
    );
  }
  if (anyError) {
    return <div className="text-red-500 text-center py-10">Error loading data: {anyError.message}</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image src="https://placehold.co/1200x400.png" alt="Team discussing SHE programs" layout="fill" objectFit="cover" data-ai-hint="team meeting" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">SHE Meetings & Programs</h1>
            <p className="text-sm text-neutral-300">Organize, track, and manage safety, health, and environmental initiatives and communication. Data stored in Firestore.</p>
          </div>
        </div>
      </Card>

      {/* SHE Programs Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Activity className="h-6 w-6 text-primary"/>SHE Programs</CardTitle>
            <CardDescription>Manage ongoing and planned SHE initiatives and campaigns.</CardDescription>
          </div>
          <Button onClick={handleOpenNewProgramForm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Program
          </Button>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No SHE programs defined yet.</p>
          ) : (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {programs.map(program => (
                  <Card key={program.id} className="p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">{program.programName} <span className="text-sm text-muted-foreground">({program.programType})</span></h4>
                        <p className="text-xs text-muted-foreground">Objective: {program.objective.substring(0, 100)}{program.objective.length > 100 ? '...' : ''}</p>
                        <p className={`text-xs font-semibold ${getProgramStatusColor(program.status)}`}>Status: {program.status}</p>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setViewingProgram(program)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditProgram(program)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteProgramMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Program?</AlertDialogTitle><AlertDialogDescription>Delete "{program.programName}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteProgram(program.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      {viewingProgram && <SheProgramDetailsDialog program={viewingProgram} onClose={() => setViewingProgram(null)} />}

      <Separator />

      {/* SHE Meetings Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-accent"/>SHE Meetings</CardTitle>
            <CardDescription>Log and track minutes and actions for various SHE meetings.</CardDescription>
          </div>
          <Button onClick={handleOpenNewMeetingForm} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Meeting
          </Button>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No SHE meetings logged yet.</p>
          ) : (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {meetings.map(meeting => (
                  <Card key={meeting.id} className="p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-semibold text-lg">{meeting.title}</h4>
                        <p className={`text-sm font-medium ${getMeetingTypeColor(meeting.meetingType)}`}>{meeting.meetingType}</p>
                        <p className="text-xs text-muted-foreground">Date: {format(parseISO(meeting.meetingDate), "PPP")} | Location: {meeting.locationOrPlatform}</p>
                        <p className="text-xs text-muted-foreground">Actions: {meeting.actionItems.length} (Open: {meeting.actionItems.filter(ai => ai.status === 'Open' || ai.status === 'In Progress').length})</p>
                        {meeting.linkedProgramName && <p className="text-xs text-muted-foreground">Linked Program: {meeting.linkedProgramName}</p>}
                      </div>
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setViewingMeeting(meeting)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditMeeting(meeting)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteMeetingMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Meeting?</AlertDialogTitle><AlertDialogDescription>Delete "{meeting.title}"? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMeeting(meeting.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      {viewingMeeting && <SheMeetingDetailsDialog meeting={viewingMeeting} onClose={() => setViewingMeeting(null)} />}

      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-muted-foreground" />Future Enhancements</CardTitle>
        </CardHeader>
        <CardContent>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                <li>Overall Program Calendar/Timeline view.</li>
                <li>Meeting effectiveness scoring and participation statistics.</li>
                <li>Automated reminders for meeting action item due dates.</li>
                <li>Integration with other modules (e.g., link incidents to meeting discussions).</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
