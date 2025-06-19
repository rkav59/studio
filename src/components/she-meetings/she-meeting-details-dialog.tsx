
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { SheMeeting, MeetingActionItem, MeetingActionItemStatus } from "@/lib/types";
import { format, parseISO, isValid, isBefore } from 'date-fns';
import { Users, CalendarDays, MapPin, FileText, ListChecks, ClipboardList, AlertTriangle, CheckCircle, ClockIcon, Link as LinkIcon } from "lucide-react";

interface SheMeetingDetailsDialogProps {
  meeting: SheMeeting;
  onClose: () => void;
}

export function SheMeetingDetailsDialog({ meeting, onClose }: SheMeetingDetailsDialogProps) {

  const getMeetingTypeColor = (type: SheMeeting['meetingType']) => ({
    'Safety Committee': 'text-orange-500', 'Management Review': 'text-purple-500', 'Toolbox Talk': 'text-teal-500', 'Program Kick-off': 'text-blue-500', 'Program Review': 'text-indigo-500', 'Other': 'text-gray-500'
  }[type] || 'text-muted-foreground');

  const getActionItemStatusIcon = (status: MeetingActionItemStatus) => {
    switch (status) {
      case 'Open': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'In Progress': return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Deferred': return <ListChecks className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };
   const getActionItemDateStatusInfo = (dateString?: string, itemStatus?: MeetingActionItemStatus ): { textClass: string; icon?: JSX.Element; displayText: string; } | null => {
    if (!dateString || !isValid(parseISO(dateString)) || itemStatus === 'Completed' || itemStatus === 'Deferred') return null;
    const date = parseISO(dateString);
    const today = new Date(); today.setHours(0,0,0,0);
    const formattedDate = format(date, "PPP");

    if (isBefore(date, today)) {
        return { textClass: 'text-red-600 font-semibold', icon: <AlertTriangle className="h-3 w-3 mr-1" />, displayText: `${formattedDate} (Overdue)` };
    }
    return { textClass: 'text-muted-foreground', icon: <ClockIcon className="h-3 w-3 mr-1"/>, displayText: formattedDate };
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent">
            <Users className="h-6 w-6" /> {meeting.title}
          </DialogTitle>
          <DialogDescription>
            <span className={`font-medium ${getMeetingTypeColor(meeting.meetingType)}`}>{meeting.meetingType}</span>
            {' '}| Date: {format(parseISO(meeting.meetingDate), "PPP")} | Location: {meeting.locationOrPlatform}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                {meeting.linkedProgramName && (
                  <section className="p-3 bg-muted/30 rounded-md">
                     <p className="flex items-center gap-1 text-sm"><LinkIcon className="h-4 w-4 text-muted-foreground"/><strong>Linked Program:</strong> {meeting.linkedProgramName}</p>
                  </section>
                )}
                
                <section>
                    <h3 className="text-md font-semibold mb-1 text-muted-foreground">Attendees:</h3>
                    <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs">{meeting.attendees || "Not specified."}</p>
                </section>

                {meeting.agenda && (<> <Separator />
                <section>
                    <h3 className="text-md font-semibold mb-1 text-muted-foreground">Agenda / Topics:</h3>
                    <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs">{meeting.agenda}</p>
                </section> </>)}

                {meeting.minutes && (<> <Separator />
                <section>
                    <h3 className="text-md font-semibold mb-1 text-muted-foreground">Minutes / Key Discussion Points:</h3>
                    <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs">{meeting.minutes}</p>
                </section> </>)}

                {meeting.actionItems && meeting.actionItems.length > 0 && (
                    <> <Separator />
                    <section>
                        <h3 className="text-md font-semibold mb-2 text-muted-foreground flex items-center gap-1"><ClipboardList className="h-5 w-5"/>Action Items ({meeting.actionItems.length})</h3>
                        <ul className="space-y-2">
                            {meeting.actionItems.map(item => {
                                const dueDateInfo = getActionItemDateStatusInfo(item.dueDate, item.status);
                                return (
                                <li key={item.id} className="p-2.5 border rounded-md bg-secondary/50">
                                    <p className="font-medium text-sm">{item.description}</p>
                                    <div className="grid grid-cols-2 gap-x-2 text-xs text-muted-foreground/90 mt-1">
                                        <p><strong>Assigned:</strong> {item.assignedTo}</p>
                                        <p className="flex items-center">
                                            {getActionItemStatusIcon(item.status)}
                                            <strong className="ml-1">Status:</strong> {item.status}
                                        </p>
                                        {item.dueDate && (
                                            <p className={`flex items-center col-span-2 ${dueDateInfo?.textClass || ''}`}>
                                               {dueDateInfo?.icon || <ClockIcon className="h-3 w-3 mr-1"/>}
                                               <strong>Due:</strong> {dueDateInfo?.displayText || format(parseISO(item.dueDate), "PPP")}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            )})}
                        </ul>
                    </section> </>
                )}
            </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
