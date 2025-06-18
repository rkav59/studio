
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HazardIdentificationForm } from "@/components/risk-management/hazard-identification-form";
import { RiskAssessmentSuggestionForm } from "@/components/risk-management/risk-assessment-suggestion-form";
import { AlertTriangle, ListChecks, ShieldAlert, Activity, Settings } from "lucide-react";

export default function RiskManagementPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image
            src="https://placehold.co/1200x400.png"
            alt="Risk matrix and safety gear"
            layout="fill"
            objectFit="cover"
            data-ai-hint="risk assessment safety"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Risk Management</h1>
            <p className="text-sm text-neutral-300">Proactively identify, assess, evaluate, and control risks.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module provides tools to support your risk management lifecycle, from identifying hazards to monitoring controls. 
            Leverage AI to assist in hazard identification and risk assessment.
          </p>
        </CardContent>
      </Card>

      <HazardIdentificationForm />

      <RiskAssessmentSuggestionForm />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            Risk Registers (Future Development)
          </CardTitle>
          <CardDescription>
            A centralized location to document and track all identified risks, their assessments, and control measures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Future enhancements will include features for:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
            <li>Creating and managing detailed risk registers linked to specific activities, projects, or areas.</li>
            <li>Assigning risk owners and tracking review dates.</li>
            <li>Generating risk matrices and heatmaps based on registered data.</li>
            <li>Linking risks to incidents, audits, and corrective actions.</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-yellow-500" />
              Risk Evaluation (Future Development)
            </CardTitle>
            <CardDescription>
              Tools and methodologies for evaluating the significance of identified risks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will provide capabilities for:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
              <li>Applying qualitative and quantitative risk evaluation techniques.</li>
              <li>Comparing risks against defined criteria and tolerance levels.</li>
              <li>Prioritizing risks for control action.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-green-500" />
              Risk Control & Monitoring (Future Development)
            </CardTitle>
            <CardDescription>
              Track the implementation and effectiveness of risk control measures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Planned features include:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
              <li>Documenting and assigning ownership for risk control actions.</li>
              <li>Monitoring the status and effectiveness of implemented controls.</li>
              <li>Setting up review cycles for control measures.</li>
              <li>Integrating with other modules for verification (e.g., inspections, audits).</li>
            </ul>
          </CardContent>
        </Card>
      </div>
       <Card className="mt-8">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-muted-foreground" />Module Configuration & Expansion</CardTitle>
        </CardHeader>
        <CardContent>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Full CRUD (Create, Read, Update, Delete) operations for risk assessments stored in Firestore.</li>
                    <li>Integration with Checklist Templates for risk-based auditing.</li>
                    <li>AI-powered root cause analysis suggestions for high-risk events.</li>
                    <li>Customizable risk matrices and reporting dashboards.</li>
                </ul>
        </CardContent>
      </Card>
    </div>
  );
}
