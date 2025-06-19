
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, BedDouble, HeartPulse, AlertTriangle, CheckCircle2, Users, ListChecks } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast"; // Added useToast

// Data structure for KPI details
const kpiInfoMap: Record<string, { definition: string; relevance: string }> = {
  "TRIR": {
    definition: "Total Recordable Incident Rate: Number of recordable work-related injuries per 200,000 hours worked (or 100 employees per year).",
    relevance: "This is a lagging indicator and an industry benchmark for overall safety performance. A lower TRIR generally indicates better safety performance.",
  },
  "Near Miss Frequency Rate": {
    definition: "Near Miss Frequency Rate (NMFR): Number of near-misses reported per a standard unit (e.g., per 1,000,000 hours worked or per 100 workers per month).",
    relevance: "Reflects a proactive safety reporting culture. A higher NMFR (with low incident rates) can indicate good hazard awareness and opportunity for preventative action before incidents occur.",
  },
  "Severity Rate": {
    definition: "Lost Time Injury Severity Rate (LTISR): Number of lost workdays due to injuries per 200,000 hours worked.",
    relevance: "Measures the seriousness/impact of incidents that do occur, focusing on the time lost from work due to injuries. Helps understand the severity beyond just frequency.",
  },
  "First Aid Cases": {
    definition: "Total number of minor injuries requiring only first aid treatment within a defined period (e.g., monthly).",
    relevance: "Acts as an early warning indicator. Tracking first aid cases can help identify emerging risk trends or areas where minor incidents are frequent, potentially preventing more serious ones.",
  },
  "Unsafe Act / Condition Reports": {
    definition: "Number of unsafe act or unsafe condition reports submitted, often normalized per employee or per period (e.g., reports per employee per month).",
    relevance: "Indicates worker engagement in the safety program and the effectiveness of hazard identification processes. A healthy reporting rate suggests a proactive safety culture.",
  },
  "Incident Closure Rate": {
    definition: "Percentage of reported incidents (including near misses and hazards, if applicable) that are investigated and have corrective actions closed within a target timeframe.",
    relevance: "Measures the responsiveness and accountability of the SHEQ system in addressing identified issues. A high closure rate indicates effective follow-through.",
  },
  "Toolbox Talk Attendance": {
    definition: "Percentage of the relevant workforce attending scheduled toolbox talks or daily safety briefings, typically measured per week or month.",
    relevance: "Measures the effectiveness and reach of routine safety communication efforts. Consistent high attendance supports reinforcement of safety messages.",
  },
  "Corrective Action Closure Rate": {
    definition: "Percentage of corrective and preventive actions (CAPAs) arising from incidents, audits, or inspections that are completed by their due date.",
    relevance: "Indicates the SHEQ system's responsiveness and effectiveness in implementing improvements and preventing recurrence of issues. A high rate is crucial for system integrity.",
  },
};


// Reusable KpiCard Component
interface KpiCardProps {
  title: string;
  value: string | number;
  pieData?: Array<{ name: string; value: number; fill: string }>;
  icon: React.ElementType;
  description?: string;
  valueSuffix?: string;
  kpiKey: string; // Key to look up details in kpiInfoMap
}

function KpiCard({ title, value, pieData, icon: Icon, description, valueSuffix = "", kpiKey }: KpiCardProps) {
  const { toast } = useToast();

  let chartConfig: ChartConfig | undefined = undefined;
  if (pieData && pieData.length > 0) {
    chartConfig = pieData.reduce((acc, item) => {
      acc[item.name] = { label: item.name, color: item.fill };
      return acc;
    }, {} as ChartConfig);
  }
  const isDonut = pieData && pieData.length > 1;

  const handleClick = () => {
    const details = kpiInfoMap[kpiKey];
    if (details) {
      toast({
        title: `About: ${title}`,
        description: (
          <div className="space-y-1 text-xs max-w-md">
            <p><strong>Definition:</strong> {details.definition}</p>
            <p><strong>Relevance to SHE Performance:</strong> {details.relevance}</p>
          </div>
        ),
        duration: 15000, // 15 seconds
      });
    } else {
        toast({
            title: title,
            description: "Detailed information for this KPI is not available at the moment.",
            variant: "default",
            duration: 5000,
        });
    }
  };

  return (
    <Card onClick={handleClick} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
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
        kpiKey="TRIR"
        value={trir.toFixed(1)}
        icon={Activity}
        description="per 200,000 hours worked"
      />
      <KpiCard
        title="Near Miss Frequency Rate"
        kpiKey="Near Miss Frequency Rate"
        value={nmfr.toFixed(1)}
        icon={TrendingUp}
        description="per 100 workers/month"
      />
      <KpiCard
        title="Severity Rate"
        kpiKey="Severity Rate"
        value={severityRate.toFixed(1)}
        icon={BedDouble}
        description="Lost days per 200k hours"
      />
      <KpiCard
        title="First Aid Cases"
        kpiKey="First Aid Cases"
        value={firstAidCases}
        icon={HeartPulse}
        description="Total this month"
      />
      <KpiCard
        title="Unsafe Act / Condition Reports"
        kpiKey="Unsafe Act / Condition Reports"
        value={unsafeActConditionReports}
        icon={AlertTriangle}
        description="Reports this month"
      />
      <KpiCard
        title="Incident Closure Rate"
        kpiKey="Incident Closure Rate"
        value={incidentClosureRate}
        pieData={incidentClosureRateData}
        icon={CheckCircle2}
        valueSuffix="%"
        description="Closed within target time"
      />
      <KpiCard
        title="Toolbox Talk Attendance"
        kpiKey="Toolbox Talk Attendance"
        value={toolboxTalkAttendance}
        pieData={toolboxTalkAttendanceData}
        icon={Users}
        valueSuffix="%"
        description="Average attendance"
      />
      <KpiCard
        title="Corrective Action Closure Rate"
        kpiKey="Corrective Action Closure Rate"
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

