
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Activity, TrendingUp, BedDouble, HeartPulse, AlertTriangle, CheckCircle2, Users, ListChecks, UsersRound, Biohazard, Ear, UserX, Presentation, Hourglass, Skull, Car, GraduationCap, ClipboardCheck, Eye, Lightbulb, Footprints, BrainCircuit, Sparkles, Loader2 as KpiLoader, Settings } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator"; 
import type { KpiThreshold, KpiRecommendationInput, KpiRecommendationOutput } from '@/lib/types';
import React, { useState, useMemo } from "react"; 
import { generateKpiRecommendation } from "@/ai/flows/generate-kpi-recommendation-flow";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle as UIAlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";


// Data structure for KPI details including a user-friendly title
export const kpiInfoMap: Record<string, { title: string; definition: string; relevance: string, defaultTargetDirection: 'above' | 'below' }> = {
  "TRIR": {
    title: "Total Recordable Incident Rate",
    definition: "Total Recordable Incident Rate: Number of recordable work-related injuries per 200,000 hours worked (or 100 employees per year).",
    relevance: "This is a lagging indicator and an industry benchmark for overall safety performance. A lower TRIR generally indicates better safety performance.",
    defaultTargetDirection: 'below',
  },
  "NMFR": { 
    title: "Near Miss Frequency Rate",
    definition: "Near Miss Frequency Rate (NMFR): Number of near-misses reported per a standard unit (e.g., per 1,000,000 hours worked or per 100 workers per month).",
    relevance: "Reflects a proactive safety reporting culture. A higher NMFR (with low incident rates) can indicate good hazard awareness and opportunity for preventative action before incidents occur.",
    defaultTargetDirection: 'below', 
  },
  "SeverityRate": {
    title: "Severity Rate",
    definition: "Lost Time Injury Severity Rate (LTISR): Number of lost workdays due to injuries per 200,000 hours worked.",
    relevance: "Measures the seriousness/impact of incidents that do occur, focusing on the time lost from work due to injuries. Helps understand the severity beyond just frequency.",
    defaultTargetDirection: 'below',
  },
  "MinorInjuries": {
    title: "Minor Injuries",
    definition: "Total number of injuries not resulting in lost work time (e.g., medical treatment cases beyond first aid) within a defined period.",
    relevance: "Tracks incidents that are more serious than first aid but do not result in lost workdays. Helps identify trends in less severe, but still significant, injuries, aiding in proactive risk reduction.",
    defaultTargetDirection: 'below',
  },
  "UnsafeActConditionReports": {
    title: "Unsafe Act / Condition Reports",
    definition: "Number of unsafe act or unsafe condition reports submitted, often normalized per employee or per period (e.g., reports per employee per month).",
    relevance: "Indicates worker engagement in the safety program and the effectiveness of hazard identification processes. A healthy reporting rate suggests a proactive safety culture.",
    defaultTargetDirection: 'above', 
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
  "MVAs": { 
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
  valueSuffix?: string;
  kpiKey: string; 
  threshold?: number;
  targetDirection?: 'above' | 'below';
  onGetAiRecommendation: (kpiDetails: KpiRecommendationInput) => void;
}

function KpiCard({ title, value, valueSuffix = "", kpiKey, threshold, targetDirection, onGetAiRecommendation }: KpiCardProps) {
  const { toast } = useToast();
  const router = useRouter();

  let isDesirable = true;
  let valueColor = "text-foreground"; 

  const hasThreshold = threshold !== undefined && targetDirection !== undefined;

  if (hasThreshold && typeof value === 'number') {
    if (targetDirection === 'below') {
      isDesirable = value <= threshold!;
    } else { 
      isDesirable = value >= threshold!;
    }
    valueColor = isDesirable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  }
  
  const handleCardClick = () => {
    const details = kpiInfoMap[kpiKey];
    let thresholdInfo = "";
    if (threshold !== undefined && targetDirection !== undefined) {
        thresholdInfo = `\n\n**Current Threshold:** ${threshold} (Target: ${targetDirection === 'above' ? 'Higher' : 'Lower'} is better).`;
        if (!isDesirable) {
            thresholdInfo += `\n**Status:** <span class="font-semibold text-red-600">This KPI is outside the desired range.</span> Click the lightbulb icon on the card to get AI-powered improvement suggestions.`;
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
  
  const handleRecommendationClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click event
    const details = kpiInfoMap[kpiKey];
    if (details && threshold !== undefined && targetDirection !== undefined && typeof value === 'number') {
      onGetAiRecommendation({
        kpiKey,
        kpiTitle: title,
        currentValue: value,
        thresholdValue: threshold,
        targetDirection,
        kpiDefinition: details.definition,
        kpiRelevance: details.relevance,
      });
    } else {
      toast({ title: "Error", description: "Cannot get recommendation. KPI details or threshold missing.", variant: "destructive" });
    }
  };


  return (
    <Card onClick={handleCardClick} className="cursor-pointer hover:shadow-lg transition-shadow duration-200 relative h-[180px] flex flex-col">
      {hasThreshold && (
        <div className={`absolute top-2 right-2 h-3 w-3 rounded-full ${isDesirable ? 'bg-green-500' : 'bg-red-500'}`} 
             title={`Status: ${isDesirable ? 'Meeting target' : 'Needs attention'}`} />
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center">
        {hasThreshold ? (
          <div className="text-center">
            <div className={`text-6xl font-bold ${valueColor}`}>{value}{valueSuffix}</div>
            {!isDesirable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRecommendationClick}
                className="mt-1 text-xs text-accent hover:text-accent/90 h-auto p-1"
                title="Get AI Recommendation"
              >
                <Lightbulb className="h-3 w-3 mr-1" /> Get Suggestion
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-xs space-y-2 p-2">
            <Settings className="h-6 w-6 mx-auto text-muted-foreground/50"/>
            <p>Configure threshold to see progress.</p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/dashboard/kpi-settings');
              }}
            >
              Go to Settings
            </Button>
          </div>
        )}
      </CardContent>
       {hasThreshold && (
        <CardFooter className="pt-0 pb-2 px-4 justify-end">
            <p className="text-xs text-muted-foreground">Threshold: {threshold}</p>
        </CardFooter>
      )}
    </Card>
  );
}

interface OverviewCardsProps {
  kpiThresholds: KpiThreshold[];
  kpiVisibility: Record<string, boolean>;
  isLoadingSettings: boolean; 
}

export function OverviewCards({ kpiThresholds, kpiVisibility, isLoadingSettings }: OverviewCardsProps) {
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [currentKpiForRecommendation, setCurrentKpiForRecommendation] = useState<KpiRecommendationInput | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<KpiRecommendationOutput | null>(null);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();


  const findThreshold = (kpiKey: string): KpiThreshold | undefined => {
    return kpiThresholds.find(t => t.kpiKey === kpiKey);
  };

  const handleGetAiRecommendation = async (kpiDetails: KpiRecommendationInput) => {
    setCurrentKpiForRecommendation(kpiDetails);
    setIsRecommendationModalOpen(true);
    setIsRecommendationLoading(true);
    setRecommendationResult(null);
    try {
      const result = await generateKpiRecommendation(kpiDetails);
      setRecommendationResult(result);
    } catch (error) {
      console.error("Error getting AI recommendation:", error);
      setRecommendationResult({
        suggestedActions: ["Failed to generate recommendations. Please try again later."],
        reasoning: "An error occurred while contacting the AI service.",
      });
      toast({ title: "Error", description: "Could not fetch AI recommendations.", variant: "destructive" });
    } finally {
      setIsRecommendationLoading(false);
    }
  };


  // Mock data for general KPIs
  const trir = 2.1;
  const nmfr = 5.5;
  const severityRate = 15.2;
  const minorInjuries = 18; 
  const unsafeActConditionReports = 35;
  const incidentClosureRate = 85;
  const toolboxTalkAttendance = 92;
  const correctiveActionClosureRate = 78;
  const manHoursLostInjury = 120;
  const manHoursLostFatality = 0; 
  const mvaCount = 2;
  
  // Mock data for Health KPIs
  const healthSurveillanceCoverage = 95;
  const workIllnessRate = 1.2; 
  const hearingConservationCompliance = 88;
  const fitForDutyNonCompliance = 3; 
  const healthEducationCoverage = 75;
  
  // Mock data for Process & Engagement KPIs
  const trainingComplianceRate = 90;
  const auditScore = 88;
  const bbsObservationRate = 75; // e.g. % of target observations
  const sheSuggestionRate = 2.5; // e.g. per 100 employees per month
  const leadershipWalksRate = 95;
  
  const kpiSections = useMemo(() => [
    {
      title: "General SHEQ Performance Indicators",
      kpis: [
        { key: "TRIR", value: trir, valueSuffix: "" },
        { key: "NMFR", value: nmfr, valueSuffix: "" },
        { key: "SeverityRate", value: severityRate, valueSuffix: "" },
        { key: "MinorInjuries", value: minorInjuries, valueSuffix: "" },
        { key: "UnsafeActConditionReports", value: unsafeActConditionReports, valueSuffix: "" },
        { key: "IncidentClosureRate", value: incidentClosureRate, valueSuffix: "%" },
        { key: "ToolboxTalkAttendance", value: toolboxTalkAttendance, valueSuffix: "%" },
        { key: "CorrectiveActionClosureRate", value: correctiveActionClosureRate, valueSuffix: "%" },
        { key: "ManHoursLostInjury", value: manHoursLostInjury, valueSuffix: "" },
        { key: "ManHoursLostFatality", value: manHoursLostFatality, valueSuffix: "" },
        { key: "MVAs", value: mvaCount, valueSuffix: "" },
      ]
    },
    {
      title: "Health Performance Indicators",
      kpis: [
        { key: "HealthSurveillanceCoverage", value: healthSurveillanceCoverage, valueSuffix: "%" },
        { key: "WorkRelatedIllnessRate", value: workIllnessRate, valueSuffix: "" },
        { key: "HearingConservationCompliance", value: hearingConservationCompliance, valueSuffix: "%" },
        { key: "FitForDutyNonCompliance", value: fitForDutyNonCompliance, valueSuffix: "%" },
        { key: "HealthEducationCoverage", value: healthEducationCoverage, valueSuffix: "%" },
      ]
    },
    {
      title: "SHEQ Process & Engagement KPIs",
      kpis: [
        { key: "TrainingComplianceRate", value: trainingComplianceRate, valueSuffix: "%" },
        { key: "AuditScoreComplianceRate", value: auditScore, valueSuffix: "%" },
        { key: "BBSObservationRate", value: bbsObservationRate, valueSuffix: "%" },
        { key: "SHESuggestionRate", value: sheSuggestionRate, valueSuffix: "" },
        { key: "LeadershipWalksRate", value: leadershipWalksRate, valueSuffix: "%" },
      ]
    }
  ], []);


  if (isLoadingSettings) {
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {[...Array(Object.keys(kpiInfoMap).length)].map((_, i) => (
            <Card key={`skl-${i}`} className="h-[180px] flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <KpiLoader className="h-6 w-6 animate-spin text-muted-foreground/50" />
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center">
                    <div className="h-6 bg-muted-foreground/10 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted-foreground/10 rounded w-1/2"></div>
                </CardContent>
            </Card>
        ))}
      </div>
    );
  }

  const visibleKpiSections = kpiSections.map(section => ({
    ...section,
    kpis: section.kpis.filter(kpi => kpiVisibility[kpi.key] !== false) // Default to true if not in map
  })).filter(section => section.kpis.length > 0);

  if (visibleKpiSections.length === 0 && !isLoadingSettings) {
    return (
      <Card className="text-center p-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2"><Settings className="h-6 w-6 text-muted-foreground"/>No KPIs Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">You have hidden all KPIs. Go to KPI Settings to select which indicators to display.</p>
          <Button onClick={() => router.push('/dashboard/kpi-settings')}>
            Go to KPI Settings
          </Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      {visibleKpiSections.map((section, sectionIndex) => (
        <React.Fragment key={section.title}>
          {sectionIndex > 0 && <Separator className="my-8" />}
          <h2 className="text-xl font-semibold tracking-tight text-foreground/90">{section.title}</h2>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {section.kpis.map((kpi) => {
              const thresholdConfig = findThreshold(kpi.key);
              return (
                <KpiCard
                  key={kpi.key}
                  title={kpiInfoMap[kpi.key].title}
                  kpiKey={kpi.key}
                  value={kpi.value}
                  valueSuffix={kpi.valueSuffix}
                  threshold={thresholdConfig?.value}
                  targetDirection={thresholdConfig?.targetDirection || kpiInfoMap[kpi.key].defaultTargetDirection}
                  onGetAiRecommendation={handleGetAiRecommendation}
                />
              );
            })}
          </div>
        </React.Fragment>
      ))}

      {isRecommendationModalOpen && currentKpiForRecommendation && (
        <AlertDialog open={isRecommendationModalOpen} onOpenChange={setIsRecommendationModalOpen}>
          <AlertDialogContent className="sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" /> AI Recommendations for: {currentKpiForRecommendation.kpiTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Current Value: {currentKpiForRecommendation.currentValue}, Target: {currentKpiForRecommendation.thresholdValue} ({currentKpiForRecommendation.targetDirection === 'above' ? 'Higher' : 'Lower'} is better)
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {isRecommendationLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <KpiLoader className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Generating recommendations...</p>
              </div>
            ) : recommendationResult ? (
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold text-primary mb-1">Suggested Actions:</h4>
                            <ul className="list-disc list-inside space-y-1 pl-4 bg-secondary/50 p-3 rounded-md">
                                {recommendationResult.suggestedActions.map((action, index) => (
                                <li key={index}>{action}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-primary mb-1">Reasoning:</h4>
                            <p className="whitespace-pre-wrap bg-secondary/50 p-3 rounded-md">{recommendationResult.reasoning}</p>
                        </div>
                        <Alert variant="info" className="mt-4 text-xs">
                            <BrainCircuit className="h-4 w-4" />
                            <UIAlertTitle>AI Generated Content</UIAlertTitle>
                            <AlertDescription>
                            These recommendations are AI-generated. Always use professional judgment and adapt suggestions to your specific organizational context.
                            </AlertDescription>
                        </Alert>
                    </div>
                </ScrollArea>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No recommendations available at this time.</p>
            )}

            <AlertDialogFooter className="mt-4 pt-4 border-t">
              <AlertDialogCancel onClick={() => setIsRecommendationModalOpen(false)}>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export function IncidentTypeChart() { 
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incidents by Type</CardTitle>
      </CardHeader>
    </Card>
  );
}
