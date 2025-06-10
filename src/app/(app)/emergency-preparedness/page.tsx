
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function EmergencyPreparednessPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Emergency Preparedness</h1>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Emergency evacuation drill" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="emergency drill"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h2 className="text-2xl font-semibold text-white font-headline">Plan, Respond, Recover</h2>
                <p className="text-sm text-neutral-300">Develop robust emergency plans and ensure readiness.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module assists in creating and managing emergency preparedness plans, including evacuation routes, response procedures, and communication protocols. 
                Facilitate and document mock drills to test and improve your organization's readiness.
            </p>
            {/* Placeholder for emergency planning tools */}
             <div className="mt-6 p-6 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-lg">Preparedness Tools</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Planned features include:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Evacuation plan designer (visual tool).</li>
                    <li>Emergency contact list management.</li>
                    <li>Mock drill scheduling and documentation.</li>
                    <li>Post-drill review and action tracking.</li>
                    <li>AI-assisted scenario generation for drills.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
