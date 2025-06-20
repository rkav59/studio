
"use client";

import { useState, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, CalendarRange, Users, ListChecks, Activity, Settings, Loader2, ClockIcon, AlertTriangle, CheckCircle } from "lucide-react";
import type { SheProgram, SheMeeting, MeetingActionItem, MeetingActionItemStatus } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, isBefore, differenceInDays } from 'date-fns';
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
const UPCOMING_MEETING_DAYS_THRESHOLD = 7;
const ACTION_ITEM_DUE_SOON_DAYS = 3;

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

  const upcomingMeetings = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const cutOffDate = new Date(today);
    cutOffDate.setDate(today.getDate() + UPCOMING_MEETING_DAYS_THRESHOLD);

    return meetings
      .filter(meeting => {
        if (!meeting.meetingDate || !isValid(parseISO(meeting.meetingDate))) return false;
        const meetingDateObj = parseISO(meeting.meetingDate);
        return meetingDateObj >= today && meetingDateObj <= cutOffDate;
      })
      .sort((a, b) => parseISO(a.meetingDate).getTime() - parseISO(b.meetingDate).getTime());
  }, [meetings]);

  const pendingActionItems = useMemo(() => {
    const items: Array<MeetingActionItem & { meetingTitle: string; meetingId: string; isOverdue: boolean; isDueSoon: boolean }> = [];
    const today = new Date(); today.setHours(0,0,0,0);

    meetings.forEach(meeting => {
      (meeting.actionItems || []).forEach(item => {
        if (item.status === 'Open' || item.status === 'In Progress') {
          let isOverdue = false;
          let isDueSoon = false;
          if (item.dueDate && isValid(parseISO(item.dueDate))) {
            const dueDateObj = parseISO(item.dueDate);
            isOverdue = isBefore(dueDateObj, today);
            if (!isOverdue) {
                isDueSoon = differenceInDays(dueDateObj, today) <= ACTION_ITEM_DUE_SOON_DAYS;
            }
          }
          items.push({ ...item, meetingTitle: meeting.title, meetingId: meeting.id, isOverdue, isDueSoon });
        }
      });
    });
    return items.sort((a,b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.dueDate && b.dueDate) return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.description.localeCompare(b.description);
    });
  }, [meetings]);
  
  const getActionItemDateColor = (item: { isOverdue: boolean; isDueSoon: boolean; dueDate?: string; status: MeetingActionItemStatus }) => {
    if (item.status === 'Completed' || item.status === 'Deferred') return 'text-gray-500';
    if (item.isOverdue) return 'text-red-500 font-semibold';
    if (item.isDueSoon) return 'text-yellow-600 font-semibold';
    return 'text-muted-foreground';
  };
  
  const getActionItemStatusIcon = (status: MeetingActionItemStatus) => {
    switch (status) {
      case 'Open': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'In Progress': return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Deferred': return <ListChecks className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };


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

      {/* Reminders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarRange className="h-6 w-6 text-blue-500"/>Upcoming Meetings (Next {UPCOMING_MEETING_DAYS_THRESHOLD} Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No meetings scheduled in the next {UPCOMING_MEETING_DAYS_THRESHOLD} days.</p>
            ) : (
              <ScrollArea className="max-h-[300px] pr-3">
                <ul className="space-y-3">
                  {upcomingMeetings.map(meeting => (
                    <li key={meeting.id} className="p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="font-semibold">{meeting.title} <span className={`text-xs ${getMeetingTypeColor(meeting.meetingType)}`}>({meeting.meetingType})</span></h4>
                      <p className="text-sm text-muted-foreground">
                        Date: {format(parseISO(meeting.meetingDate), "PPP, p")}
                      </p>
                      <Button variant="outline" size="xs" className="mt-1 h-7 text-xs" onClick={() => setViewingMeeting(meeting)}>View Details</Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-orange-500"/>Pending & Overdue Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingActionItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No open or in-progress action items.</p>
            ) : (
              <ScrollArea className="max-h-[300px] pr-3">
                <ul className="space-y-3">
                  {pendingActionItems.map(item => (
                    <li key={item.id} className={`p-3 border rounded-md ${item.isOverdue ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : item.isDueSoon ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : 'bg-muted/30'}`}>
                      <p className="font-medium text-sm">{item.description}</p>
                      <p className="text-xs text-muted-foreground">Assigned to: {item.assignedTo}</p>
                      <p className={`text-xs ${getActionItemDateColor(item)}`}>
                        Due: {item.dueDate ? format(parseISO(item.dueDate), "PPP") : "Not Set"}
                        {item.isOverdue && " (Overdue!)"}
                        {item.isDueSoon && !item.isOverdue && " (Due Soon)"}
                      </p>
                      <div className="flex items-center gap-1 text-xs">
                        {getActionItemStatusIcon(item.status)} Status: {item.status}
                      </div>
                      <Button variant="link" size="xs" className="p-0 h-auto text-xs text-blue-600 hover:underline" onClick={() => { const m = meetings.find(meet => meet.id === item.meetingId); if (m) setViewingMeeting(m); }}>
                        From: {item.meetingTitle}
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      <Separator/>


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
            <CardDescription>Schedule upcoming meetings, including agenda and attendees. After meetings, update them to log minutes, track outcomes, and manage action items.</CardDescription>
          </div>
          <Button onClick={handleOpenNewMeetingForm} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Schedule New Meeting
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
                <li>Automated reminders for meeting action item due dates (requires backend setup).</li>
                <li>Integration with other modules (e.g., link incidents to meeting discussions).</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}

