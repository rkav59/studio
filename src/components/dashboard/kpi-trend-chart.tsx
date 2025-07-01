
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select
import { SlidersHorizontal } from "lucide-react";

// Expanded actual data to 12 months for period selection
const ACTUAL_DATA = [
  { month: "Jul '23", incidents: 2, nearMisses: 4 },
  { month: "Aug '23", incidents: 3, nearMisses: 5 },
  { month: "Sep '23", incidents: 1, nearMisses: 3 },
  { month: "Oct '23", incidents: 4, nearMisses: 6 },
  { month: "Nov '23", incidents: 2, nearMisses: 4 },
  { month: "Dec '23", incidents: 3, nearMisses: 7 },
  { month: "Jan '24", incidents: 5, nearMisses: 8 },
  { month: "Feb '24", incidents: 3, nearMisses: 6 },
  { month: "Mar '24", incidents: 6, nearMisses: 9 },
  { month: "Apr '24", incidents: 4, nearMisses: 5 },
  { month: "May '24", incidents: 7, nearMisses: 10 },
  { month: "Jun '24", incidents: 5, nearMisses: 7 },
];

const chartConfig = {
  incidents: {
    label: "Total Incidents",
    color: "hsl(var(--chart-1))",
  },
  nearMisses: {
    label: "Near Misses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const trendableKpis: Array<{ key: keyof typeof chartConfig; label: string }> = [
  { key: 'incidents', label: 'Total Incidents' },
  { key: 'nearMisses', label: 'Near Misses' },
];

type SelectableKpiKeys = keyof typeof chartConfig;

const periodOptions = [
  { label: "Last 3 Months", value: 3 },
  { label: "Last 6 Months", value: 6 },
  { label: "Last 12 Months", value: 12 },
];

export function KpiTrendChart() {
  const [selectedKpis, setSelectedKpis] = React.useState<Record<SelectableKpiKeys, boolean>>({
    incidents: true,
    nearMisses: true,
  });
  const [selectedPeriod, setSelectedPeriod] = React.useState<number>(6); // Default to 6 months

  const chartData = React.useMemo(() => {
    // Assuming ACTUAL_DATA is sorted chronologically with latest data at the end
    return ACTUAL_DATA.slice(-selectedPeriod);
  }, [selectedPeriod]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
                <CardTitle>Monthly Occurrence Trends</CardTitle>
                <CardDescription>Actual total incidents and near misses over the selected period. Customize via dropdowns.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={String(selectedPeriod)} onValueChange={(value) => setSelectedPeriod(Number(value))}>
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 text-xs">
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          Display KPIs
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
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
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
    </Card>
  );
}
