
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, CheckCircle2, ListChecks, Activity, BedDouble, Percent, CalendarCheck, Skull } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Reusable Pie Card Component
interface KpiCardAsPieProps {
  title: string;
  value: number;
  pieData: Array<{ name: string; value: number; fill: string }>;
  icon: React.ElementType;
  description?: string;
  valueSuffix?: string; 
}

function KpiCardAsPie({ title, value, pieData, icon: Icon, description, valueSuffix = "" }: KpiCardAsPieProps) {
  const chartConfig: ChartConfig = pieData.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as ChartConfig);

  // Determine if it should be a donut (for compliance or rates with 2 slices) or a full pie
  const isDonut = pieData.length > 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-4 text-center">
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
                  strokeWidth={0} // No border between slices for single slice pies
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                 {/* Optional: Central Label
                {pieData.length === 1 && (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-foreground">
                    {value}{valueSuffix}
                  </text>
                )}
                */}
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="text-2xl font-bold mt-3">{value}{valueSuffix}</div>
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

  const totalIncidentsData = [{ name: 'Incidents', value: 100, fill: 'hsl(var(--chart-1))' }];
  const openHazardsData = [{ name: 'Open Hazards', value: 100, fill: 'hsl(var(--chart-2))' }];
  const inspectionsCompletedData = [{ name: 'Inspections', value: 100, fill: 'hsl(var(--chart-3))' }];
  const complianceRateData = [
    { name: 'Compliant', value: complianceRate, fill: 'hsl(var(--chart-1))' },
    { name: 'Non-Compliant', value: 100 - complianceRate, fill: 'hsl(var(--muted))' }
  ];
  // Assuming max ISR is 5 for visualization
  const injurySeverityRateData = [
    { name: 'ISR', value: injurySeverityRate, fill: 'hsl(var(--chart-4))' },
    { name: 'Remainder', value: Math.max(0, 5 - injurySeverityRate), fill: 'hsl(var(--muted))' }
  ];
  const lostTimeInjuryData = [{ name: 'LTI', value: 100, fill: lostTimeInjury > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--chart-positive-green))' }];
   // Assuming max LTIFR is 3 for visualization
  const ltifrData = [
    { name: 'LTIFR', value: ltifr, fill: 'hsl(var(--chart-5))' },
    { name: 'Remainder', value: Math.max(0, 3 - ltifr), fill: 'hsl(var(--muted))' }
  ];
  const accidentFreeDaysData = [{ name: 'Accident Free', value: 100, fill: 'hsl(var(--chart-positive-green))' }];
  const fatalitiesData = [{ name: 'State', value: 100, fill: fatalities > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--chart-positive-green))' }];


  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"> {/* Adjusted grid for better fit */}
      <KpiCardAsPie
        title="Total Incidents"
        value={totalIncidents}
        pieData={totalIncidentsData}
        icon={TrendingUp}
        description="+5 this month"
      />
      <KpiCardAsPie
        title="Open Hazards"
        value={openHazards}
        pieData={openHazardsData}
        icon={AlertTriangle}
        description="2 critical"
      />
      <KpiCardAsPie
        title="Inspections Done"
        value={inspectionsCompleted}
        pieData={inspectionsCompletedData}
        icon={ListChecks}
        description="+10 this month"
      />
      <KpiCardAsPie
        title="Compliance Rate"
        value={complianceRate}
        pieData={complianceRateData}
        icon={CheckCircle2}
        valueSuffix="%"
        description="Target: 98%"
      />
      <KpiCardAsPie
        title="Injury Severity Rate"
        value={injurySeverityRate}
        pieData={injurySeverityRateData}
        icon={Activity}
        description="Days lost per 200k hrs"
      />
      <KpiCardAsPie
        title="Lost Time Injuries"
        value={lostTimeInjury}
        pieData={lostTimeInjuryData}
        icon={BedDouble}
        description="This year"
      />
      <KpiCardAsPie
        title="LTIFR"
        value={ltifr}
        pieData={ltifrData}
        icon={Percent}
        description="LTIs per million hrs"
      />
      <KpiCardAsPie
        title="Accident Free Days"
        value={accidentFreeDays}
        pieData={accidentFreeDaysData}
        icon={CalendarCheck}
        description="Continuous record"
      />
      <KpiCardAsPie
        title="Fatalities"
        value={fatalities}
        pieData={fatalitiesData}
        icon={Skull}
        description="This year"
      />
    </div>
  );
}

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
              <ChartTooltip content={<ChartTooltipContent />} />
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
