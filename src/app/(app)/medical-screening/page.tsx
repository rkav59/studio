
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function MedicalScreeningPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Medical Screening</h1>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Doctor conducting medical screening" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="health checkup"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h2 className="text-2xl font-semibold text-white font-headline">Proactive Health Management</h2>
                <p className="text-sm text-neutral-300">Track and manage employee medical screenings.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module helps in scheduling, recording, and managing employee medical screenings. 
                Keep track of common screening diseases, fitness-to-work certifications, and health surveillance data.
            </p>
            {/* Placeholder for medical screening tools */}
            <div className="mt-6 p-6 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-lg">Screening & Surveillance Tools</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Key features under development:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Scheduling of pre-employment, periodic, and exit medicals.</li>
                    <li>Secure storage of medical records and results.</li>
                    <li>Tracking of common occupational diseases and exposure groups.</li>
                    <li>Fitness-to-work certificate management.</li>
                    <li>Confidential reporting and trend analysis (aggregate data).</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
