
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { HazardIdentificationForm } from "@/components/risk-management/hazard-identification-form";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useState } from "react"; // Added useState
import { Card, CardContent } from "@/components/ui/card"; // Added Card imports

export default function AiHazardIdentificationPage() {
  const router = useRouter();
  const [generatedHazards, setGeneratedHazards] = useState<string | null>(null);

  const handleSuggestionsGenerated = (suggestions: string) => {
    setGeneratedHazards(suggestions);
  };

  const handleUseForManualHazard = () => {
    if (generatedHazards) {
      localStorage.setItem('aiHazardSuggestionsForManualHazard', generatedHazards);
      router.push('/risk-management/hazards/new');
    }
  };

  const handleUseForRiskAssessment = () => {
    if (generatedHazards) {
      localStorage.setItem('aiHazardSuggestionsForRiskAssessment', generatedHazards);
      router.push('/risk-management/assessments/new');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/risk-management')} aria-label="Back to Risk Management">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-500" /> AI Hazard Identification
        </h1>
      </div>
      <HazardIdentificationForm onSuggestionsGenerated={handleSuggestionsGenerated} />

      {generatedHazards && (
        <Card className="mt-6">
          <CardContent className="pt-6 flex flex-col sm:flex-row gap-2">
            <Button onClick={handleUseForManualHazard} variant="outline" className="w-full sm:w-auto">
              Use Suggestions for New Manual Hazard Log
            </Button>
            <Button onClick={handleUseForRiskAssessment} variant="outline" className="w-full sm:w-auto">
              Use Suggestions for New Risk Assessment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
