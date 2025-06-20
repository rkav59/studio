
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { TrendingDown, TrendingUp } from "lucide-react";

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
// For Incidents: Jun (5) -> Jul (4) -> Aug (3)
// For Near Misses: Jun (7) -> Jul (8) -> Aug (9)
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

  // Anchor projected lines from the last actual data point
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
    color: "hsl(var(--chart-1))", // Same color, but will be dashed
    icon: TrendingDown,
  },
  projectedNearMisses: {
    label: "Projected Near Misses",
    color: "hsl(var(--chart-2))", // Same color, but will be dashed
    icon: TrendingUp,
  }
} satisfies ChartConfig;

export function KpiTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Occurrence Trends & Projections</CardTitle>
        <CardDescription>Total incidents and near misses over the last 6 months, with a 2-month projection.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full"> {/* Increased height slightly */}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 20,
                left: -20, // Adjusted for YAxis labels
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
                allowDecimals={false} // Ensure whole numbers on Y-axis
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Legend content={<ChartLegendContent />} />
              {/* Actual Data Lines */}
              <Line
                dataKey="incidents"
                type="monotone"
                stroke="var(--color-incidents)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-incidents)", strokeWidth:0 }}
                activeDot={{ r: 6 }}
                name="Total Incidents"
              />
              <Line
                dataKey="nearMisses"
                type="monotone"
                stroke="var(--color-nearMisses)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-nearMisses)", strokeWidth:0 }}
                activeDot={{ r: 6 }}
                name="Near Misses"
              />
              {/* Projected Data Lines */}
              <Line
                dataKey="projectedIncidents"
                type="monotone"
                stroke="var(--color-projectedIncidents)"
                strokeWidth={2}
                strokeDasharray="5 5" // Dashed line for projection
                dot={{ r: 3, fill: "var(--color-projectedIncidents)", strokeWidth:0 }}
                activeDot={{ r: 5 }}
                name="Projected Incidents"
                connectNulls={true} // Connects over null data points for smoother projection start
              />
              <Line
                dataKey="projectedNearMisses"
                type="monotone"
                stroke="var(--color-projectedNearMisses)"
                strokeWidth={2}
                strokeDasharray="5 5" // Dashed line for projection
                dot={{ r: 3, fill: "var(--color-projectedNearMisses)", strokeWidth:0 }}
                activeDot={{ r: 5 }}
                name="Projected Near Misses"
                connectNulls={true} // Connects over null data points for smoother projection start
              />
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
