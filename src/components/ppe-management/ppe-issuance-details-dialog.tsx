
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
import { User, Package, Briefcase, CalendarCheck, RotateCcw, HelpCircle, StickyNote } from "lucide-react";
import { Separator } from "../ui/separator";

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
                
                <div className="flex items-center pt-2"><CalendarCheck className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Issued Date:</strong> <span className="ml-1">{format(parseISO(issuance.issuedDate), "PPP")}</span></div>
                
                {issuance.notes && (
                    <>
                        <div className="flex items-start pt-2"><StickyNote className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong>Issuance Notes:</strong>
                                <p className="whitespace-pre-wrap text-muted-foreground bg-secondary/50 p-2 rounded-md text-xs">{issuance.notes}</p>
                            </div>
                        </div>
                    </>
                )}
                
                {(issuance.expectedReturnDate || issuance.actualReturnDate || issuance.returnNotes) && <Separator className="my-2"/>}

                {issuance.expectedReturnDate && isValid(parseISO(issuance.expectedReturnDate)) && (
                    <div className="flex items-center"><RotateCcw className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Expected Return:</strong> <span className="ml-1">{format(parseISO(issuance.expectedReturnDate), "PPP")}</span></div>
                )}
                {issuance.actualReturnDate && isValid(parseISO(issuance.actualReturnDate)) && (
                    <div className="flex items-center"><RotateCcw className="h-4 w-4 mr-2 text-green-500" /><strong>Actual Return:</strong> <span className="ml-1 font-semibold">{format(parseISO(issuance.actualReturnDate), "PPP")}</span></div>
                )}

                {issuance.returnNotes && (
                    <>
                        <div className="flex items-start pt-2"><HelpCircle className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong>Return Notes:</strong>
                                <p className="whitespace-pre-wrap text-muted-foreground bg-secondary/50 p-2 rounded-md text-xs">{issuance.returnNotes}</p>
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
