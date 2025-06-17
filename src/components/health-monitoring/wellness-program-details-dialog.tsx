
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
import type { WellnessProgram, WellnessProgramStatus } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { Award, CalendarDays, Info, Users, CheckSquare, AlertCircle, PlayCircle, PauseCircle, Users2 } from "lucide-react";

interface WellnessProgramDetailsDialogProps {
  program: WellnessProgram;
  onClose: () => void;
}

export function WellnessProgramDetailsDialog({ program, onClose }: WellnessProgramDetailsDialogProps) {

  const getStatusIcon = (status: WellnessProgramStatus) => {
    switch (status) {
      case 'Planned': return <CalendarDays className="h-4 w-4 text-blue-500" />;
      case 'Active': return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'Completed': return <CheckSquare className="h-4 w-4 text-gray-500" />;
      case 'On Hold': return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getStatusColor = (status: WellnessProgramStatus) => {
    switch (status) {
      case 'Planned': return 'text-blue-600 dark:text-blue-400';
      case 'Active': return 'text-green-600 dark:text-green-400';
      case 'Completed': return 'text-gray-600 dark:text-gray-400';
      case 'On Hold': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-500">
            <Award className="h-6 w-6" /> Wellness Program: {program.programName}
          </DialogTitle>
          <DialogDescription>
            Details for the employee wellness initiative.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-3 text-sm">
                <div>
                    <strong className="text-muted-foreground">Program Name:</strong>
                    <p className="font-semibold text-base">{program.programName}</p>
                </div>
                
                <Separator className="my-2"/>
                
                <div className="flex items-center gap-2">
                    {getStatusIcon(program.status)}
                    <strong>Status:</strong> <span className={`font-semibold ${getStatusColor(program.status)}`}>{program.status}</span>
                </div>
                <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Start Date:</strong> <span className="ml-1">{format(parseISO(program.startDate), "PPP")}</span></div>
                {program.endDate && <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><strong>End Date:</strong> <span className="ml-1">{format(parseISO(program.endDate), "PPP")}</span></div>}
                
                {program.targetAudience && (
                     <div className="flex items-center"><Users2 className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Target Audience:</strong> <span className="ml-1">{program.targetAudience}</span></div>
                )}
                
                {program.description && (
                    <>
                        <Separator className="my-2"/>
                        <div className="flex items-start"><Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">Description:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{program.description}</p>
                            </div>
                        </div>
                    </>
                )}
                
                {program.participationNotes && (
                    <>
                        <Separator className="my-2"/>
                        <div className="flex items-start"><Users className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">Participation Notes:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{program.participationNotes}</p>
                            </div>
                        </div>
                    </>
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
