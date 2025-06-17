
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
import type { PpeJobRoleMatrixEntry, PpeItem } from "@/lib/types";
import { Users, Package, Link as LinkIcon } from "lucide-react";

interface PpeJobRoleMatrixDetailsDialogProps {
  entry: PpeJobRoleMatrixEntry;
  ppeItems: PpeItem[]; // Pass the full list to look up names
  onClose: () => void;
}

export function PpeJobRoleMatrixDetailsDialog({ entry, ppeItems, onClose }: PpeJobRoleMatrixDetailsDialogProps) {
  
  const getPpeItemName = (itemId: string) => {
    const item = ppeItems.find(p => p.id === itemId);
    return item ? `${item.name} (${item.type})` : "Unknown PPE Item";
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-600">
            <Users className="h-6 w-6" /> PPE Requirements for: {entry.jobRole}
          </DialogTitle>
          <DialogDescription>
            Standard Personal Protective Equipment required for the specified job role.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <div>
                    <strong className="text-muted-foreground">Job Role:</strong>
                    <p className="font-semibold text-base">{entry.jobRole}</p>
                </div>
                
                <Separator/>
                
                <div>
                    <strong className="text-muted-foreground flex items-center gap-1 mb-1"><Package className="h-4 w-4"/>Required PPE Items:</strong>
                    {entry.requiredPpeItemIds.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 pl-4 bg-muted/30 p-3 rounded-md">
                            {entry.requiredPpeItemIds.map(itemId => (
                                <li key={itemId}>{getPpeItemName(itemId)}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic text-muted-foreground">No specific PPE items listed for this role.</p>
                    )}
                </div>

                {entry.riskAssessmentReference && (
                    <>
                        <Separator/>
                        <div>
                            <strong className="text-muted-foreground flex items-center gap-1"><LinkIcon className="h-4 w-4"/>Risk Assessment Reference:</strong>
                            <p>{entry.riskAssessmentReference}</p>
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
