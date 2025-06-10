
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function IncidentInvestigationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Incident Investigation</h1>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Investigators at a scene" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="investigation team"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h2 className="text-2xl font-semibold text-white font-headline">Learn and Prevent</h2>
                <p className="text-sm text-neutral-300">Thoroughly investigate incidents to prevent recurrence.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module provides tools for conducting detailed incident and accident investigations. 
                Identify root causes, document findings, and manage corrective and preventive actions (CAPA) to enhance safety performance.
            </p>
            <div className="mt-6 p-6 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-lg">Investigation & CAPA Tools</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Key features to be developed:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Guided investigation workflow (e.g., 5 Whys, Fishbone, SCAT).</li>
                    <li>Evidence logging: photo/video uploads, document attachment, witness statement forms.</li>
                    <li>Root Cause Analysis (RCA) toolkit and documentation.</li>
                    <li>Corrective and Preventive Action (CAPA) assignment, tracking, and verification.</li>
                    <li>AI-assisted root cause suggestion based on incident details (potential).</li>
                    <li>Trend analysis of investigation findings and CAPA effectiveness.</li>
                    <li>Investigation report generation.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
