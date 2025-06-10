
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, CheckCircle2, ListChecks, Activity, BedDouble, Percent, CalendarCheck, Skull } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

// Reusable Pie Card Component - Renamed and pieData made optional
interface KpiCardProps {
  title: string;
  value: number;
  pieData?: Array<{ name: string; value: number; fill: string }>; // Made optional
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
        {pieData && pieData.length > 0 && chartConfig && ( // Conditionally render pie chart
          <div className="h-[80px] w-[80px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={isDonut ? 20 : 0}
                    outerRadius={35}
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
        <div className={`text-2xl font-bold ${pieData && pieData.length > 0 ? 'mt-3' : 'mt-2 mb-2'}`}>{value}{valueSuffix}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}


const MOCK_INCIDENTS_BY_TYPE_DATA = [
  { type: 'Incident', count: 5, fill: "hsl(var(--primary))" },
  { type: 'Near Miss', count: 12, fill: "hsl(var(--accent))" },
  { type: 'Hazard', count: 8, fill: "hsl(var(--destructive))" },
];

// This incidentTypeChartConfig is for the BarChart, not the KpiCards directly
const incidentTypeChartConfig = {
  incidents: {
    label: "Incidents",
    color: "hsl(var(--primary))",
  },
  nearMisses: {
    label: "Near Misses",
    color: "hsl(var(--accent))",
  },
  hazards: {
    label: "Hazards",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;


export function OverviewCards() {
  const totalIncidents = 25;
  const openHazards = 8;
  const inspectionsCompleted = 42;
  const complianceRate = 95;
  const injurySeverityRate = 2.5;
  const lostTimeInjury = 3;
  const ltifr = 1.8;
  const accidentFreeDays = 150;
  const fatalities = 0;

  // Data for Pie Charts where applicable
  const complianceRateData = [
    { name: 'Compliant', value: complianceRate, fill: 'hsl(var(--chart-1))' },
    { name: 'Non-Compliant', value: 100 - complianceRate, fill: 'hsl(var(--muted))' }
  ];
  const injurySeverityRateData = [
    { name: 'ISR', value: injurySeverityRate, fill: 'hsl(var(--chart-4))' },
    { name: 'Remainder', value: Math.max(0, 5 - injurySeverityRate), fill: 'hsl(var(--muted))' } // Assuming max ISR target of 5 for viz
  ];
  const ltifrData = [
    { name: 'LTIFR', value: ltifr, fill: 'hsl(var(--chart-5))' },
    { name: 'Remainder', value: Math.max(0, 3 - ltifr), fill: 'hsl(var(--muted))' } // Assuming max LTIFR target of 3 for viz
  ];


  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
      <KpiCard
        title="Total Incidents"
        value={totalIncidents}
        // pieData removed for simple count display
        icon={TrendingUp}
        description="+5 this month"
      />
      <KpiCard
        title="Open Hazards"
        value={openHazards}
        // pieData removed
        icon={AlertTriangle}
        description="2 critical"
      />
      <KpiCard
        title="Inspections Done"
        value={inspectionsCompleted}
        // pieData removed
        icon={ListChecks}
        description="+10 this month"
      />
      <KpiCard
        title="Compliance Rate"
        value={complianceRate}
        pieData={complianceRateData} // Kept for donut chart
        icon={CheckCircle2}
        valueSuffix="%"
        description="Target: 98%"
      />
      <KpiCard
        title="Injury Severity Rate"
        value={injurySeverityRate}
        pieData={injurySeverityRateData} // Kept for pie chart
        icon={Activity}
        description="Days lost per 200k hrs"
      />
      <KpiCard
        title="Lost Time Injuries"
        value={lostTimeInjury}
        // pieData removed
        icon={BedDouble}
        description="This year"
      />
      <KpiCard
        title="LTIFR"
        value={ltifr}
        pieData={ltifrData} // Kept for pie chart
        icon={Percent}
        description="LTIs per million hrs"
      />
      <KpiCard
        title="Accident Free Days"
        value={accidentFreeDays}
        // pieData removed
        icon={CalendarCheck}
        description="Continuous record"
      />
      <KpiCard
        title="Fatalities"
        value={fatalities}
        // pieData removed
        icon={Skull}
        description="This year"
      />
    </div>
  );
}

// IncidentTypeChart remains unchanged as it's a BarChart, not using KpiCard
export function IncidentTypeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incidents by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={incidentTypeChartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_INCIDENTS_BY_TYPE_DATA} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="type" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                cursor={{fill: 'hsl(var(--muted))'}}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                 {MOCK_INCIDENTS_BY_TYPE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
