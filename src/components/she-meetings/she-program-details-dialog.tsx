
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
import type { SheProgram, SheProgramStatus } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Activity, CalendarDays, Info, Users, CheckSquare, AlertTriangle, PlayCircle, PauseCircle, Target, ListChecks, Briefcase, DollarSign } from "lucide-react";

interface SheProgramDetailsDialogProps {
  program: SheProgram;
  onClose: () => void;
}

export function SheProgramDetailsDialog({ program, onClose }: SheProgramDetailsDialogProps) {

  const getStatusIcon = (status: SheProgramStatus) => ({
    'Planned': <CalendarDays className="h-4 w-4 text-blue-500" />,
    'Ongoing': <PlayCircle className="h-4 w-4 text-green-500" />,
    'Completed': <CheckSquare className="h-4 w-4 text-gray-500" />,
    'On Hold': <PauseCircle className="h-4 w-4 text-yellow-500" />,
    'Cancelled': <AlertTriangle className="h-4 w-4 text-red-500" />,
  }[status] || <Info className="h-4 w-4 text-muted-foreground"/>);

  const getStatusColor = (status: SheProgramStatus) => ({
    'Planned': 'text-blue-600', 'Ongoing': 'text-green-600', 'Completed': 'text-gray-600', 'On Hold': 'text-yellow-600', 'Cancelled': 'text-red-600'
  }[status] || 'text-muted-foreground');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Activity className="h-6 w-6" /> SHE Program: {program.programName}
          </DialogTitle>
          <DialogDescription>
            Details for {program.programType} program.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <section>
                    <h3 className="text-md font-semibold mb-1">Core Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        <p><strong className="text-muted-foreground">Type:</strong> {program.programType}</p>
                        <div className="flex items-center gap-1">
                            {getStatusIcon(program.status)}
                            <strong>Status:</strong> <span className={`font-semibold ${getStatusColor(program.status)}`}>{program.status}</span>
                        </div>
                        <p><CalendarDays className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Start Date:</strong> {format(parseISO(program.startDate), "PPP")}</p>
                        {program.endDate && isValid(parseISO(program.endDate)) && (
                            <p><CalendarDays className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>End Date:</strong> {format(parseISO(program.endDate), "PPP")}</p>
                        )}
                        {program.leadPerson && <p><Briefcase className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Lead:</strong> {program.leadPerson}</p>}
                        {program.budget && <p><DollarSign className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Budget:</strong> {program.budget}</p>}
                    </div>
                </section>

                <Separator />
                
                <section>
                    <div className="flex items-start gap-2">
                        <Target className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"/>
                        <div>
                            <strong className="text-muted-foreground">Objective:</strong>
                            <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{program.objective}</p>
                        </div>
                    </div>
                </section>

                {program.targetAudience && (
                    <> <Separator />
                    <section className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <strong>Target Audience:</strong> {program.targetAudience}
                    </section> </>
                )}

                {program.keyActivities && (
                    <> <Separator />
                    <section>
                        <div className="flex items-start gap-2">
                            <ListChecks className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"/>
                            <div>
                                <strong className="text-muted-foreground">Key Activities:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{program.keyActivities}</p>
                            </div>
                        </div>
                    </section> </>
                )}
                
                {program.kpis && (
                     <> <Separator />
                    <section>
                        <div className="flex items-start gap-2">
                            <CheckSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"/>
                            <div>
                                <strong className="text-muted-foreground">KPIs:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{program.kpis}</p>
                            </div>
                        </div>
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
