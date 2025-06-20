
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button"; // Added
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added
import { SlidersHorizontal } from "lucide-react"; // Added for dropdown trigger icon


// Actual data
const ACTUAL_DATA = [
  { month: "Jan", incidents: 5, nearMisses: 8 },
  { month: "Feb", incidents: 3, nearMisses: 6 },
  { month: "Mar", incidents: 6, nearMisses: 9 },
  { month: "Apr", incidents: 4, nearMisses: 5 },
  { month: "May", incidents: 7, nearMisses: 10 },
  { month: "Jun", incidents: 5, nearMisses: 7 },
];

// Chart data now directly uses actual data
const chartData = ACTUAL_DATA;

const chartConfig = {
  incidents: {
    label: "Total Incidents",
    color: "hsl(var(--chart-1))",
  },
  nearMisses: {
    label: "Near Misses",
    color: "hsl(var(--chart-2))",
  },
  // Removed projectedIncidents and projectedNearMisses
} satisfies ChartConfig;

// Define which KPIs can be trended
const trendableKpis: Array<{ key: keyof typeof chartConfig; label: string }> = [
  { key: 'incidents', label: 'Total Incidents' },
  { key: 'nearMisses', label: 'Near Misses' },
];

type SelectableKpiKeys = keyof typeof chartConfig;

export function KpiTrendChart() {
  const [selectedKpis, setSelectedKpis] = React.useState<Record<SelectableKpiKeys, boolean>>({
    incidents: true,
    nearMisses: true,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
                <CardTitle>Monthly Occurrence Trends</CardTitle>
                <CardDescription>Actual total incidents and near misses over the last 6 months. Select KPIs to display via the dropdown.</CardDescription>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Display Options
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Select KPIs to Display</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {trendableKpis.map((kpi) => (
                    <DropdownMenuCheckboxItem
                        key={kpi.key}
                        checked={selectedKpis[kpi.key as SelectableKpiKeys]}
                        onCheckedChange={(checked) =>
                        setSelectedKpis((prev) => ({ ...prev, [kpi.key]: Boolean(checked) }))
                        }
                    >
                        {kpi.label}
                    </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
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
              
              {selectedKpis.incidents && (
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
              {selectedKpis.nearMisses && (
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
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      {/* CardFooter removed as projections are no longer displayed */}
    </Card>
  );
}
