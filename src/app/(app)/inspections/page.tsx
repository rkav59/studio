"use client";

import { useState } from 'react';
import { InspectionScheduler } from "@/components/inspections/inspection-scheduler";
import { InspectionForm } from "@/components/inspections/inspection-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Inspection, InspectionChecklistItem } from "@/lib/types";
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const defaultChecklist: InspectionChecklistItem[] = [
  { id: "item-1", text: "Are emergency exits clear and accessible?", completed: false },
  { id: "item-2", text: "Are fire extinguishers in place and charged?", completed: false },
  { id: "item-3", text: "Is PPE being used correctly?", completed: false },
];


export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);

  const handleScheduleInspection = (newInspectionData: Omit<Inspection, 'id' | 'status' | 'checklist' | 'findings'>) => {
    const newInspection: Inspection = {
      id: new Date().toISOString(), // Simple ID
      ...newInspectionData,
      status: "Pending",
      checklist: defaultChecklist.map(item => ({...item, id: `${item.id}-${Date.now()}`})), // Unique IDs for checklist items
    };
    setInspections(prev => [newInspection, ...prev]);
  };

  const handleStartInspection = (inspection: Inspection) => {
    setCurrentInspection(inspection);
  };

  const handleInspectionCompleted = (completedInspection: Inspection) => {
    setInspections(prev => 
      prev.map(insp => insp.id === completedInspection.id ? { ...completedInspection, status: "Completed" } : insp)
    );
    setCurrentInspection(null); // Clear current inspection form
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Safety Inspections</h1>
      </div>
      
      {!currentInspection ? (
        <InspectionScheduler 
          scheduledInspections={inspections} 
          onScheduleInspection={handleScheduleInspection}
          onStartInspection={handleStartInspection}
        />
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Conduct Inspection: {currentInspection.name}</CardTitle>
            <CardDescription>
              Complete the checklist and record any findings for the inspection at {currentInspection.location}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InspectionForm 
              inspection={currentInspection}
              onInspectionCompleted={handleInspectionCompleted} 
            />
             <Button variant="outline" onClick={() => setCurrentInspection(null)} className="mt-4">
              Back to Scheduled Inspections
            </Button>
          </CardContent>
        </Card>
      )}

      {inspections.filter(insp => insp.status === "Completed").length > 0 && !currentInspection && (
        <>
          <Separator className="my-8" />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Completed Inspections</CardTitle>
              <CardDescription>Recently completed inspections (session only).</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {inspections.filter(insp => insp.status === "Completed").slice(0,3).map(insp => (
                  <li key={insp.id} className="p-3 border rounded-md bg-secondary/30">
                    <p className="font-medium">{insp.name} - {insp.location}</p>
                    <p className="text-xs text-muted-foreground">Completed: {insp.scheduledDate ? new Date(insp.scheduledDate).toLocaleDateString() : 'N/A'}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {!currentInspection && (
        <Card className="mt-6 shadow-lg">
            <CardHeader>
                <CardTitle>Inspection Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 items-center">
                <div className="md:w-2/3 space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Regular inspections are key to maintaining a safe working environment. Ensure you are thorough, document everything, and follow up on any corrective actions.
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Be observant and systematic.</li>
                        <li>Use a comprehensive checklist.</li>
                        <li>Engage with employees during the inspection.</li>
                        <li>Prioritize and track corrective actions.</li>
                    </ul>
                </div>
                <div className="md:w-1/3 h-40 relative rounded-lg overflow-hidden">
                    <Image 
                        src="https://placehold.co/400x300.png" 
                        alt="Person conducting inspection" 
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="safety inspection"
                    />
                </div>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
