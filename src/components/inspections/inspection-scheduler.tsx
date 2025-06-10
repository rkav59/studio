"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import type { Inspection, InspectionChecklistItem } from "@/lib/types";
import { PlusCircle, CalendarDays, ListChecks, Edit2, PlayCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";


interface InspectionSchedulerProps {
  scheduledInspections: Inspection[];
  onScheduleInspection: (inspection: Omit<Inspection, 'id' | 'status' | 'checklist' | 'findings'>) => void;
  onStartInspection: (inspection: Inspection) => void;
}

export function InspectionScheduler({ scheduledInspections, onScheduleInspection, onStartInspection }: InspectionSchedulerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInspectionName, setNewInspectionName] = useState("");
  const [newInspectionDate, setNewInspectionDate] = useState("");
  const [newInspectionLocation, setNewInspectionLocation] = useState("");
  const { toast } = useToast();


  const handleSchedule = () => {
    if (newInspectionName && newInspectionDate && newInspectionLocation) {
      onScheduleInspection({ 
        name: newInspectionName, 
        scheduledDate: new Date(newInspectionDate).toISOString(),
        location: newInspectionLocation,
      });
      setNewInspectionName("");
      setNewInspectionDate("");
      setNewInspectionLocation("");
      setIsModalOpen(false);
      toast({ title: "Inspection Scheduled", description: `${newInspectionName} scheduled for ${format(new Date(newInspectionDate), "PPP")}.`});
    } else {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive"});
    }
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Scheduled Inspections</CardTitle>
            <CardDescription>Manage and view upcoming safety inspections.</CardDescription>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" /> Schedule New
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Schedule New Inspection</DialogTitle>
                <DialogDescription>
                    Enter the details for the new inspection.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={newInspectionName} onChange={(e) => setNewInspectionName(e.target.value)} className="col-span-3" placeholder="e.g., Quarterly Fire Drill" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">Location</Label>
                        <Input id="location" value={newInspectionLocation} onChange={(e) => setNewInspectionLocation(e.target.value)} className="col-span-3" placeholder="e.g., Main Factory Floor" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Input id="date" type="date" value={newInspectionDate} onChange={(e) => setNewInspectionDate(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                <Button type="button" onClick={handleSchedule} className="bg-accent hover:bg-accent/90 text-accent-foreground">Schedule</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </CardHeader>
      <CardContent>
        {scheduledInspections.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No inspections scheduled yet.</p>
        ) : (
          <ul className="space-y-4">
            {scheduledInspections.map((inspection) => (
              <li key={inspection.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-grow mb-2 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{inspection.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3"/> {format(new Date(inspection.scheduledDate), "PPP")} - {inspection.location}
                  </p>
                  <p className="text-xs text-muted-foreground">Status: {inspection.status}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast({title: "Edit Inspection", description: "Edit functionality placeholder."})}>
                        <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="default" size="sm" onClick={() => onStartInspection(inspection)} className="bg-primary hover:bg-primary/90">
                        <PlayCircle className="h-3 w-3 mr-1" /> Start
                    </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
