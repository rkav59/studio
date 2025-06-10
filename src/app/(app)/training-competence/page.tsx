
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function TrainingCompetencePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Training & Competence</h1>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Training session in progress" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="classroom training"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h2 className="text-2xl font-semibold text-white font-headline">Develop Your Workforce</h2>
                <p className="text-sm text-neutral-300">Manage training programs and track employee competence effectively.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module allows you to organize training programs, record attendance, track certifications, and manage competency assessments. 
                Ensure your workforce has the necessary skills and knowledge for a safe and productive environment.
            </p>
            <div className="mt-6 p-6 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-lg">Training Management Features</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Future capabilities will include:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Training needs analysis and skills gap identification.</li>
                    <li>Course catalog management with content hosting.</li>
                    <li>Employee training records and digital certifications.</li>
                    <li>Scheduling, enrollment, and attendance tracking.</li>
                    <li>Automated reminders for refresher training and expiring certifications.</li>
                    <li>Competency assessment frameworks and tracking.</li>
                    <li>Reporting on training compliance and effectiveness.</li>
                    <li>Integration with e-learning platforms (potential).</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
