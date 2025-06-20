
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Original actual data
const ACTUAL_DATA = [
  { month: "Jan", incidents: 5, nearMisses: 8 },
  { month: "Feb", incidents: 3, nearMisses: 6 },
  { month: "Mar", incidents: 6, nearMisses: 9 },
  { month: "Apr", incidents: 4, nearMisses: 5 },
  { month: "May", incidents: 7, nearMisses: 10 },
  { month: "Jun", incidents: 5, nearMisses: 7 },
];

// Projected data points
const PROJECTED_POINTS = [
  { month: "Jul", projectedIncidents: 4, projectedNearMisses: 8 },
  { month: "Aug", projectedIncidents: 3, projectedNearMisses: 9 },
];

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

const chartData = ALL_MONTHS.map(month => {
  const actualMonthData = ACTUAL_DATA.find(d => d.month === month);
  const projectedMonthData = PROJECTED_POINTS.find(d => d.month === month);

  let pInc = null;
  let pNM = null;

  if (month === "Jun" && actualMonthData) {
    pInc = actualMonthData.incidents;
    pNM = actualMonthData.nearMisses;
  } else if (projectedMonthData) {
    pInc = projectedMonthData.projectedIncidents;
    pNM = projectedMonthData.projectedNearMisses;
  }

  return {
    month,
    incidents: actualMonthData?.incidents ?? null,
    nearMisses: actualMonthData?.nearMisses ?? null,
    projectedIncidents: pInc,
    projectedNearMisses: pNM,
  };
});


const chartConfig = {
  incidents: {
    label: "Total Incidents",
    color: "hsl(var(--chart-1))",
  },
  nearMisses: {
    label: "Near Misses",
    color: "hsl(var(--chart-2))",
  },
  projectedIncidents: {
    label: "Projected Incidents",
    color: "hsl(var(--chart-1))", 
    icon: TrendingDown,
  },
  projectedNearMisses: {
    label: "Projected Near Misses",
    color: "hsl(var(--chart-2))", 
    icon: TrendingUp,
  }
} satisfies ChartConfig;

type VisibleKpiKeys = keyof typeof chartConfig;

export function KpiTrendChart() {
  const [visibleKpis, setVisibleKpis] = React.useState<Record<VisibleKpiKeys, boolean>>({
    incidents: true,
    nearMisses: true,
    projectedIncidents: true,
    projectedNearMisses: true,
  });

  const handleToggleKpi = (kpiKey: VisibleKpiKeys) => {
    setVisibleKpis(prev => ({ ...prev, [kpiKey]: !prev[kpiKey] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Occurrence Trends & Projections</CardTitle>
        <CardDescription>Total incidents and near misses over the last 6 months, with a 2-month projection. Toggle lines below.</CardDescription>
        <div className="pt-3 space-y-2">
          <Label className="text-xs text-muted-foreground">Display options:</Label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(Object.keys(visibleKpis) as VisibleKpiKeys[]).map((key) => (
              <div key={key} className="flex items-center space-x-2">
                <Switch
                  id={`toggle-${key}`}
                  checked={visibleKpis[key]}
                  onCheckedChange={() => handleToggleKpi(key)}
                  aria-label={`Toggle ${chartConfig[key]?.label || key}`}
                />
                <Label htmlFor={`toggle-${key}`} className="text-xs cursor-pointer">
                  {chartConfig[key]?.label || key}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 20,
                left: -20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Legend content={<ChartLegendContent />} />
              
              {visibleKpis.incidents && (
                <Line
                  dataKey="incidents"
                  type="monotone"
                  stroke="var(--color-incidents)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-incidents)", strokeWidth:0 }}
                  activeDot={{ r: 6 }}
                  name="Total Incidents"
                />
              )}
              {visibleKpis.nearMisses && (
                <Line
                  dataKey="nearMisses"
                  type="monotone"
                  stroke="var(--color-nearMisses)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-nearMisses)", strokeWidth:0 }}
                  activeDot={{ r: 6 }}
                  name="Near Misses"
                />
              )}
              {visibleKpis.projectedIncidents && (
                <Line
                  dataKey="projectedIncidents"
                  type="monotone"
                  stroke="var(--color-projectedIncidents)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "var(--color-projectedIncidents)", strokeWidth:0 }}
                  activeDot={{ r: 5 }}
                  name="Projected Incidents"
                  connectNulls={true}
                />
              )}
              {visibleKpis.projectedNearMisses && (
                <Line
                  dataKey="projectedNearMisses"
                  type="monotone"
                  stroke="var(--color-projectedNearMisses)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "var(--color-projectedNearMisses)", strokeWidth:0 }}
                  activeDot={{ r: 5 }}
                  name="Projected Near Misses"
                  connectNulls={true}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Projections for the next two months are illustrative, based on a simple extrapolation of recent mock data trends. Actual performance may vary.
        </p>
      </CardFooter>
    </Card>
  );
}

