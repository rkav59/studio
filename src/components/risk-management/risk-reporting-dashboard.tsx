
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { likelihoodLevels, severityLevels, getRiskLevel, riskMatrix } from '@/lib/risk-assessment-config';
import type { RiskRegisterEntry, Incident, Severity, Likelihood, RiskLevel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LayoutDashboard, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface RiskReportingDashboardProps {
  riskRegisterEntries: RiskRegisterEntry[];
  incidents: Incident[];
}

// Order for the matrix axes
const severityOrder: Severity[] = ['Insignificant', 'Minor', 'Moderate', 'Serious', 'Catastrophic'];
const likelihoodOrder: Likelihood[] = ['Very Unlikely', 'Unlikely', 'Possible', 'Likely', 'Very Likely'];

function RiskMatrixHeatmap({ data }: { data: RiskRegisterEntry[] }) {
  const matrixData = useMemo(() => {
    const matrix: Record<Severity, Record<Likelihood, number>> = {
      'Insignificant': { 'Very Unlikely': 0, 'Unlikely': 0, 'Possible': 0, 'Likely': 0, 'Very Likely': 0 },
      'Minor': { 'Very Unlikely': 0, 'Unlikely': 0, 'Possible': 0, 'Likely': 0, 'Very Likely': 0 },
      'Moderate': { 'Very Unlikely': 0, 'Unlikely': 0, 'Possible': 0, 'Likely': 0, 'Very Likely': 0 },
      'Serious': { 'Very Unlikely': 0, 'Unlikely': 0, 'Possible': 0, 'Likely': 0, 'Very Likely': 0 },
      'Catastrophic': { 'Very Unlikely': 0, 'Unlikely': 0, 'Possible': 0, 'Likely': 0, 'Very Likely': 0 },
    };

    data.forEach(entry => {
      const likelihood = entry.residualLikelihood || entry.initialLikelihood;
      const severity = entry.residualSeverity || entry.initialSeverity;
      if (likelihood && severity) {
        matrix[severity][likelihood]++;
      }
    });

    return matrix;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Matrix (Heatmap)</CardTitle>
        <CardDescription>Distribution of risks based on their residual (or initial) likelihood and severity.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="border text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="border-r font-bold text-muted-foreground p-2">Severity</TableHead>
                {likelihoodOrder.map(l => <TableHead key={l} className="text-center p-2 font-semibold">{l}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {severityOrder.slice().reverse().map(s => (
                <TableRow key={s}>
                  <TableCell className="font-bold border-r p-2 text-muted-foreground">{s}</TableCell>
                  {likelihoodOrder.map(l => {
                    const count = matrixData[s][l];
                    const riskLevel = getRiskLevel(likelihoodLevels[l], severityLevels[s]);
                    const colorClass = riskMatrix[riskLevel].color;
                    return (
                      <TableCell key={`${s}-${l}`} className={cn("text-center font-bold text-lg p-2 h-14 w-24", count > 0 ? colorClass : 'bg-background')}>
                        {count > 0 ? count : ''}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


const incidentTypeChartConfig = {
  incidents: {
    label: "Incidents",
    color: "hsl(var(--destructive))",
    icon: AlertTriangle,
  },
  nearMisses: {
    label: "Near Misses",
    color: "hsl(var(--chart-5))",
    icon: ShieldAlert,
  },
  hazards: {
    label: "Hazards",
    color: "hsl(var(--chart-1))",
    icon: Info,
  },
} satisfies ChartConfig;

function IncidentsByTypeChart({ data }: { data: Incident[] }) {
  const chartData = useMemo(() => {
    const counts = {
      incidents: 0,
      nearMisses: 0,
      hazards: 0,
    };
    data.forEach(incident => {
      if (incident.type === 'Incident') counts.incidents++;
      else if (incident.type === 'Near Miss') counts.nearMisses++;
      else if (incident.type === 'Hazard') counts.hazards++;
    });
    return [counts];
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Breakdown by Type</CardTitle>
        <CardDescription>Total count of incidents, near misses, and hazards logged.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={incidentTypeChartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 20 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey={() => ""}
                type="category"
                tick={false}
                axisLine={false}
              />
              <XAxis type="number" hide />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={<ChartTooltipContent indicator="line" hideLabel />}
              />
              <Legend />
              <Bar dataKey="incidents" name="Incidents" fill="var(--color-incidents)" radius={4} />
              <Bar dataKey="nearMisses" name="Near Misses" fill="var(--color-nearMisses)" radius={4} />
              <Bar dataKey="hazards" name="Hazards" fill="var(--color-hazards)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


export function RiskReportingDashboard({ riskRegisterEntries, incidents }: RiskReportingDashboardProps) {
  return (
    <Card id="risk-reporting-dashboard" className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          Risk Reporting Dashboard
        </CardTitle>
        <CardDescription>
          A high-level overview of the organization's risk profile and incident trends.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskMatrixHeatmap data={riskRegisterEntries} />
        <IncidentsByTypeChart data={incidents} />
      </CardContent>
    </Card>
  );
}
