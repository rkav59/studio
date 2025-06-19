
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
import type { Incident } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { Megaphone, CalendarDays, MapPin, User, TypeRows, ShieldAlert, Briefcase, LinkIcon, Activity, BarChart3, Info, AlertTriangle, CheckSquare, XCircle } from "lucide-react";

interface IncidentDetailsDialogProps {
  incident: Incident;
  onClose: () => void;
}

export function IncidentDetailsDialog({ incident, onClose }: IncidentDetailsDialogProps) {

  const getIncidentStatusColor = (status?: Incident['status']) => {
    switch (status) {
      case 'Open': return 'text-blue-600 dark:text-blue-400';
      case 'Under Investigation': return 'text-yellow-600 dark:text-yellow-400';
      case 'Actions Pending': return 'text-orange-500 dark:text-orange-400';
      case 'Closed': return 'text-green-600 dark:text-green-400';
      default: return 'text-muted-foreground';
    }
  };
  
  const getIncidentTypeIcon = (type: Incident['type']) => {
    switch (type) {
      case 'Incident': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'Near Miss': return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
      case 'Hazard': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Megaphone className="h-5 w-5 text-muted-foreground"/>;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            {getIncidentTypeIcon(incident.type)} {incident.type} Details
          </DialogTitle>
          <DialogDescription>
            Detailed information for the logged event.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <section>
                    <h3 className="text-md font-semibold mb-1 border-b pb-1">Event Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
                        <p><strong className="text-muted-foreground">Type:</strong> {incident.type}</p>
                        <p><CalendarDays className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Date & Time:</strong> {format(parseISO(incident.timestamp), "PPPp")}</p>
                        <p className="md:col-span-2"><MapPin className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Location:</strong> {incident.location}</p>
                        <p><strong className="text-muted-foreground">Region/Dept:</strong> {incident.region}</p>
                        {incident.reportedBy && <p><User className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Reported By:</strong> {incident.reportedBy}</p>}
                    </div>
                     <div className="mt-2">
                        <strong className="text-muted-foreground">Description:</strong>
                        <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{incident.description}</p>
                    </div>
                </section>

                <Separator/>
                
                <section>
                    <h3 className="text-md font-semibold mb-1 border-b pb-1">Classification & Impact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
                        {incident.classification && <p><Briefcase className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Classification:</strong> {incident.classification}</p>}
                        {incident.severityLevel && <p><BarChart3 className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Severity:</strong> {incident.severityLevel}</p>}
                         <p className="flex items-center gap-1">{incident.isRecordable ? <CheckSquare className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-muted-foreground"/>} Recordable (OSHA/Local)</p>
                         <p className="flex items-center gap-1">{incident.isFatality ? <AlertTriangle className="h-4 w-4 text-red-500"/> : <CheckSquare className="h-4 w-4 text-muted-foreground"/>} Fatality Occurred</p>
                        {incident.lostWorkDays !== undefined && incident.lostWorkDays > 0 && <p><strong className="text-muted-foreground">Lost Work Days:</strong> {incident.lostWorkDays}</p>}
                    </div>
                </section>
                
                <Separator/>

                <section>
                    <h3 className="text-md font-semibold mb-1 border-b pb-1">Status & Follow-up</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
                        <p className="flex items-center gap-1"><Activity className="h-4 w-4 text-muted-foreground" /><strong>Status:</strong> <span className={`font-semibold ${getIncidentStatusColor(incident.status)}`}>{incident.status || 'N/A'}</span></p>
                        <p className="flex items-center gap-1">{incident.rootCauseAnalyzed ? <CheckSquare className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-muted-foreground"/>} Root Cause Analysis Done</p>
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
