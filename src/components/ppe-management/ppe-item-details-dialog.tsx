
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
import type { PpeItem } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Package, Tag, ListChecks, Archive, Layers,ShoppingCart, CalendarDays, AlertTriangle, Activity } from "lucide-react";

interface PpeItemDetailsDialogProps {
  item: PpeItem;
  onClose: () => void;
}

export function PpeItemDetailsDialog({ item, onClose }: PpeItemDetailsDialogProps) {

  const getStatusColor = (status?: PpeItem['status']) => {
    switch (status) {
      case 'Available': return 'text-green-600 dark:text-green-400';
      case 'Under Inspection':
      case 'Awaiting Repair':
      case 'Awaiting Replacement': return 'text-yellow-600 dark:text-yellow-400';
      case 'Discarded': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Package className="h-6 w-6" /> {item.name}
          </DialogTitle>
          <DialogDescription>
            Details for PPE item: {item.type} - {item.category}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                    <strong>Type:</strong> <span className="ml-1">{item.type}</span>
                </div>
                <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                    <strong>Category:</strong> <span className="ml-1">{item.category}</span>
                </div>
                {item.specifications && (
                    <div>
                        <div className="flex items-start">
                            <ListChecks className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <strong>Specifications:</strong>
                        </div>
                        <p className="ml-6 whitespace-pre-wrap text-muted-foreground bg-secondary/50 p-2 rounded-md text-xs">{item.specifications}</p>
                    </div>
                )}
                <Separator/>
                <div className="flex items-center">
                    <Archive className="h-4 w-4 mr-2 text-muted-foreground" />
                    <strong>Current Stock:</strong> <span className="ml-1 font-semibold">{item.currentStock}</span>
                    {item.currentStock < item.reorderLevel && 
                        <span className="ml-2 text-red-500 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4"/> Low Stock!
                        </span>
                    }
                </div>
                <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <strong>Reorder Level:</strong> <span className="ml-1">{item.reorderLevel}</span>
                </div>
                 <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                    <strong>Status:</strong> <span className={`ml-1 font-semibold ${getStatusColor(item.status)}`}>{item.status || 'N/A'}</span>
                </div>
                 {item.supplier && (
                    <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
                        <strong>Supplier:</strong> <span className="ml-1">{item.supplier}</span>
                    </div>
                )}
                {item.lastStocktakeDate && isValid(parseISO(item.lastStocktakeDate)) && (
                    <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                        <strong>Last Stocktake:</strong> <span className="ml-1">{format(parseISO(item.lastStocktakeDate), "PPP")}</span>
                    </div>
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
