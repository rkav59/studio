
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskAssessmentSuggestionForm } from "@/components/risk-management/risk-assessment-suggestion-form";
import { ArrowLeft, ShieldQuestion } from "lucide-react";

export default function AiRiskAssessmentSuggestionPage() {
  const router = useRouter();

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
      <RiskAssessmentSuggestionForm /> {/* Render the form directly */}
    </div>
  );
}
    