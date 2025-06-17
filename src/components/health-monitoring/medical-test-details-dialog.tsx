
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
import type { MedicalTestRecord } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { ShieldCheck, User, CalendarDays, Activity, Info, CheckCircle2, AlertTriangle, Users, Tag, AlignLeft } from "lucide-react";

interface MedicalTestDetailsDialogProps {
  record: MedicalTestRecord;
  segName?: string;
  onClose: () => void;
}

export function MedicalTestDetailsDialog({ record, segName, onClose }: MedicalTestDetailsDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-500">
            <ShieldCheck className="h-6 w-6" /> Medical Test Details
          </DialogTitle>
          <DialogDescription>
            Record for {record.employeeName} - {record.testType} on {format(parseISO(record.testDate), "PPP")}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-3 text-sm">
                <div className="flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Employee:</strong> <span className="ml-1">{record.employeeName}</span></div>
                {record.employeeId && <div className="flex items-center"><Tag className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Employee ID:</strong> <span className="ml-1">{record.employeeId}</span></div>}
                <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Test Date:</strong> <span className="ml-1">{format(parseISO(record.testDate), "PPP")}</span></div>
                
                <Separator className="my-2"/>

                <div className="flex items-center"><Activity className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Test Type:</strong> <span className="ml-1">{record.testType}{record.specificTestName ? ` - ${record.specificTestName}` : ''}</span></div>
                {record.segId && segName && <div className="flex items-center"><Users className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Associated SEG:</strong> <span className="ml-1">{segName}</span></div>}
                
                <div>
                    <strong className="text-muted-foreground">Result Summary:</strong>
                    <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{record.resultSummary}</p>
                </div>
                 {record.referenceRange && (
                    <div className="flex items-start"><AlignLeft className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                            <strong className="text-muted-foreground">Reference Range:</strong>
                            <p className="text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{record.referenceRange}</p>
                        </div>
                    </div>
                )}
                
                <Separator className="my-2"/>

                {record.isFitForWork !== undefined && (
                    <div className={`flex items-center ${record.isFitForWork ? 'text-green-600' : 'text-red-600'}`}>
                        {record.isFitForWork ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                        <strong>Fit for Work:</strong> <span className="ml-1 font-semibold">{record.isFitForWork ? 'Yes' : 'No'}</span>
                    </div>
                )}
                {record.followUpRequired !== undefined && (
                    <div className={`flex items-center ${record.followUpRequired ? 'text-yellow-600' : 'text-gray-600'}`}>
                         {record.followUpRequired ? <AlertTriangle className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />}
                        <strong>Follow-up Required:</strong> <span className="ml-1 font-semibold">{record.followUpRequired ? 'Yes' : 'No'}</span>
                    </div>
                )}
                
                {record.notes && (
                    <>
                        <Separator className="my-2"/>
                        <div className="flex items-start"><Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">Additional Notes:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{record.notes}</p>
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
