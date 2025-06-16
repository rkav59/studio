
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestigationForm, type InvestigationFormValues } from "@/components/incident-investigation/investigation-form";
import type { IncidentInvestigation } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const INVESTIGATIONS_STORAGE_KEY_RMH = 'sheild-incident-investigations-v1'; // Use consistent key

export default function NewRiskManagementHubInvestigationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSaveNewInvestigation = (formData: InvestigationFormValues) => {
    console.log("NewInvestigationPage (RMH): handleSaveNewInvestigation triggered with data:", formData); 
    try {
      const storedInvestigations = localStorage.getItem(INVESTIGATIONS_STORAGE_KEY_RMH);
      const investigations: IncidentInvestigation[] = storedInvestigations ? JSON.parse(storedInvestigations) : [];
      
      const newInvestigation: IncidentInvestigation = {
        id: crypto.randomUUID(),
        incidentId: formData.incidentId,
        investigationTitle: formData.investigationTitle,
        investigationDate: formData.investigationDate.toISOString(),
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
          dueDate: parseISO(ca.dueDate).toISOString(),
          completionDate: ca.completionDate ? parseISO(ca.completionDate).toISOString() : undefined,
        })),
        status: formData.status,
      };

      investigations.unshift(newInvestigation);
      localStorage.setItem(INVESTIGATIONS_STORAGE_KEY_RMH, JSON.stringify(investigations));
      
      toast({ 
        title: "Investigation Created", 
        description: `New investigation "${newInvestigation.investigationTitle}" has been successfully created.` 
      });
      router.push('/risk-management-hub?tab=investigations'); // Navigate back to the hub, investigations tab
    } catch (error) {
      console.error("Error saving new investigation (RMH):", error);
      toast({ 
        title: "Error Saving Investigation", 
        description: "Could not save the new investigation. Please check console for details.", 
        variant: "destructive" 
      });
    }
  };

  const handleCancelNewInvestigation = () => {
    router.push('/risk-management-hub?tab=investigations'); // Navigate back to the hub, investigations tab
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card className="shadow-lg flex-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Start New Incident Investigation</CardTitle>
          <CardDescription>Fill in the details below to document a new incident investigation. This will be part of the Risk Management Hub.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <InvestigationForm
            onSave={handleSaveNewInvestigation}
            onCancel={handleCancelNewInvestigation}
          />
        </CardContent>
      </Card>
    </div>
  );
}
    