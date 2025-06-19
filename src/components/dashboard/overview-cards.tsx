
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, BedDouble, HeartPulse, AlertTriangle, CheckCircle2, Users, ListChecks } from "lucide-react"; // Updated icons
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

// Reusable KpiCard Component
interface KpiCardProps {
  title: string;
  value: string | number; // Value can be string or number
  pieData?: Array<{ name: string; value: number; fill: string }>;
  icon: React.ElementType;
  description?: string;
  valueSuffix?: string;
}

function KpiCard({ title, value, pieData, icon: Icon, description, valueSuffix = "" }: KpiCardProps) {
  let chartConfig: ChartConfig | undefined = undefined;
  if (pieData && pieData.length > 0) {
    chartConfig = pieData.reduce((acc, item) => {
      acc[item.name] = { label: item.name, color: item.fill };
      return acc;
    }, {} as ChartConfig);
  }
  const isDonut = pieData && pieData.length > 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-4 text-center">
        {pieData && pieData.length > 0 && chartConfig && (
          <div className="h-[50px] w-[50px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={isDonut ? 12 : 0}
                    outerRadius={23}
                    paddingAngle={isDonut ? 2 : 0}
                    labelLine={false}
                    strokeWidth={pieData.length === 1 && pieData[0].value === 100 ? 0 : 1}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
        <div className={`text-2xl font-bold ${pieData && pieData.length > 0 ? 'mt-2' : 'mt-2 mb-2'}`}>{value}{valueSuffix}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export function OverviewCards() {
  // Mock data for new KPIs
  const trir = 2.1;
  const nmfr = 5.5;
  const severityRate = 15.2;
  const firstAidCases = 18;
  const unsafeActConditionReports = 35;
  const incidentClosureRate = 85;
  const toolboxTalkAttendance = 92;
  const correctiveActionClosureRate = 78;

  const incidentClosureRateData = [
    { name: 'Closed', value: incidentClosureRate, fill: 'hsl(var(--chart-1))' },
    { name: 'Open', value: 100 - incidentClosureRate, fill: 'hsl(var(--muted))' }
  ];
  const toolboxTalkAttendanceData = [
    { name: 'Attended', value: toolboxTalkAttendance, fill: 'hsl(var(--chart-2))' },
    { name: 'Absent', value: 100 - toolboxTalkAttendance, fill: 'hsl(var(--muted))' }
  ];
  const correctiveActionClosureRateData = [
    { name: 'Closed On Time', value: correctiveActionClosureRate, fill: 'hsl(var(--chart-3))' },
    { name: 'Pending/Overdue', value: 100 - correctiveActionClosureRate, fill: 'hsl(var(--muted))' }
  ];

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
      <KpiCard
        title="TRIR"
        value={trir.toFixed(1)}
        icon={Activity}
        description="per 200,000 hours worked"
      />
      <KpiCard
        title="Near Miss Frequency Rate"
        value={nmfr.toFixed(1)}
        icon={TrendingUp}
        description="per 100 workers/month"
      />
      <KpiCard
        title="Severity Rate"
        value={severityRate.toFixed(1)}
        icon={BedDouble}
        description="Lost days per 200k hours"
      />
      <KpiCard
        title="First Aid Cases"
        value={firstAidCases}
        icon={HeartPulse}
        description="Total this month"
      />
      <KpiCard
        title="Unsafe Act/Condition Reports"
        value={unsafeActConditionReports}
        icon={AlertTriangle}
        description="Reports this month"
      />
      <KpiCard
        title="Incident Closure Rate"
        value={incidentClosureRate}
        pieData={incidentClosureRateData}
        icon={CheckCircle2}
        valueSuffix="%"
        description="Closed within target time"
      />
      <KpiCard
        title="Toolbox Talk Attendance"
        value={toolboxTalkAttendance}
        pieData={toolboxTalkAttendanceData}
        icon={Users}
        valueSuffix="%"
        description="Average attendance"
      />
      <KpiCard
        title="Corrective Action Closure Rate"
        value={correctiveActionClosureRate}
        pieData={correctiveActionClosureRateData}
        icon={ListChecks}
        valueSuffix="%"
        description="Closed by due date"
      />
    </div>
  );
}

// IncidentTypeChart (if it was a separate component, it would be here or removed if not used)
// For this update, it's assumed to be part of the main dashboard page or not directly related to OverviewCards.
// If IncidentTypeChart was previously part of OverviewCards.tsx and needs to be removed, it's done by not including it.
export function IncidentTypeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incidents by Type</CardTitle>
      </CardHeader>
      {/* Content for the chart would go here if it were being rendered from this file */}
    </Card>
  );
}
