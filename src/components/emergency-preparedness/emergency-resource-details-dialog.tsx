
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
import type { EmergencyResource } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Box, CalendarDays, MapPin, Layers, CheckSquare, AlertTriangle, Info, Clock } from "lucide-react";

interface EmergencyResourceDetailsDialogProps {
  resource: EmergencyResource;
  onClose: () => void;
}

export function EmergencyResourceDetailsDialog({ resource, onClose }: EmergencyResourceDetailsDialogProps) {
  
  const getStatusColor = (status: EmergencyResource['status']) => {
    switch(status) {
        case 'Operational': return 'text-green-600';
        case 'Requires Maintenance':
        case 'Requires Refill':
        case 'Expired': return 'text-yellow-600';
        case 'Out of Service': return 'text-red-600';
        default: return 'text-muted-foreground';
    }
  };
  const getStatusIcon = (status: EmergencyResource['status']) => {
    switch(status) {
        case 'Operational': return <CheckSquare className="h-4 w-4 text-green-500" />;
        case 'Requires Maintenance':
        case 'Requires Refill':
        case 'Expired': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        case 'Out of Service': return <AlertTriangle className="h-4 w-4 text-red-500" />;
        default: return <Info className="h-4 w-4 text-muted-foreground"/>;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent">
            <Box className="h-6 w-6" /> Resource: {resource.name}
          </DialogTitle>
          <DialogDescription>
            Details for emergency resource: {resource.type}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4 my-4">
            <div className="space-y-3 text-sm">
                <p><Layers className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Type:</strong> {resource.type}</p>
                <p><MapPin className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Location:</strong> {resource.location}</p>
                <p><strong className="text-muted-foreground">Quantity:</strong> {resource.quantity}</p>
                <p className="flex items-center">
                    {getStatusIcon(resource.status)}
                    <strong className="ml-1 text-muted-foreground">Status:</strong> 
                    <span className={`ml-1 font-semibold ${getStatusColor(resource.status)}`}>{resource.status}</span>
                </p>
                
                <Separator className="my-2"/>
                
                {resource.lastCheckedDate && isValid(parseISO(resource.lastCheckedDate)) && (
                    <p><CalendarDays className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Last Checked:</strong> {format(parseISO(resource.lastCheckedDate), "PPP")}</p>
                )}
                {resource.nextCheckDate && isValid(parseISO(resource.nextCheckDate)) && (
                    <p><Clock className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Next Check:</strong> {format(parseISO(resource.nextCheckDate), "PPP")}</p>
                )}
                
                {resource.notes && (
                    <>
                        <Separator className="my-2"/>
                        <div className="flex items-start">
                            <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
                            <div>
                                <strong className="text-muted-foreground">Notes:</strong>
                                <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{resource.notes}</p>
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
