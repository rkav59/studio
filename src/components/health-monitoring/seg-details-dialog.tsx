
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
import type { SimilarExposureGroup } from "@/lib/types";
import { Users, Info, Activity } from "lucide-react";

interface SegDetailsDialogProps {
  seg: SimilarExposureGroup;
  onClose: () => void;
}

export function SegDetailsDialog({ seg, onClose }: SegDetailsDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Users className="h-6 w-6" /> SEG Details: {seg.name}
          </DialogTitle>
          <DialogDescription>
            Detailed information for Similar Exposure Group.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <div>
                    <strong className="text-muted-foreground">Name:</strong>
                    <p className="font-semibold text-base">{seg.name}</p>
                </div>
                
                {seg.description && (
                    <>
                        <Separator/>
                        <div className="flex items-start">
                            <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">Description:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{seg.description}</p>
                            </div>
                        </div>
                    </>
                )}
                
                {seg.riskProfileNotes && (
                    <>
                        <Separator/>
                         <div className="flex items-start">
                            <Activity className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">Risk Profile Notes:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{seg.riskProfileNotes}</p>
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
