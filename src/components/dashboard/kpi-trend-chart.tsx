
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { TrendingDown, TrendingUp } from "lucide-react";

const MOCK_MONTHLY_TREND_DATA = [
  { month: "Jan", incidents: 5, nearMisses: 8 },
  { month: "Feb", incidents: 3, nearMisses: 6 },
  { month: "Mar", incidents: 6, nearMisses: 9 },
  { month: "Apr", incidents: 4, nearMisses: 5 },
  { month: "May", incidents: 7, nearMisses: 10 },
  { month: "Jun", incidents: 5, nearMisses: 7 },
];

const chartConfig = {
  incidents: {
    label: "Total Incidents",
    color: "hsl(var(--chart-1))",
    icon: TrendingDown,
  },
  nearMisses: {
    label: "Near Misses",
    color: "hsl(var(--chart-2))",
    icon: TrendingUp,
  }
} satisfies ChartConfig;

export function KpiTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Occurrence Trends</CardTitle>
        <CardDescription>Total incidents and near misses over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={MOCK_MONTHLY_TREND_DATA}
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
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Legend content={<ChartLegendContent />} />
              <Line
                dataKey="incidents"
                type="monotone"
                stroke="var(--color-incidents)"
                strokeWidth={2}
                dot={true}
                name="Total Incidents"
              />
              <Line
                dataKey="nearMisses"
                type="monotone"
                stroke="var(--color-nearMisses)"
                strokeWidth={2}
                dot={true}
                name="Near Misses"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
