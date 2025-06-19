
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Added Card and CardContent
import { RiskAssessmentSuggestionForm } from "@/components/risk-management/risk-assessment-suggestion-form";
import { ArrowLeft, ShieldQuestion } from "lucide-react";
import type { RiskAssessmentSuggestionOutput } from '@/lib/types'; // Added type import
import { useState } from 'react'; // Added useState

export default function AiRiskAssessmentSuggestionPage() {
  const router = useRouter();
  const [generatedSuggestions, setGeneratedSuggestions] = useState<RiskAssessmentSuggestionOutput | null>(null);

  const handleSuggestionsGenerated = (suggestions: RiskAssessmentSuggestionOutput) => {
    setGeneratedSuggestions(suggestions);
  };

  const handleUseForRiskAssessment = () => {
    if (generatedSuggestions) {
      localStorage.setItem('aiPotentialRisksForRiskAssessment', generatedSuggestions.potentialRisks);
      
      const controlsString = Object.entries(generatedSuggestions.recommendedControls)
        .filter(([, measures]) => measures && measures.length > 0) // Ensure measures is not undefined/empty array
        .map(([category, measures]) => 
          `${category.charAt(0).toUpperCase() + category.slice(1)} Controls:\n- ${(measures as string[]).join('\n- ')}`
        )
        .join('\n\n');
      localStorage.setItem('aiRecommendedControlsForRiskAssessment', controlsString);
      
      // The suggestedMethod can be displayed or logged but not directly pre-filled into the current ManualRiskAssessmentForm easily.
      // Consider storing it if a future form field can accommodate it, or display it to the user on this page.
      // For now, we primarily transfer risks and controls.
      
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
          <ShieldQuestion className="h-6 w-6 text-blue-500" /> AI Risk Assessment Assist
        </h1>
      </div>
      <RiskAssessmentSuggestionForm onSuggestionsGenerated={handleSuggestionsGenerated} />

      {generatedSuggestions && (
        <Card className="mt-6">
          <CardContent className="pt-6 flex flex-col sm:flex-row gap-2">
            <Button onClick={handleUseForRiskAssessment} variant="outline" className="w-full sm:w-auto">
              Use Suggestions for New Manual Risk Assessment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
