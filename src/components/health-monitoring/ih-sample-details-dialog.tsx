
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
import type { IndustrialHygieneSample } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { Thermometer, CalendarDays, User, MapPin, Beaker, Package, Tag, Clock, FileText, Users, AlertTriangle, ShieldAlert } from "lucide-react";

interface IhSampleDetailsDialogProps {
  sample: IndustrialHygieneSample;
  segName?: string;
  onClose: () => void;
}

export function IhSampleDetailsDialog({ sample, segName, onClose }: IhSampleDetailsDialogProps) {
  const exceedsOel = sample.oel !== undefined && sample.exposureLevel > sample.oel;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent">
            <Thermometer className="h-6 w-6" /> IH Sample Details
          </DialogTitle>
          <DialogDescription>
            Record for {sample.agent} {sample.specificAgentName ? `(${sample.specificAgentName})` : ''} sample taken on {format(parseISO(sample.sampleDate), "PPP")}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-3 text-sm">
                {sample.segId && segName && <div className="flex items-center"><Users className="h-4 w-4 mr-2 text-muted-foreground" /><strong>SEG:</strong> <span className="ml-1">{segName}</span></div>}
                {sample.employeeName && <div className="flex items-center"><User className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Employee:</strong> <span className="ml-1">{sample.employeeName}</span></div>}
                <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Sample Date:</strong> <span className="ml-1">{format(parseISO(sample.sampleDate), "PPP")}</span></div>
                
                <Separator className="my-2"/>

                <div className="flex items-center"><Beaker className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Agent:</strong> <span className="ml-1">{sample.agent}{sample.specificAgentName ? ` - ${sample.specificAgentName}` : ''}</span></div>
                <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Exposure Level:</strong> <span className="ml-1">{sample.exposureLevel} {sample.units}</span></div>
                 {sample.oel !== undefined && (
                  <div className="flex items-center">
                    <AlertTriangle className={`h-4 w-4 mr-2 ${exceedsOel ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <strong>OEL:</strong> <span className="ml-1">{sample.oel} {sample.oelUnits || sample.units}</span>
                  </div>
                )}
                {exceedsOel && (
                  <p className="text-red-500 font-semibold flex items-center gap-1"><ShieldAlert className="h-4 w-4" /> EXPOSURE EXCEEDS OEL!</p>
                )}
                <div className="flex items-center"><Tag className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Sample Type:</strong> <span className="ml-1">{sample.sampleType}</span></div>
                <div className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Location:</strong> <span className="ml-1">{sample.location}</span></div>
                
                {(sample.durationHours || sample.twa || sample.stel) && <Separator className="my-2"/>}

                {sample.durationHours && <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-muted-foreground" /><strong>Duration:</strong> <span className="ml-1">{sample.durationHours} hours</span></div>}
                {sample.twa !== undefined && <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-muted-foreground" /><strong>TWA:</strong> <span className="ml-1">{sample.twa} {sample.units}</span></div>}
                {sample.stel !== undefined && <div className="flex items-center"><Package className="h-4 w-4 mr-2 text-muted-foreground" /><strong>STEL:</strong> <span className="ml-1">{sample.stel} {sample.units}</span></div>}
                
                {sample.notes && (
                    <>
                        <Separator className="my-2"/>
                        <div className="flex items-start"><FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">Notes:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{sample.notes}</p>
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
