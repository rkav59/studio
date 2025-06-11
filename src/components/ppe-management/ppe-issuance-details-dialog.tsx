
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
import type { PpeIssuanceRecord } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { User, Package, Briefcase, CalendarCheck, CalendarClock, RotateCcw, HelpCircle, StickyNote } from "lucide-react";

interface PpeIssuanceDetailsDialogProps {
  issuance: PpeIssuanceRecord;
  ppeItemName: string;
  onClose: () => void;
}

export function PpeIssuanceDetailsDialog({ issuance, ppeItemName, onClose }: PpeIssuanceDetailsDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent">
            <Package className="h-6 w-6" /> PPE Issuance Details
          </DialogTitle>
          <DialogDescription>
            Record for {ppeItemName} issued to {issuance.employeeName}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4 my-4">
            <div className="space-y-3 text-sm">
                <div className="flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Employee:</strong> <span className="ml-1">{issuance.employeeName}</span></div>
                {issuance.jobRole && <div className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Job Role:</strong> <span className="ml-1">{issuance.jobRole}</span></div>}
                <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-muted-foreground" /><strong>PPE Item:</strong> <span className="ml-1">{ppeItemName} (Quantity: {issuance.quantityIssued})</span></div>
                
                <Separator className="my-3"/>
                
                <div className="flex items-center"><CalendarCheck className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Issued Date:</strong> <span className="ml-1">{format(parseISO(issuance.issuedDate), "PPP")}</span></div>
                {issuance.expectedReturnDate && isValid(parseISO(issuance.expectedReturnDate)) && (
                    <div className="flex items-center"><CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Expected Return:</strong> <span className="ml-1">{format(parseISO(issuance.expectedReturnDate), "PPP")}</span></div>
                )}
                {issuance.actualReturnDate && isValid(parseISO(issuance.actualReturnDate)) ? (
                    <>
                        <div className="flex items-center text-green-600"><RotateCcw className="h-4 w-4 mr-2" /><strong>Actual Return Date:</strong> <span className="ml-1 font-semibold">{format(parseISO(issuance.actualReturnDate), "PPP")}</span></div>
                        {issuance.conditionOnReturn && <div className="flex items-center"><HelpCircle className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Condition on Return:</strong> <span className="ml-1">{issuance.conditionOnReturn}</span></div>}
                    </>
                ) : (
                     <div className="flex items-center text-yellow-600"><RotateCcw className="h-4 w-4 mr-2" /><strong>Status:</strong> <span className="ml-1 font-semibold">Currently Issued</span></div>
                )}
                
                {issuance.notes && (
                    <>
                        <Separator className="my-3"/>
                        <div className="flex items-start"><StickyNote className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong>Notes:</strong>
                                <p className="whitespace-pre-wrap text-muted-foreground bg-secondary/50 p-2 rounded-md text-xs">{issuance.notes}</p>
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
