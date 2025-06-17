
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
import type { MockDrill, DrillActionItem } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Activity, CalendarDays, FileText, Users, MessageSquare, BookOpen, ClipboardCheck, AlertTriangle, CheckCircle, ListChecks, Link } from "lucide-react";

interface MockDrillDetailsDialogProps {
  drill: MockDrill;
  planName?: string;
  onClose: () => void;
}

export function MockDrillDetailsDialog({ drill, planName, onClose }: MockDrillDetailsDialogProps) {
  
  const getDrillStatusColor = (status: MockDrill['status']) => {
    switch (status) {
      case 'Planned': return 'text-blue-500';
      case 'Completed': return 'text-green-600';
      case 'Cancelled': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getActionItemStatusIcon = (status: DrillActionItem['status']) => {
    switch (status) {
      case 'Open': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'In Progress': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Deferred': return <ListChecks className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-500">
            <Activity className="h-6 w-6" /> Mock Drill: {drill.drillName}
          </DialogTitle>
          <DialogDescription>
            Details for {drill.drillType} drill.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <section>
                    <h3 className="text-md font-semibold mb-1">Drill Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
                        <p><strong>Type:</strong> {drill.drillType}</p>
                        <p><strong>Status:</strong> <span className={`font-semibold ${getDrillStatusColor(drill.status)}`}>{drill.status}</span></p>
                        <p><CalendarDays className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Scheduled:</strong> {format(parseISO(drill.scheduledDate), "PPP")}</p>
                        {drill.actualDate && isValid(parseISO(drill.actualDate)) && (
                            <p><CalendarDays className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Actual Date:</strong> {format(parseISO(drill.actualDate), "PPP")}</p>
                        )}
                        {drill.linkedPlanId && planName && (
                            <p className="md:col-span-2"><Link className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Linked Plan:</strong> {planName}</p>
                        )}
                    </div>
                </section>
                
                <Separator />
                
                <section>
                    <h3 className="text-md font-semibold mb-1">Scenario & Participants</h3>
                    <div>
                        <strong className="text-muted-foreground">Scenario:</strong>
                        <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{drill.scenario}</p>
                    </div>
                    {drill.participants && (
                        <div className="mt-2">
                            <strong className="text-muted-foreground">Participants:</strong>
                            <p className="text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{drill.participants}</p>
                        </div>
                    )}
                </section>

                {(drill.observations || drill.lessonsLearned) && <Separator />}

                {drill.observations && (
                    <section>
                         <strong className="text-muted-foreground flex items-center gap-1"><MessageSquare className="h-4 w-4"/>Observations:</strong>
                         <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{drill.observations}</p>
                    </section>
                )}
                {drill.lessonsLearned && (
                    <section>
                        <strong className="text-muted-foreground flex items-center gap-1"><BookOpen className="h-4 w-4"/>Lessons Learned:</strong>
                        <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{drill.lessonsLearned}</p>
                    </section>
                )}

                {drill.actionItems && drill.actionItems.length > 0 && (
                    <>
                        <Separator />
                        <section>
                            <h3 className="text-md font-semibold mb-1 flex items-center gap-1"><ClipboardCheck className="h-5 w-5"/>Action Items</h3>
                            <ul className="space-y-2">
                                {drill.actionItems.map(item => (
                                    <li key={item.id} className="p-2 border rounded-md bg-muted/30">
                                        <p className="font-medium">{item.description}</p>
                                        <div className="grid grid-cols-2 gap-x-2 text-xs text-muted-foreground">
                                            <p><strong>Assigned:</strong> {item.assignedTo}</p>
                                            <p className="flex items-center">
                                                {getActionItemStatusIcon(item.status)}
                                                <strong className="ml-1">Status:</strong> {item.status}
                                            </p>
                                            {item.dueDate && isValid(parseISO(item.dueDate)) && (
                                                <p><strong>Due:</strong> {format(parseISO(item.dueDate), "PPP")}</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
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
