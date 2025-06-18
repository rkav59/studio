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
import type { PermitToWork } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { FileText, User, MapPin, Clock, AlertTriangle, CheckCircle2, ShieldCheck, UserCheck, CalendarX2, Search } from "lucide-react"; // Added Search

interface PtwDetailsDialogProps {
  ptw: PermitToWork;
  contractorName: string;
  onClose: () => void;
  supervisionRecordsCount: number;
  onNavigateToSupervision: () => void;
}

export function PtwDetailsDialog({ ptw, contractorName, onClose, supervisionRecordsCount, onNavigateToSupervision }: PtwDetailsDialogProps) {

  const getPtwStatusIcon = (status: PermitToWork['status']) => {
    switch (status) {
      case 'Approved':
      case 'Active': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'Requested': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'Closed': return <ShieldCheck className="h-5 w-5 text-gray-500" />;
      case 'Cancelled':
      case 'Expired': return <CalendarX2 className="h-5 w-5 text-red-500" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground"/>;
    }
  };
  
  const getPtwStatusColor = (status: PermitToWork['status']) => {
    switch (status) {
      case 'Approved':
      case 'Active': return 'text-green-600 dark:text-green-400';
      case 'Requested': return 'text-yellow-600 dark:text-yellow-400';
      case 'Closed': return 'text-gray-500 dark:text-gray-400';
      case 'Cancelled': 
      case 'Expired': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent">
            <FileText className="h-6 w-6" /> Permit to Work: {ptw.ptwNumber}
          </DialogTitle>
          <DialogDescription>
            Details for PTW issued to {contractorName}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-6">
                {/* Core PTW Info */}
                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">Permit Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <p><strong>PTW Number:</strong> {ptw.ptwNumber}</p>
                        <p><strong>Contractor:</strong> {contractorName}</p>
                        <p className="md:col-span-2"><strong>Work Description:</strong> {ptw.workDescription}</p>
                        <p><strong>Location:</strong> {ptw.location}</p>
                        <div className="flex items-center gap-2">
                           {getPtwStatusIcon(ptw.status)}
                           <strong>Status:</strong> <span className={`font-semibold ${getPtwStatusColor(ptw.status)}`}>{ptw.status}</span>
                        </div>
                    </div>
                </section>

                <Separator/>

                {/* Validity */}
                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">Validity Period</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/><strong>Start:</strong> {format(parseISO(ptw.startDate), "PPPp")}</p>
                        <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/><strong>End:</strong> {format(parseISO(ptw.endDate), "PPPp")}</p>
                    </div>
                </section>

                <Separator/>
                
                {/* Scope and Precautions */}
                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">Scope of Work & Precautions</h3>
                    <div className="text-sm space-y-2">
                        <div>
                            <p><strong>Detailed Scope of Work:</strong></p>
                            <p className="text-muted-foreground whitespace-pre-wrap p-2 bg-muted/30 rounded-md">{ptw.scopeOfWork}</p>
                        </div>
                        <div>
                            <p><strong>Safety Precautions Required:</strong></p>
                            <p className="text-muted-foreground whitespace-pre-wrap p-2 bg-muted/30 rounded-md">{ptw.precautions}</p>
                        </div>
                        {ptw.supervisorOnSite && <p><strong>Contractor Supervisor:</strong> {ptw.supervisorOnSite}</p>}
                    </div>
                </section>

                <Separator/>

                {/* Authorization & Closure */}
                {(ptw.authorizedBy || ptw.closedBy) && (
                    <section>
                        <h3 className="text-lg font-semibold mb-2 border-b pb-1">Authorization & Closure</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {ptw.authorizedBy && <p><strong>Authorized By:</strong> {ptw.authorizedBy}</p>}
                            {ptw.authorizationDate && isValid(parseISO(ptw.authorizationDate)) && <p><strong>Authorization Date:</strong> {format(parseISO(ptw.authorizationDate), "PPPp")}</p>}
                            {ptw.closedBy && <p><strong>Closed/Cancelled By:</strong> {ptw.closedBy}</p>}
                            {ptw.closureDate && isValid(parseISO(ptw.closureDate)) && <p><strong>Closure Date:</strong> {format(parseISO(ptw.closureDate), "PPPp")}</p>}
                        </div>
                    </section>
                )}

                <Separator />
                {/* Supervision Records Summary */}
                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">On-Site Supervision</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {supervisionRecordsCount > 0 ? `${supervisionRecordsCount} supervision record(s) found.` : "No supervision records yet for this PTW."}
                        </p>
                        <Button variant="outline" size="sm" onClick={onNavigateToSupervision}>
                            <Search className="mr-2 h-4 w-4" />
                            {supervisionRecordsCount > 0 ? "View/Manage Supervision" : "Conduct Supervision"}
                        </Button>
                    </div>
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