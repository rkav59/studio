
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, BedDouble, HeartPulse, AlertTriangle, CheckCircle2, Users, ListChecks, UsersRound, Biohazard, Ear, UserX, Presentation, Hourglass, Skull, Car, GraduationCap, ClipboardCheck, Eye, Lightbulb, Footprints, AlertCircleIcon } from "lucide-react"; 
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator"; 
import type { KpiThreshold } from '@/lib/types'; // Import KpiThreshold


// Data structure for KPI details including a user-friendly title
export const kpiInfoMap: Record<string, { title: string; definition: string; relevance: string, defaultTargetDirection: 'above' | 'below' }> = {
  "TRIR": {
    title: "TRIR",
    definition: "Total Recordable Incident Rate: Number of recordable work-related injuries per 200,000 hours worked (or 100 employees per year).",
    relevance: "This is a lagging indicator and an industry benchmark for overall safety performance. A lower TRIR generally indicates better safety performance.",
    defaultTargetDirection: 'below',
  },
  "NMFR": { // Using a shorter key for consistency
    title: "Near Miss Frequency Rate",
    definition: "Near Miss Frequency Rate (NMFR): Number of near-misses reported per a standard unit (e.g., per 1,000,000 hours worked or per 100 workers per month).",
    relevance: "Reflects a proactive safety reporting culture. A higher NMFR (with low incident rates) can indicate good hazard awareness and opportunity for preventative action before incidents occur.",
    defaultTargetDirection: 'below', // Typically aim to reduce near misses by addressing root causes, though high reporting can be good initially
  },
  "SeverityRate": {
    title: "Severity Rate",
    definition: "Lost Time Injury Severity Rate (LTISR): Number of lost workdays due to injuries per 200,000 hours worked.",
    relevance: "Measures the seriousness/impact of incidents that do occur, focusing on the time lost from work due to injuries. Helps understand the severity beyond just frequency.",
    defaultTargetDirection: 'below',
  },
  "FirstAidCases": {
    title: "First Aid Cases",
    definition: "Total number of minor injuries requiring only first aid treatment within a defined period (e.g., monthly).",
    relevance: "Acts as an early warning indicator. Tracking first aid cases can help identify emerging risk trends or areas where minor incidents are frequent, potentially preventing more serious ones.",
    defaultTargetDirection: 'below',
  },
  "UnsafeActConditionReports": {
    title: "Unsafe Act / Condition Reports",
    definition: "Number of unsafe act or unsafe condition reports submitted, often normalized per employee or per period (e.g., reports per employee per month).",
    relevance: "Indicates worker engagement in the safety program and the effectiveness of hazard identification processes. A healthy reporting rate suggests a proactive safety culture.",
    defaultTargetDirection: 'above', // Higher reporting is good
  },
  "IncidentClosureRate": {
    title: "Incident Closure Rate",
    definition: "Percentage of reported incidents (including near misses and hazards, if applicable) that are investigated and have corrective actions closed within a target timeframe.",
    relevance: "Measures the responsiveness and accountability of the SHEQ system in addressing identified issues. A high closure rate indicates effective follow-through.",
    defaultTargetDirection: 'above',
  },
  "ToolboxTalkAttendance": {
    title: "Toolbox Talk Attendance",
    definition: "Percentage of the relevant workforce attending scheduled toolbox talks or daily safety briefings, typically measured per week or month.",
    relevance: "Measures the effectiveness and reach of routine safety communication efforts. Consistent high attendance supports reinforcement of safety messages.",
    defaultTargetDirection: 'above',
  },
  "CorrectiveActionClosureRate": {
    title: "Corrective Action Closure Rate",
    definition: "Percentage of corrective and preventive actions (CAPAs) arising from incidents, audits, or inspections that are completed by their due date.",
    relevance: "Indicates the SHEQ system's responsiveness and effectiveness in implementing improvements and preventing recurrence of issues. A high rate is crucial for system integrity.",
    defaultTargetDirection: 'above',
  },
  "ManHoursLostInjury": {
    title: "Man Hours Lost (Injury)",
    definition: "Total work hours lost due to non-fatal occupational injuries within a defined period.",
    relevance: "Measures the direct impact of injuries on productivity and operational time. Helps in understanding the severity and recovery time associated with injuries.",
    defaultTargetDirection: 'below',
  },
  "ManHoursLostFatality": {
    title: "Man Hours Lost (Fatality)",
    definition: "Total potential work hours lost due to an occupational fatality, often calculated based on standard work-life expectancy or project duration.",
    relevance: "Highlights the ultimate cost of a workplace fatality in terms of lost productivity and potential. This is a critical lagging indicator reflecting the most severe safety failures.",
    defaultTargetDirection: 'below',
  },
  "MVAs": { // Shorter key
    title: "Motor Vehicle Accidents (MVA)",
    definition: "Total number of work-related motor vehicle accidents involving company vehicles or employees on company business.",
    relevance: "Tracks a significant source of workplace incidents and fatalities. Essential for organizations with vehicle fleets or frequent travel requirements.",
    defaultTargetDirection: 'below',
  },
  "HealthSurveillanceCoverage": {
    title: "Health Surveillance Coverage",
    definition: "% of workers requiring scheduled medical surveillance who have received it on time.",
    relevance: "Measures compliance with health monitoring obligations and ensures early detection of potential occupational health issues.",
    defaultTargetDirection: 'above',
  },
  "WorkRelatedIllnessRate": {
    title: "Work-Related Illness Rate",
    definition: "Number of new work-related illnesses per 10,000 workers (or other standard population size) over a defined period.",
    relevance: "Tracks the incidence of illnesses linked to workplace exposures (e.g., respiratory, dermatological, hearing loss), indicating effectiveness of long-term exposure controls.",
    defaultTargetDirection: 'below',
  },
  "HearingConservationCompliance": {
    title: "Hearing Conservation Compliance",
    definition: "% of workers in high-noise areas covered by the hearing conservation program (audiometry, training, PPE compliance).",
    relevance: "Critical in manufacturing, construction, and energy sectors to prevent noise-induced hearing loss. Measures program reach and effectiveness.",
    defaultTargetDirection: 'above',
  },
  "FitForDutyNonCompliance": {
    title: "Fit-for-Duty Non-Compliance",
    definition: "% of workers in safety-critical roles who are found non-compliant or not medically cleared during fit-for-duty assessments.",
    relevance: "Ensures workers in high-risk roles are medically fit, reducing the likelihood of incidents due to medical conditions.",
    defaultTargetDirection: 'below',
  },
  "HealthEducationCoverage": {
    title: "Health Education Coverage",
    definition: "% of the workforce that has completed targeted health education programs (e.g., HIV/AIDS awareness, wellness, stress management).",
    relevance: "Supports overall employee health awareness, preventative health behaviors, and contributes to long-term wellbeing and productivity.",
    defaultTargetDirection: 'above',
  },
  "TrainingComplianceRate": {
    title: "Training Compliance Rate",
    definition: "Percentage of employees or relevant workforce who have completed required SHEQ training topics by their due dates.",
    relevance: "Reflects adherence to legal and organizational training requirements, contributing to overall safety readiness and competence. Low rates can indicate gaps in essential knowledge or skills.",
    defaultTargetDirection: 'above',
  },
  "AuditScoreComplianceRate": {
    title: "Audit Score / Compliance Rate",
    definition: "Average score or percentage of conformance achieved in internal or external SHEQ audits (e.g., ISO 45001, ISO 14001, specific site audits).",
    relevance: "Indicates the overall effectiveness and maturity of the SHEQ management system. Trends can show improvement or decline in system implementation.",
    defaultTargetDirection: 'above',
  },
  "BBSObservationRate": {
    title: "BBS Observation Rate",
    definition: "Number of Behavior-Based Safety (BBS) observation cards submitted compared to an expected target, often per employee or team, over a period.",
    relevance: "Measures engagement with proactive safety culture initiatives. A healthy submission rate (with quality observations) indicates active participation in identifying safe and at-risk behaviors.",
    defaultTargetDirection: 'above',
  },
  "SHESuggestionRate": {
    title: "SHE Suggestion Rate",
    definition: "Number of SHE-related suggestions, ideas, or feedback items submitted by employees, often normalized per employee per month/quarter.",
    relevance: "Reflects employee involvement and perceived openness of the system to suggestions for improvement. A good rate indicates a proactive and learning safety culture.",
    defaultTargetDirection: 'above',
  },
  "LeadershipWalksRate": {
    title: "Leadership Walks / Site Visits",
    definition: "Percentage of scheduled leadership safety walks, site visits, or management safety tours that are completed as planned.",
    relevance: "Demonstrates visible management commitment and engagement with SHEQ at the operational level. Consistent completion reinforces the importance of safety from the top.",
    defaultTargetDirection: 'above',
  },
};


