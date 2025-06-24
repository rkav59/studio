
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
import type { PtwSupervisionRecord, SupervisionChecklistItemResult } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { Search, User, CalendarDays, CheckSquare, AlertTriangle, CircleOff, Clock, FileText, Activity } from "lucide-react";

interface PtwSupervisionDetailsDialogProps {
  record: PtwSupervisionRecord;
  onClose: () => void;
}

export function PtwSupervisionDetailsDialog({ record, onClose }: PtwSupervisionDetailsDialogProps) {

  const getChecklistItemStatusColor = (status: SupervisionChecklistItemResult) => {
    switch (status) {
      case 'Satisfactory': return 'text-green-500';
      case 'Needs Improvement': return 'text-yellow-500';
      case 'Unsatisfactory': return 'text-red-500';
      case 'N/A': return 'text-gray-500';
      default: return 'text-muted-foreground';
    }
  };
  
  const getChecklistItemStatusIcon = (status: SupervisionChecklistItemResult) => {
    switch (status) {
      case 'Satisfactory': return <CheckSquare className="h-3 w-3 mr-1 text-green-500" />;
      case 'Needs Improvement': return <AlertTriangle className="h-3 w-3 mr-1 text-yellow-500" />;
      case 'Unsatisfactory': return <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />;
      case 'N/A': return <CircleOff className="h-3 w-3 mr-1 text-gray-500" />;
      default: return null;
    }
  };

  const getPerformanceRatingColor = (rating: PtwSupervisionRecord['overallPerformanceRating']) => {
    switch (rating) {
      case 'Excellent':
      case 'Good': return 'text-green-600 dark:text-green-400';
      case 'Fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'Poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-500">
            <Search className="h-6 w-6" /> Supervision Record Details
          </DialogTitle>
          <DialogDescription>
            Record for PTW #{record.ptwNumber} on {format(parseISO(record.supervisionDate), "PPP")}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Supervisor:</strong> <span className="ml-1">{record.supervisorName}</span></div>
                    <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Date:</strong> <span className="ml-1">{format(parseISO(record.supervisionDate), "PPP")}</span></div>
                    <div className="flex items-center col-span-1 md:col-span-2"><Activity className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Overall Rating:</strong> <span className={`ml-1 font-semibold ${getPerformanceRatingColor(record.overallPerformanceRating)}`}>{record.overallPerformanceRating}</span></div>
                </div>
                
                <Separator className="my-3"/>
                <h4 className="font-medium text-muted-foreground mb-1">Checklist Details:</h4>
                <ul className="space-y-1.5 text-xs border rounded-md p-3 bg-muted/30">
                    {record.checklistItems.map(item => (
                        <li key={item.id} className="py-1 border-b border-dashed border-muted last:border-b-0">
                            <div className="flex justify-between items-start">
                                <span className="flex-1 pr-2">{item.questionText}</span>
                                <span className={`font-semibold flex items-center shrink-0 ${getChecklistItemStatusColor(item.result)}`}>
                                    {getChecklistItemStatusIcon(item.result)}
                                    {item.result}
                                </span>
                            </div>
                            {item.observations && <p className="text-xs text-muted-foreground/80 italic mt-0.5 ml-4">- {item.observations}</p>}
                        </li>
                    ))}
                </ul>

                {record.summaryNotes && (
                    <>
                        <Separator className="my-3"/>
                        <div className="flex items-start"><FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">Summary Notes:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{record.summaryNotes}</p>
                            </div>
                        </div>
                    </>
                )}
                 {record.actionItemsRequired && (
                    <>
                        <Separator className="my-3"/>
                        <div className="flex items-start"><AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">Action Items Required:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{record.actionItemsRequired}</p>
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
