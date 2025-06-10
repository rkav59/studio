"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { Incident } from "@/lib/types";

interface IncidentChartsProps {
  incidents: Incident[]; // In a real app, this data would be fetched or passed down
}

// Example: Incidents per month
const MOCK_MONTHLY_DATA = [
  { month: "Jan", incidents: 4, nearMisses: 2, hazards: 1 },
  { month: "Feb", incidents: 3, nearMisses: 5, hazards: 2 },
  { month: "Mar", incidents: 5, nearMisses: 3, hazards: 0 },
  { month: "Apr", incidents: 7, nearMisses: 4, hazards: 3 },
  { month: "May", incidents: 6, nearMisses: 2, hazards: 1 },
  { month: "Jun", incidents: 8, nearMisses: 5, hazards: 4 },
];

const chartConfig: ChartConfig = {
  incidents: {
    label: "Incidents",
    color: "hsl(var(--chart-1))",
  },
  nearMisses: {
    label: "Near Misses",
    color: "hsl(var(--chart-2))",
  },
  hazards: {
    label: "Hazards",
    color: "hsl(var(--chart-3))",
  },
};

const MOCK_INCIDENT_BY_TYPE_DATA = [
    { type: "Incident", count: 25, fill: "hsl(var(--chart-1))" },
    { type: "Near Miss", count: 40, fill: "hsl(var(--chart-2))" },
    { type: "Hazard", count: 15, fill: "hsl(var(--chart-3))" },
];


export function IncidentCharts({ incidents }: IncidentChartsProps) {
  // Basic processing for charts - this would be more complex in a real app
  const incidentsByType = MOCK_INCIDENT_BY_TYPE_DATA; // Use mock data for now

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Incidents by Type</CardTitle>
          <CardDescription>Distribution of occurrences by their type.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentsByType} layout="vertical" margin={{ right: 20 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" radius={5} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Incidents, near misses, and hazards over the past 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_MONTHLY_DATA} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="incidents" stroke="var(--color-incidents)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="nearMisses" stroke="var(--color-nearMisses)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="hazards" stroke="var(--color-hazards)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