interface KpiCardProps {
  title: string;
  value: string | number;
  pieData?: Array<{ name: string; value: number; fill: string }>;
  icon: React.ElementType;
  description?: string;
  valueSuffix?: string;
  kpiKey: string; 
  threshold?: number;
  targetDirection?: 'above' | 'below';
}

function KpiCard({ title, value, pieData, icon: Icon, description, valueSuffix = "", kpiKey, threshold, targetDirection }: KpiCardProps) {
  const { toast } = useToast();

  let isDesirable = true;
  let valueColor = "text-foreground"; // Default color

  if (threshold !== undefined && targetDirection !== undefined && typeof value === 'number') {
    if (targetDirection === 'below') {
      isDesirable = value <= threshold;
    } else { // targetDirection === 'above'
      isDesirable = value >= threshold;
    }
    valueColor = isDesirable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  } else if (threshold !== undefined && targetDirection !== undefined && typeof value === 'string') {
    // Handle string values if necessary, e.g., convert to number or specific string comparisons
    // For now, we assume numeric comparison for thresholds
  }


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
    let thresholdInfo = "";
    if (threshold !== undefined && targetDirection !== undefined) {
        thresholdInfo = `\n\n**Current Threshold:** ${threshold} (Target: ${targetDirection === 'above' ? 'Higher' : 'Lower'} is better).`;
        if (!isDesirable) {
            thresholdInfo += `\n**Status:** <span class="font-semibold text-red-600">This KPI is outside the desired range.</span> Consider reviewing related processes or data. AI-powered recommendations for improvement may be available in future updates.`;
        } else {
            thresholdInfo += `\n**Status:** <span class="font-semibold text-green-600">This KPI is within the desired range.</span>`;
        }
    }

    if (details) {
      toast({
        title: `About: ${title}`,
        description: (
          <div className="space-y-1 text-xs max-w-md">
            <p><strong>Definition:</strong> {details.definition}</p>
            <p><strong>Relevance to SHE Performance:</strong> {details.relevance}</p>
            {thresholdInfo && <p dangerouslySetInnerHTML={{ __html: thresholdInfo.replace(/\n/g, '<br />') }} />}
          </div>
        ),
        duration: 20000, 
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
    <Card onClick={handleClick} className="cursor-pointer hover:shadow-lg transition-shadow duration-200 relative">
       {threshold !== undefined && targetDirection !== undefined && (
        <div className={`absolute top-2 right-2 h-3 w-3 rounded-full ${isDesirable ? 'bg-green-500' : 'bg-red-500'}`} 
             title={`Status: ${isDesirable ? 'Meeting target' : 'Needs attention'}`} />
      )}
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
        <div className={`text-2xl font-bold ${valueColor} ${pieData && pieData.length > 0 ? 'mt-2' : 'mt-2 mb-2'}`}>{value}{valueSuffix}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

interface OverviewCardsProps {
  kpiThresholds: KpiThreshold[];
  isLoadingThresholds: boolean; // To optionally show loading state or disable interactions
}

export function OverviewCards({ kpiThresholds, isLoadingThresholds }: OverviewCardsProps) {
  const findThreshold = (kpiKey: string): KpiThreshold | undefined => {
    return kpiThresholds.find(t => t.kpiKey === kpiKey);
  };

  // Mock data for general KPIs
  const trir = 2.1;
  const nmfr = 5.5;
  const severityRate = 15.2;
  const firstAidCases = 18;
  const unsafeActConditionReports = 35;
  const incidentClosureRate = 85;
  const toolboxTalkAttendance = 92;
  const correctiveActionClosureRate = 78;
  const manHoursLostInjury = 120;
  const manHoursLostFatality = 0; 
  const mvaCount = 2;

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

  // Mock data for Health KPIs
  const healthSurveillanceCoverage = 95;
  const workIllnessRate = 1.2; 
  const hearingConservationCompliance = 88;
  const fitForDutyNonCompliance = 3; 
  const healthEducationCoverage = 75;

  const healthSurveillanceCoverageData = [
    { name: 'Covered', value: healthSurveillanceCoverage, fill: 'hsl(var(--chart-positive-green))' },
    { name: 'Not Covered', value: 100 - healthSurveillanceCoverage, fill: 'hsl(var(--muted))' }
  ];
  const hearingConservationData = [
    { name: 'Compliant', value: hearingConservationCompliance, fill: 'hsl(var(--chart-4))' },
    { name: 'Non-Compliant', value: 100 - hearingConservationCompliance, fill: 'hsl(var(--muted))' }
  ];
   const fitForDutyData = [ // Note: For non-compliance, lower is better. Threshold setup will handle this.
    { name: 'Non-Compliant', value: fitForDutyNonCompliance, fill: 'hsl(var(--chart-5))' }, 
    { name: 'Compliant', value: 100 - fitForDutyNonCompliance, fill: 'hsl(var(--muted))' }
  ];
  const healthEducationData = [
    { name: 'Covered', value: healthEducationCoverage, fill: 'hsl(var(--chart-1))' },
    { name: 'Not Covered', value: 100 - healthEducationCoverage, fill: 'hsl(var(--muted))' }
  ];

  // Mock data for Process & Engagement KPIs
  const trainingComplianceRate = 90;
  const auditScore = 88;
  const bbsObservationRate = 75; // e.g. % of target observations
  const sheSuggestionRate = 2.5; // e.g. per 100 employees per month
  const leadershipWalksRate = 95;

  const trainingComplianceData = [
    { name: 'Compliant', value: trainingComplianceRate, fill: 'hsl(var(--chart-positive-green))' },
    { name: 'Non-Compliant', value: 100 - trainingComplianceRate, fill: 'hsl(var(--muted))' }
  ];
  const auditScoreData = [
    { name: 'Achieved', value: auditScore, fill: 'hsl(var(--chart-2))' },
    { name: 'Gap', value: 100 - auditScore, fill: 'hsl(var(--muted))' }
  ];
  const bbsObservationData = [
    { name: 'Submitted', value: bbsObservationRate, fill: 'hsl(var(--chart-3))' },
    { name: 'Missed Target', value: 100 - bbsObservationRate, fill: 'hsl(var(--muted))' }
  ];
  const leadershipWalksData = [
    { name: 'Completed', value: leadershipWalksRate, fill: 'hsl(var(--chart-4))' },
    { name: 'Scheduled', value: 100 - leadershipWalksRate, fill: 'hsl(var(--muted))' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight text-foreground/90">General SHEQ Performance Indicators</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <KpiCard title={kpiInfoMap["TRIR"].title} kpiKey="TRIR" value={trir.toFixed(1)} icon={Activity} description="per 200,000 hours worked" threshold={findThreshold("TRIR")?.value} targetDirection={findThreshold("TRIR")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["NMFR"].title} kpiKey="NMFR" value={nmfr.toFixed(1)} icon={TrendingUp} description="per 100 workers/month" threshold={findThreshold("NMFR")?.value} targetDirection={findThreshold("NMFR")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["SeverityRate"].title} kpiKey="SeverityRate" value={severityRate.toFixed(1)} icon={BedDouble} description="Lost days per 200k hours" threshold={findThreshold("SeverityRate")?.value} targetDirection={findThreshold("SeverityRate")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["FirstAidCases"].title} kpiKey="FirstAidCases" value={firstAidCases} icon={HeartPulse} description="Total this month" threshold={findThreshold("FirstAidCases")?.value} targetDirection={findThreshold("FirstAidCases")?.targetDirection}/>
        
        <KpiCard title={kpiInfoMap["UnsafeActConditionReports"].title} kpiKey="UnsafeActConditionReports" value={unsafeActConditionReports} icon={AlertTriangle} description="Reports this month" threshold={findThreshold("UnsafeActConditionReports")?.value} targetDirection={findThreshold("UnsafeActConditionReports")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["IncidentClosureRate"].title} kpiKey="IncidentClosureRate" value={incidentClosureRate} pieData={incidentClosureRateData} icon={CheckCircle2} valueSuffix="%" description="Closed within target time" threshold={findThreshold("IncidentClosureRate")?.value} targetDirection={findThreshold("IncidentClosureRate")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["ToolboxTalkAttendance"].title} kpiKey="ToolboxTalkAttendance" value={toolboxTalkAttendance} pieData={toolboxTalkAttendanceData} icon={Users} valueSuffix="%" description="Average attendance" threshold={findThreshold("ToolboxTalkAttendance")?.value} targetDirection={findThreshold("ToolboxTalkAttendance")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["CorrectiveActionClosureRate"].title} kpiKey="CorrectiveActionClosureRate" value={correctiveActionClosureRate} pieData={correctiveActionClosureRateData} icon={ListChecks} valueSuffix="%" description="Closed by due date" threshold={findThreshold("CorrectiveActionClosureRate")?.value} targetDirection={findThreshold("CorrectiveActionClosureRate")?.targetDirection}/>

        <KpiCard title={kpiInfoMap["ManHoursLostInjury"].title} kpiKey="ManHoursLostInjury" value={manHoursLostInjury} icon={Hourglass} description="Total hours this period" threshold={findThreshold("ManHoursLostInjury")?.value} targetDirection={findThreshold("ManHoursLostInjury")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["ManHoursLostFatality"].title} kpiKey="ManHoursLostFatality" value={manHoursLostFatality} icon={Skull} description="Total hours (potential)" threshold={findThreshold("ManHoursLostFatality")?.value} targetDirection={findThreshold("ManHoursLostFatality")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["MVAs"].title} kpiKey="MVAs" value={mvaCount} icon={Car} description="Total MVAs this period" threshold={findThreshold("MVAs")?.value} targetDirection={findThreshold("MVAs")?.targetDirection}/>
      </div>
      
      <Separator className="my-8" />
      
      <h2 className="text-xl font-semibold tracking-tight text-foreground/90">Health Performance Indicators</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <KpiCard title={kpiInfoMap["HealthSurveillanceCoverage"].title} kpiKey="HealthSurveillanceCoverage" value={healthSurveillanceCoverage} pieData={healthSurveillanceCoverageData} icon={UsersRound} valueSuffix="%" description="% workers receiving scheduled medicals" threshold={findThreshold("HealthSurveillanceCoverage")?.value} targetDirection={findThreshold("HealthSurveillanceCoverage")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["WorkRelatedIllnessRate"].title} kpiKey="WorkRelatedIllnessRate" value={workIllnessRate.toFixed(1)} icon={Biohazard} description="per 10,000 workers" threshold={findThreshold("WorkRelatedIllnessRate")?.value} targetDirection={findThreshold("WorkRelatedIllnessRate")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["HearingConservationCompliance"].title} kpiKey="HearingConservationCompliance" value={hearingConservationCompliance} pieData={hearingConservationData} icon={Ear} valueSuffix="%" description="Audiometry & PPE compliance" threshold={findThreshold("HearingConservationCompliance")?.value} targetDirection={findThreshold("HearingConservationCompliance")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["FitForDutyNonCompliance"].title} kpiKey="FitForDutyNonCompliance" value={fitForDutyNonCompliance} pieData={fitForDutyData} icon={UserX} valueSuffix="%" description="% workers not cleared" threshold={findThreshold("FitForDutyNonCompliance")?.value} targetDirection={findThreshold("FitForDutyNonCompliance")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["HealthEducationCoverage"].title} kpiKey="HealthEducationCoverage" value={healthEducationCoverage} pieData={healthEducationData} icon={Presentation} valueSuffix="%" description="% workforce trained" threshold={findThreshold("HealthEducationCoverage")?.value} targetDirection={findThreshold("HealthEducationCoverage")?.targetDirection}/>
      </div>

      <Separator className="my-8" />
      
      <h2 className="text-xl font-semibold tracking-tight text-foreground/90">SHEQ Process & Engagement KPIs</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <KpiCard title={kpiInfoMap["TrainingComplianceRate"].title} kpiKey="TrainingComplianceRate" value={trainingComplianceRate} pieData={trainingComplianceData} icon={GraduationCap} valueSuffix="%" description="% employees trained on time" threshold={findThreshold("TrainingComplianceRate")?.value} targetDirection={findThreshold("TrainingComplianceRate")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["AuditScoreComplianceRate"].title} kpiKey="AuditScoreComplianceRate" value={auditScore} pieData={auditScoreData} icon={ClipboardCheck} valueSuffix="%" description="Average audit conformance" threshold={findThreshold("AuditScoreComplianceRate")?.value} targetDirection={findThreshold("AuditScoreComplianceRate")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["BBSObservationRate"].title} kpiKey="BBSObservationRate" value={bbsObservationRate} pieData={bbsObservationData} icon={Eye} valueSuffix="%" description="% of target BBS cards submitted" threshold={findThreshold("BBSObservationRate")?.value} targetDirection={findThreshold("BBSObservationRate")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["SHESuggestionRate"].title} kpiKey="SHESuggestionRate" value={sheSuggestionRate.toFixed(1)} icon={Lightbulb} description="Suggestions per 100 employees/month" threshold={findThreshold("SHESuggestionRate")?.value} targetDirection={findThreshold("SHESuggestionRate")?.targetDirection}/>
        <KpiCard title={kpiInfoMap["LeadershipWalksRate"].title} kpiKey="LeadershipWalksRate" value={leadershipWalksRate} pieData={leadershipWalksData} icon={Footprints} valueSuffix="%" description="% of scheduled visits completed" threshold={findThreshold("LeadershipWalksRate")?.value} targetDirection={findThreshold("LeadershipWalksRate")?.targetDirection}/>
      </div>
    </div>
  );
}

export function IncidentTypeChart() { // This is an unused export, keeping it for now.
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incidents by Type</CardTitle>
      </CardHeader>
    </Card>
  );
}

    