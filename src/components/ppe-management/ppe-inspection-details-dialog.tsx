
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
import type { PpeInspectionRecord, PpeInspectionChecklistItemResult } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { ShieldCheck, User, Package, CalendarDays, AlertCircle, StickyNote, Clock, RefreshCcwDot, Tag, CheckSquare, AlertTriangle, CircleOff } from "lucide-react"; // Added Tag
import { Separator } from "../ui/separator";

interface PpeInspectionDetailsDialogProps {
  inspection: PpeInspectionRecord;
  ppeItemName: string;
  onClose: () => void;
}

export function PpeInspectionDetailsDialog({ inspection, ppeItemName, onClose }: PpeInspectionDetailsDialogProps) {
  
  const getOverallStatusColor = (status: PpeInspectionRecord['overallStatus']) => {
    switch (status) {
      case 'Pass': return 'text-green-600 dark:text-green-400';
      case 'Requires Repair': return 'text-yellow-600 dark:text-yellow-400';
      case 'To be Replaced': return 'text-red-600 dark:text-red-400';
      case 'Action Pending': return 'text-blue-500 dark:text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  const getChecklistItemStatusColor = (status: PpeInspectionChecklistItemResult) => {
    switch (status) {
      case 'Pass': return 'text-green-500';
      case 'Fail': return 'text-red-500';
      case 'N/A': return 'text-gray-500';
      case 'Pending': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };
  
  const getChecklistItemStatusIcon = (status: PpeInspectionChecklistItemResult) => {
    switch (status) {
      case 'Pass': return <CheckSquare className="h-3 w-3 mr-1 text-green-500" />;
      case 'Fail': return <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />;
      case 'N/A': return <CircleOff className="h-3 w-3 mr-1 text-gray-500" />;
      case 'Pending': return <Clock className="h-3 w-3 mr-1 text-yellow-500" />;
      default: return null;
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-600">
            <ShieldCheck className="h-6 w-6" /> PPE Inspection Details
          </DialogTitle>
          <DialogDescription>
            Inspection record for: {ppeItemName} {inspection.uniquePpeIdentifier ? `(ID: ${inspection.uniquePpeIdentifier})` : ''}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-muted-foreground" /><strong>PPE Item:</strong> <span className="ml-1">{ppeItemName}</span></div>
                    {inspection.uniquePpeIdentifier && <div className="flex items-center"><Tag className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Unique ID:</strong> <span className="ml-1">{inspection.uniquePpeIdentifier}</span></div>}
                    <div className="flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Inspector:</strong> <span className="ml-1">{inspection.inspectorName}</span></div>
                    <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Insp. Date:</strong> <span className="ml-1">{format(parseISO(inspection.inspectionDate), "PPP")}</span></div>
                    <div className="flex items-center col-span-1 md:col-span-2"><AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Overall Status:</strong> <span className={`ml-1 font-semibold ${getOverallStatusColor(inspection.overallStatus)}`}>{inspection.overallStatus}</span></div>
                </div>
                
                {inspection.checklistItems && inspection.checklistItems.length > 0 && (
                    <>
                        <Separator className="my-3"/>
                        <h4 className="font-medium text-muted-foreground mb-1">Checklist Details:</h4>
                        <ul className="space-y-1.5 text-xs border rounded-md p-3 bg-muted/30">
                            {inspection.checklistItems.map(item => (
                                <li key={item.id} className="py-1 border-b border-dashed border-muted last:border-b-0">
                                    <div className="flex justify-between items-start">
                                        <span className="flex-1 pr-2">{item.text}</span>
                                        <span className={`font-semibold flex items-center shrink-0 ${getChecklistItemStatusColor(item.result)}`}>
                                          {getChecklistItemStatusIcon(item.result)}
                                          {item.result}
                                        </span>
                                    </div>
                                    {item.remarks && <p className="text-xs text-muted-foreground/80 italic mt-0.5 ml-4">- {item.remarks}</p>}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {inspection.notes && (
                    <>
                        <Separator className="my-3"/>
                        <div className="flex items-start"><StickyNote className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">General Notes:</strong>
                                <p className="whitespace-pre-wrap text-muted-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{inspection.notes}</p>
                            </div>
                        </div>
                    </>
                )}

                {(inspection.followUpAction || inspection.nextInspectionDate) && <Separator className="my-3"/>}
                
                {inspection.followUpAction && (
                     <div className="flex items-center"><RefreshCcwDot className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Follow-up Action:</strong> <span className="ml-1">{inspection.followUpAction}</span></div>
                )}
                {inspection.nextInspectionDate && isValid(parseISO(inspection.nextInspectionDate)) && (
                    <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Next Insp. Date:</strong> <span className="ml-1">{format(parseISO(inspection.nextInspectionDate), "PPP")}</span></div>
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

