
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function HealthMonitoringPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Health Monitoring System</h1>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Health data charts and graphs" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="health dashboard"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h2 className="text-2xl font-semibold text-white font-headline">Monitor Occupational Health</h2>
                <p className="text-sm text-neutral-300">Track key health indicators and exposure data.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module is designed for maintaining a comprehensive health monitoring system. 
                Record and analyze data related to occupational health surveillance, exposure monitoring (e.g., noise, dust, chemicals), and employee wellness programs.
            </p>
            {/* Placeholder for health monitoring tools */}
            <div className="mt-6 p-6 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-lg">Occupational Health Surveillance</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Future capabilities will include:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Exposure group management and risk profiling.</li>
                    <li>Logging of industrial hygiene sampling data.</li>
                    <li>Audiometry, spirometry, and other test result tracking.</li>
                    <li>Trend analysis of health data to identify emerging issues.</li>
                    <li>Integration with wearable technology (potential).</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
