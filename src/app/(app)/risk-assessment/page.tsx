
"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ShieldAlert, ListChecks, CheckSquare } from 'lucide-react';

import type { RiskAssessment, RiskAssessmentMethod } from "@/lib/types";
import { RiskAssessmentAiAssistant } from "@/components/risk-assessment/risk-assessment-ai-assistant";
import { RiskAssessmentForm } from '@/components/risk-assessment/risk-assessment-form';

export const riskAssessmentMethodsList: RiskAssessmentMethod[] = [
  "Job Safety Analysis (JSA)",
  "Hazard Identification (HAZID)",
  "Hazard and Operability Study (HAZOP)",
  "Failure Mode and Effects Analysis (FMEA)",
  "Fault Tree Analysis (FTA)",
  "Bowtie Analysis",
  "What-If Analysis",
  "Preliminary Hazard Analysis (PHA)",
];

export default function RiskAssessmentPage() {
  const [loggedRiskAssessments, setLoggedRiskAssessments] = useState<RiskAssessment[]>([]);

  const handleRiskAssessmentLogged = (assessment: RiskAssessment) => {
    setLoggedRiskAssessments(prevAssessments => [assessment, ...prevAssessments]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Risk Assessment</h1>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image
            src="https://placehold.co/1200x400.png"
            alt="Risk assessment process"
            layout="fill"
            objectFit="cover"
            data-ai-hint="risk analysis"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h2 className="text-2xl font-semibold text-white font-headline">Identify and Mitigate Risks</h2>
            <p className="text-sm text-neutral-300">Systematically evaluate workplace hazards and implement effective controls.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module helps you conduct thorough risk assessments to ensure a safe working environment. 
            Utilize various methodologies, log your findings, and leverage AI assistance for comprehensive analysis.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            Log New Risk Assessment
          </CardTitle>
          <CardDescription>
            Fill out the form below to document a new risk assessment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RiskAssessmentForm 
            onRiskAssessmentLogged={handleRiskAssessmentLogged} 
            assessmentMethods={riskAssessmentMethodsList}
          />
        </CardContent>
      </Card>
      
      {loggedRiskAssessments.length > 0 && (
        <>
          <Separator className="my-8" />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-6 w-6 text-primary" />
                Recently Logged Risk Assessments
              </CardTitle>
              <CardDescription>This list is for demonstration and will reset on page refresh.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {loggedRiskAssessments.slice(0, 3).map((assessment) => (
                  <li key={assessment.id} className="p-4 border rounded-md bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-primary">{assessment.activity}</h3>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(assessment.assessmentDate), "PPP")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium">Method:</span> {assessment.methodUsed || 'N/A'} | <span className="font-medium">Assessor:</span> {assessment.assessor}
                    </p>
                     <p className="mt-1 text-sm">
                      <span className="font-medium">Residual Risk:</span> 
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${assessment.residualRiskLevel === 'Low' ? 'bg-green-100 text-green-700' : ''}
                        ${assessment.residualRiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${assessment.residualRiskLevel === 'High' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        {assessment.residualRiskLevel}
                      </span>
                    </p>
                    <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-primary">View Details</summary>
                        <div className="mt-2 space-y-1 pl-2 border-l-2 border-border ml-1">
                            <p><span className="font-semibold">Identified Hazards:</span> {assessment.identifiedHazards}</p>
                            <p><span className="font-semibold">Assessed Risks:</span> {assessment.assessedRisks}</p>
                            <p><span className="font-semibold">Control Measures:</span> {assessment.controlMeasures}</p>
                        </div>
                    </details>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      <RiskAssessmentAiAssistant />

      <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <ShieldAlert className="h-6 w-6 text-primary"/>
            Common Risk Assessment Methods
          </CardTitle>
          <CardDescription>Consider these established methodologies for your assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskAssessmentMethodsList.map((method) => (
              <li key={method} className="p-3 border rounded-md bg-secondary/30 text-sm hover:shadow-sm transition-shadow">
                {method}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

    </div>
  );
}
