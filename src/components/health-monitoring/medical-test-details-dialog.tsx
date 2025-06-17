
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
import type { MedicalTestRecord, MedicalTestWithCertStatus } from "@/lib/types"; // Use MedicalTestWithCertStatus
import { format, parseISO, isValid } from 'date-fns';
import { ShieldCheck, User, CalendarDays, Activity, Info, CheckCircle2, AlertTriangle, Users, Tag, AlignLeft, Link2, Briefcase, CalendarClock, ClockIcon } from "lucide-react";

interface MedicalTestDetailsDialogProps {
  record: MedicalTestWithCertStatus; // Use the derived type
  segName?: string;
  onClose: () => void;
}

export function MedicalTestDetailsDialog({ record, segName, onClose }: MedicalTestDetailsDialogProps) {

  const getCertStatusStyling = (status?: MedicalTestWithCertStatus['certificateStatus']) => {
    if (!status || status === 'N/A') return { textClass: 'text-muted-foreground', icon: <CalendarClock className="h-4 w-4 mr-1" /> };
    switch (status) {
      case 'Expired': return { textClass: 'text-red-600 dark:text-red-400 font-bold', icon: <AlertTriangle className="h-4 w-4 mr-1 text-red-500" /> };
      case 'Expiring Soon': return { textClass: 'text-yellow-600 dark:text-yellow-400 font-semibold', icon: <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" /> };
      case 'Valid': return { textClass: 'text-green-600 dark:text-green-400 font-semibold', icon: <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> };
      default: return { textClass: 'text-muted-foreground', icon: <CalendarClock className="h-4 w-4 mr-1" /> };
    }
  };

  const certStatusDetails = getCertStatusStyling(record.certificateStatus);


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-500">
            <ShieldCheck className="h-6 w-6" /> Medical Test/Screening Details
          </DialogTitle>
          <DialogDescription>
            Record for {record.employeeName} - {record.testType} on {format(parseISO(record.testDate), "PPP")}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-3 text-sm">
                <div className="flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Employee:</strong> <span className="ml-1">{record.employeeName}</span></div>
                {record.employeeId && <div className="flex items-center"><Tag className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Employee ID:</strong> <span className="ml-1">{record.employeeId}</span></div>}
                <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Test/Screening Date:</strong> <span className="ml-1">{format(parseISO(record.testDate), "PPP")}</span></div>
                
                <Separator className="my-2"/>

                <div className="flex items-center"><Activity className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Test Type:</strong> <span className="ml-1">{record.testType}{record.specificTestName ? ` - ${record.specificTestName}` : ''}</span></div>
                {record.screeningPurpose && <div className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Screening Purpose:</strong> <span className="ml-1">{record.screeningPurpose}</span></div>}
                {record.linkedExposure && <div className="flex items-center"><Link2 className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Linked Exposure:</strong> <span className="ml-1">{record.linkedExposure}</span></div>}
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
                 {record.certificateExpiryDate && isValid(parseISO(record.certificateExpiryDate)) && (
                  <div className="flex items-center">
                    {certStatusDetails.icon}
                    <strong>Certificate Expiry:</strong>
                    <span className={`ml-1 ${certStatusDetails.textClass}`}>{format(parseISO(record.certificateExpiryDate), "PPP")} {record.certificateStatus !== 'N/A' ? `(${record.certificateStatus})` : ''}</span>
                  </div>
                )}
                {record.followUpRequired && ( // Check if true, not just defined
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                         <AlertTriangle className="h-4 w-4 mr-2" />
                        <strong>Follow-up Required:</strong> <span className="ml-1 font-semibold">Yes</span>
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
