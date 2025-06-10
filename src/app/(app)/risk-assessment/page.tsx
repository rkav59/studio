
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import type { RiskAssessmentMethod } from "@/lib/types";
import { RiskAssessmentAiAssistant } from "@/components/risk-assessment/risk-assessment-ai-assistant";

const riskAssessmentMethods: RiskAssessmentMethod[] = [
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
            Utilize various methodologies and leverage AI assistance for comprehensive analysis.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Common Risk Assessment Methods</CardTitle>
          <CardDescription>Consider these established methodologies for your assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskAssessmentMethods.map((method) => (
              <li key={method} className="p-3 border rounded-md bg-secondary/30 text-sm">
                {method}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <RiskAssessmentAiAssistant />

    </div>
  );
}
