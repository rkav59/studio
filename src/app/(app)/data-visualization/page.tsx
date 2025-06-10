"use client";

import { IncidentCharts } from "@/components/data-visualization/incident-charts";
import type { Incident } from "@/lib/types";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


// Mock data for demonstration
const mockIncidents: Incident[] = [
  { id: "1", type: "Incident", description: "Forklift collision", location: "Warehouse A", timestamp: new Date().toISOString(), region: "North"},
  { id: "2", type: "Near Miss", description: "Employee almost tripped", location: "Corridor B", timestamp: new Date().toISOString(), region: "North"},
  { id: "3", type: "Hazard", description: "Spill on floor", location: "Production Line 1", timestamp: new Date().toISOString(), region: "South"},
];

export default function DataVisualizationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Data Visualization</h1>
        {/* Add filters or date range pickers here */}
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x300.png" 
                alt="Data analytics banner" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="data charts" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h2 className="text-2xl font-semibold text-white font-headline">Safety Insights</h2>
                <p className="text-sm text-neutral-300">Visualizing trends to improve workplace safety.</p>
            </div>
        </div>
      </Card>
      
      <IncidentCharts incidents={mockIncidents} />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Further Analysis (Placeholder)</CardTitle>
          <CardDescription>More charts and data points would go here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section could include heatmaps of incident locations, root cause analysis charts,
            or comparisons across different regions or time periods.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold">Location Heatmap</h3>
                <p className="text-sm text-muted-foreground">Visualize incident hotspots.</p>
                 <div className="mt-2 h-40 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground" data-ai-hint="map placeholder">
                    (Heatmap Placeholder)
                </div>
            </div>
            <div className="p-4 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold">Corrective Actions Tracking</h3>
                <p className="text-sm text-muted-foreground">Monitor progress on safety improvements.</p>
                <div className="mt-2 h-40 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground" data-ai-hint="progress chart">
                    (Tracking Chart Placeholder)
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
