
"use client";

import { useState, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, CalendarRange, Users, ListChecks, Activity, Settings, Loader2, ClockIcon, AlertTriangle, CheckCircle, Download, RefreshCw, Search } from "lucide-react"; // Added Search
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
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

const PROGRAMS_COLLECTION = 'shePrograms';
const MEETINGS_COLLECTION = 'sheMeetings';
const UPCOMING_MEETING_DAYS_THRESHOLD = 7;
const ACTION_ITEM_DUE_SOON_DAYS = 3;

export default function SheMeetingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  const [viewingProgram, setViewingProgram] = useState<SheProgram | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<SheMeeting | null>(null);
  const [isRefreshingUpcomingMeetings, setIsRefreshingUpcomingMeetings] = useState(false); // State for upcoming meetings refresh
  const [meetingSearchTerm, setMeetingSearchTerm] = useState("");

  const canCreate = useMemo(() => user?.email === 'sentriq263@gmail.com' || (userProfile && ['admin', 'she_officer', 'she_rep'].includes(userProfile.role)), [user, userProfile]);
  const canManage = useMemo(() => user?.email === 'sentriq263@gmail.com' || (userProfile && ['admin', 'she_officer'].includes(userProfile.role)), [user, userProfile]);
  const disabledTooltipContent = "You do not have permission to perform this action.";

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
  
  const filteredMeetings = useMemo(() => {
    if (!meetingSearchTerm) {
      return meetings;
    }
    const lowercasedTerm = meetingSearchTerm.toLowerCase();
    return meetings.filter(meeting =>
      meeting.title.toLowerCase().includes(lowercasedTerm) ||
      meeting.meetingType.toLowerCase().includes(lowercasedTerm) ||
      meeting.locationOrPlatform.toLowerCase().includes(lowercasedTerm) ||
      (meeting.linkedProgramName && meeting.linkedProgramName.toLowerCase().includes(lowercasedTerm))
    );
  }, [meetings, meetingSearchTerm]);


  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      if (meetings.some(meeting => meeting.linkedProgramId === programId)) {
        throw new Error("Cannot delete: This program is linked to existing meetings.");
      }
      await deleteDoc(doc(db, PROGRAMS_COLLECTION, programId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROGRAMS_COLLECTION, user?.uid] });
      toast({ title: "Program Deleted" });
    },
    onError: (e: Error) => {
        const userFriendlyMessage = "An unexpected error occurred while deleting the program. Please try again.";
        toast({ title: "Error Deleting Program", description: userFriendlyMessage, variant: "destructive" });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (meetingId: string) => deleteDoc(doc(db, MEETINGS_COLLECTION, meetingId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEETINGS_COLLECTION, user?.uid] });
      toast({ title: "Meeting Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Meeting", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
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

  const handleDownloadMinutesTemplate = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SHE Meeting Minutes and Action Items</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; color: #333; }
        h1, h2, h3 { color: #2c3e50; } /* Darker blue for headings */
        h1 { font-size: 24px; border-bottom: 2px solid #3498DB; padding-bottom: 5px; }
        h2 { font-size: 20px; margin-top: 30px; color: #3498DB; } /* Primary blue for H2 */
        h3 { font-size: 16px; margin-top: 20px; color: #E67E22; } /* Accent orange for H3 */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .section { margin-bottom: 25px; }
        .placeholder { color: #888; font-style: italic; }
        ul { margin-top: 5px; padding-left: 20px; }
        li { margin-bottom: 5px; }
    </style>
</head>
<body>
    <h1>SHE Meeting Minutes and Action Items</h1>

    <div class="section">
        <h2>Meeting Details</h2>
        <p><strong>Meeting Title:</strong> <span class="placeholder">[Enter Meeting Title]</span></p>
        <p><strong>Date:</strong> <span class="placeholder">[Enter Date, e.g., YYYY-MM-DD]</span></p>
        <p><strong>Time:</strong> <span class="placeholder">[Enter Time, e.g., HH:MM AM/PM]</span></p>
        <p><strong>Type:</strong> <span class="placeholder">[Safety Committee / Management Review / Toolbox Talk / Other]</span></p>
        <p><strong>Location/Platform:</strong> <span class="placeholder">[Enter Location or Platform, e.g., Conference Room A, MS Teams]</span></p>
    </div>

    <div class="section">
        <h2>Attendees</h2>
        <p class="placeholder">[List attendees here. Consider using a table for larger meetings with columns like Name, Department, Signature (if physical).]</p>
        <pre class="placeholder" style="white-space: pre-wrap; background-color: #f9f9f9; border: 1px dashed #ccc; padding: 10px;">[Attendee 1 - Department A]\n[Attendee 2 - Department B]\n[Guest 1 - External]</pre>
    </div>
    
    <div class="section">
        <h2>Agenda / Topics Discussed</h2>
        <p class="placeholder">[List agenda items or topics discussed. Use bullet points or a numbered list for clarity.]</p>
        <ul>
            <li><span class="placeholder">[Agenda Item 1: Detailed description or question]</span></li>
            <li><span class="placeholder">[Agenda Item 2: Detailed description or question]</span></li>
            <li><span class="placeholder">[Add more agenda items as needed...]</span></li>
        </ul>
    </div>

    <div class="section">
        <h2>Minutes / Key Discussion Points</h2>
        <p class="placeholder">[For each agenda item, record the main discussion points, decisions made, and key outcomes. Be specific and clear.]</p>
        <h3>Topic 1: <span class="placeholder">[Agenda Item 1 Title]</span></h3>
        <pre class="placeholder" style="white-space: pre-wrap; background-color: #f9f9f9; border: 1px dashed #ccc; padding: 10px;">[Detailed minutes for Topic 1...]</pre>
        <h3>Topic 2: <span class="placeholder">[Agenda Item 2 Title]</span></h3>
        <pre class="placeholder" style="white-space: pre-wrap; background-color: #f9f9f9; border: 1px dashed #ccc; padding: 10px;">[Detailed minutes for Topic 2...]</pre>
    </div>

    <div class="section">
        <h2>Action Items</h2>
        <table>
            <thead>
                <tr>
                    <th style="width:5%;">#</th>
                    <th style="width:40%;">Action Item Description</th>
                    <th style="width:20%;">Assigned To</th>
                    <th style="width:15%;">Due Date</th>
                    <th style="width:20%;">Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td><span class="placeholder">[Describe Action Item 1 clearly and concisely]</span></td>
                    <td><span class="placeholder">[Name/Team]</span></td>
                    <td><span class="placeholder">[YYYY-MM-DD]</span></td>
                    <td><span class="placeholder">[Open/In Progress/Completed/Deferred]</span></td>
                </tr>
                <tr>
                    <td>2</td>
                    <td><span class="placeholder">[Describe Action Item 2 clearly and concisely]</span></td>
                    <td><span class="placeholder">[Name/Team]</span></td>
                    <td><span class="placeholder">[YYYY-MM-DD]</span></td>
                    <td><span class="placeholder">[Open/In Progress/Completed/Deferred]</span></td>
                </tr>
                <!-- Add more rows by copying the tr block -->
                <tr>
                    <td><span class="placeholder">...</span></td>
                    <td><span class="placeholder">[Add more action items as needed]</span></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3>Next Meeting (if applicable)</h3>
        <p><strong>Date:</strong> <span class="placeholder">[Enter Date, e.g., YYYY-MM-DD]</span></p>
        <p><strong>Time:</strong> <span class="placeholder">[Enter Time, e.g., HH:MM AM/PM]</span></p>
        <p><strong>Location/Platform:</strong> <span class="placeholder">[Enter Location or Platform]</span></p>
        <p><strong>Tentative Agenda Items for Next Meeting:</strong></p>
        <p class="placeholder">[List any items to be carried over or new items for the next meeting.]</p>
    </div>

    <div class="section" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
        <p><strong>Minutes recorded by:</strong> <span class="placeholder">[Your Name/Role]</span></p>
        <p><strong>Date minutes prepared:</strong> <span class="placeholder">[YYYY-MM-DD]</span></p>
        <p style="margin-top: 20px;"><strong>Approved by (if applicable):</strong> <span class="placeholder">[Name/Role of Approver]</span></p>
        <p><strong>Date approved:</strong> <span class="placeholder">[YYYY-MM-DD]</span></p>
    </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "SHE_Meeting_Minutes_Template.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Template Downloaded", description: "SHE_Meeting_Minutes_Template.html has been downloaded. You can open it with Microsoft Word." });
  };

  const handleRefreshUpcomingMeetings = async () => {
    setIsRefreshingUpcomingMeetings(true);
    try {
      await queryClient.invalidateQueries({ queryKey: [MEETINGS_COLLECTION, user?.uid] });
      toast({ title: "Upcoming Meetings Refreshed", description: "The list of upcoming meetings has been updated." });
    } catch (e) {
      toast({ title: "Error Refreshing Meetings", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsRefreshingUpcomingMeetings(false);
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
    return <div className="text-red-500 text-center py-10">An unexpected error occurred. Please try again later.</div>;
  }

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <CalendarRange className="h-8 w-8"/> SHE Meetings & Programs
        </h1>
        <p className="text-muted-foreground">
          Organize, track, and manage safety, health, and environmental initiatives and communication. Data stored in Firestore.
        </p>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="#reminders-section">Reminders</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#she-programs">SHE Programs</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#she-meetings">SHE Meetings</Link>
          </Button>
        </CardContent>
      </Card>


      <Separator/>

      {/* Reminders Section */}
      <div id="reminders-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">Upcoming Meetings (Next {UPCOMING_MEETING_DAYS_THRESHOLD} Days)</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleRefreshUpcomingMeetings} disabled={isRefreshingUpcomingMeetings} title="Refresh Upcoming Meetings">
                {isRefreshingUpcomingMeetings ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
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
            <CardTitle className="flex items-center gap-2">Pending & Overdue Action Items</CardTitle>
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
      <Card id="she-programs">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">SHE Programs</CardTitle>
            <CardDescription>Manage ongoing and planned SHE initiatives and campaigns.</CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div tabIndex={0} className={cn(!canCreate && "cursor-not-allowed")}>
                <Button onClick={() => canCreate && handleOpenNewProgramForm()} disabled={!canCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Program
                </Button>
              </div>
            </TooltipTrigger>
            {!canCreate && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
          </Tooltip>
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
                        <Button variant="outline" size="sm" onClick={() => setViewingProgram(program)}>View</Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}>
                                <Button variant="secondary" size="sm" onClick={() => canManage && handleEditProgram(program)} disabled={!canManage}>Edit</Button>
                            </div>
                          </TooltipTrigger>
                          {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                        </Tooltip>
                        <AlertDialog>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                <div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm" disabled={!canManage || deleteProgramMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                                  </AlertDialogTrigger>
                                </div>
                              </TooltipTrigger>
                              {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Program?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the program "{program.programName}".</AlertDialogDescription></AlertDialogHeader>
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
      <Card id="she-meetings">
        <CardHeader className="flex flex-col gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-accent"/>
                SHE Meetings
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule upcoming meetings, including agenda and attendees. After meetings, update them to log minutes, track outcomes, and manage action items.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:self-end">
             <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search meetings..."
                    className="pl-8 w-full sm:w-[250px]"
                    value={meetingSearchTerm}
                    onChange={(e) => setMeetingSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
             <Button onClick={handleDownloadMinutesTemplate} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download Minutes Template
             </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <div tabIndex={0} className={cn(!canCreate && "cursor-not-allowed")}>
                    <Button onClick={() => canCreate && handleOpenNewMeetingForm()} disabled={!canCreate} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Schedule New Meeting
                    </Button>
                </div>
              </TooltipTrigger>
              {!canCreate && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
            </Tooltip>
          </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMeetings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {meetingSearchTerm ? "No matching meetings found." : "No SHE meetings logged yet."}
            </p>
          ) : (
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {filteredMeetings.map(meeting => (
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
                        <Button variant="outline" size="sm" onClick={() => setViewingMeeting(meeting)}>View</Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}>
                                    <Button variant="secondary" size="sm" onClick={() => canManage && handleEditMeeting(meeting)} disabled={!canManage}>Edit</Button>
                                </div>
                            </TooltipTrigger>
                            {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                        </Tooltip>
                        <AlertDialog>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                <div tabIndex={0} className={cn(!canManage && "cursor-not-allowed")}>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm" disabled={!canManage || deleteMeetingMutation.isPending}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                                  </AlertDialogTrigger>
                                </div>
                              </TooltipTrigger>
                              {!canManage && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Meeting?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the meeting "{meeting.title}".</AlertDialogDescription></AlertDialogHeader>
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
    </TooltipProvider>
  );
}
