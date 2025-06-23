
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
import type { JobCard } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { ClipboardCheck, User, MapPin, CalendarDays, HardHat, CheckSquare, Square, StickyNote } from "lucide-react";

interface JobCardDetailsDialogProps {
  jobCard: JobCard;
  contractorName: string;
  onClose: () => void;
}

export function JobCardDetailsDialog({ jobCard, contractorName, onClose }: JobCardDetailsDialogProps) {

  const getStatusColor = (status: JobCard['status']) => {
    switch (status) {
      case 'Issued':
      case 'In Progress': return 'text-green-600 dark:text-green-400';
      case 'Draft': return 'text-yellow-600 dark:text-yellow-400';
      case 'Completed': return 'text-gray-500 dark:text-gray-400';
      case 'Cancelled': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-500">
            <ClipboardCheck className="h-6 w-6" /> Job Card: {jobCard.jobCardNumber}
          </DialogTitle>
          <DialogDescription>
            Details for job card issued to {contractorName}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-6">
                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">Job Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <p><strong>Job Card #:</strong> {jobCard.jobCardNumber}</p>
                        <p><strong>Contractor:</strong> {contractorName}</p>
                        <p className="md:col-span-2"><strong>Job Description:</strong> {jobCard.jobDescription}</p>
                        <p><strong>Location:</strong> {jobCard.location}</p>
                         <p><strong>Status:</strong> <span className={`font-semibold ${getStatusColor(jobCard.status)}`}>{jobCard.status}</span></p>
                        <p><CalendarDays className="inline h-4 w-4 mr-1 text-muted-foreground"/><strong>Work Date:</strong> {format(parseISO(jobCard.workDate), "PPP")}</p>
                    </div>
                </section>

                <Separator/>
                
                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">Safety Requirements</h3>
                    <div className="text-sm space-y-3">
                        <div>
                            <p className="flex items-center gap-1 font-medium"><HardHat className="h-4 w-4"/><strong>Required PPE:</strong></p>
                            <p className="text-muted-foreground whitespace-pre-wrap p-2 bg-muted/30 rounded-md mt-1">{jobCard.requiredPpe || "None specified"}</p>
                        </div>
                        <div>
                            <p className="font-medium"><strong>Pre-Work Safety Checks:</strong></p>
                            <ul className="space-y-1 mt-1">
                                {jobCard.safetyChecks.map(check => (
                                    <li key={check.id} className="flex items-center gap-2 text-muted-foreground">
                                        {check.isChecked ? <CheckSquare className="h-4 w-4 text-green-500"/> : <Square className="h-4 w-4"/>}
                                        <span>{check.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
                
                {(jobCard.supervisorSignOffName || jobCard.clientSignOffName || jobCard.notes) && <Separator/>}

                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">Sign-Off & Notes</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {jobCard.supervisorSignOffName && <p><User className="inline h-4 w-4 mr-1 text-muted-foreground"/><strong>Contractor Supervisor:</strong> {jobCard.supervisorSignOffName}</p>}
                        {jobCard.clientSignOffName && <p><User className="inline h-4 w-4 mr-1 text-muted-foreground"/><strong>Client Sign-off:</strong> {jobCard.clientSignOffName}</p>}
                    </div>
                    {jobCard.notes && (
                        <div className="mt-3">
                            <p className="flex items-center gap-1 font-medium"><StickyNote className="h-4 w-4"/><strong>Notes:</strong></p>
                            <p className="text-muted-foreground whitespace-pre-wrap p-2 bg-muted/30 rounded-md mt-1">{jobCard.notes}</p>
                        </div>
                    )}
                </section>
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
