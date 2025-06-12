
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestigationForm, type InvestigationFormValues } from "@/components/incident-investigation/investigation-form";
import type { IncidentInvestigation } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const INVESTIGATIONS_STORAGE_KEY = 'sheild-incident-investigations-v1';

export default function NewIncidentInvestigationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSaveNewInvestigation = (formData: InvestigationFormValues) => {
    try {
      const storedInvestigations = localStorage.getItem(INVESTIGATIONS_STORAGE_KEY);
      const investigations: IncidentInvestigation[] = storedInvestigations ? JSON.parse(storedInvestigations) : [];
      
      const newInvestigation: IncidentInvestigation = {
        id: crypto.randomUUID(),
        incidentId: formData.incidentId,
        investigationTitle: formData.investigationTitle,
        investigationDate: formData.investigationDate.toISOString(), // Convert Date to ISO string
        investigators: formData.investigators,
        techniqueUsed: formData.techniqueUsed,
        fiveWhysDetails: formData.fiveWhysDetails,
        fishboneCategories: formData.fishboneCategories,
        scatDetails: formData.scatDetails,
        genericRcaDetails: formData.genericRcaDetails,
        evidenceSummary: formData.evidenceSummary,
        witnessStatementsSummary: formData.witnessStatementsSummary,
        summaryOfFindings: formData.summaryOfFindings,
        correctiveActions: formData.correctiveActions.map(ca => ({
          ...ca,
          dueDate: parseISO(ca.dueDate).toISOString(), // Ensure dueDate is ISO string
          completionDate: ca.completionDate ? parseISO(ca.completionDate).toISOString() : undefined, // Ensure completionDate is ISO string
        })),
        status: formData.status,
      };

      investigations.unshift(newInvestigation); // Add to the beginning for visibility
      localStorage.setItem(INVESTIGATIONS_STORAGE_KEY, JSON.stringify(investigations));
      
      toast({ 
        title: "Investigation Created", 
        description: `New investigation "${newInvestigation.investigationTitle}" has been successfully created.` 
      });
      router.push('/incident-investigation');
    } catch (error) {
      console.error("Error saving new investigation:", error);
      toast({ 
        title: "Error Saving Investigation", 
        description: "Could not save the new investigation. Please check console for details.", 
        variant: "destructive" 
      });
    }
  };

  const handleCancelNewInvestigation = () => {
    router.push('/incident-investigation');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Start New Incident Investigation</CardTitle>
          <CardDescription>Fill in the details below to document a new incident investigation. All data is saved locally in your browser.</CardDescription>
        </CardHeader>
        <CardContent className="p-0"> {/* Remove CardContent padding as form handles its own */}
          <InvestigationForm
            onSave={handleSaveNewInvestigation}
            onCancel={handleCancelNewInvestigation}
            // No initialData is passed, so the form knows it's for a new entry
          />
        </CardContent>
      </Card>
    </div>
  );
}
