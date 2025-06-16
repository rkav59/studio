
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from 'date-fns';
import { ShieldAlert, ListChecks, CheckSquare, Eye, Edit2 as EditIcon, Download, SparklesIcon, AlertTriangle, HelpCircle, Activity } from 'lucide-react'; // Renamed Edit to EditIcon to avoid conflict
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Incident, RiskAssessment, RiskAssessmentMethod, RiskAssessmentSuggestionOutput, HazardEntry, RiskControlItem } from "@/lib/types";
import { IncidentForm } from "@/components/incident-logging/incident-form";
import { RiskAssessmentAiAssistant } from "@/components/risk-assessment/risk-assessment-ai-assistant";
import { RiskAssessmentForm } from '@/components/risk-assessment/risk-assessment-form';
import { RiskAssessmentDetailsDialog } from '@/components/risk-assessment/risk-assessment-details-dialog';
import { riskAssessmentMethodsList, type DescriptiveRiskAssessmentMethod } from '@/lib/risk-assessment-config';

const RISK_ASSESSMENTS_STORAGE_KEY = 'sheild-risk-assessments-v3';

const defaultRiskControlItem = (): RiskControlItem => ({ value: "" });
const defaultRiskEntry = (): RiskEntry => ({
    risk: { value: "" },
    existingControls: [defaultRiskControlItem()],
    proposedControls: [defaultRiskControlItem()]
});
const defaultHazardEntry = (): HazardEntry => ({
    hazard: { value: "" },
    assessedRisks: [defaultRiskEntry()],
    residualRiskLevel: undefined,
});

export default function IncidentRiskPage() {
  // Incident Logging State
  const [loggedIncidents, setLoggedIncidents] = useState<Incident[]>([]);

  // Risk Assessment State
  const [loggedRiskAssessments, setLoggedRiskAssessments] = useState<RiskAssessment[]>([]);
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessment | null>(null);
  const [viewingAssessment, setViewingAssessment] = useState<RiskAssessment | null>(null);
  const [aiPrefillData, setAiPrefillData] = useState<Partial<RiskAssessment> | null>(null);
  const [isRiskFormVisible, setIsRiskFormVisible] = useState(false);
  const [isAiAssistantSectionVisible, setIsAiAssistantSectionVisible] = useState(false);

  // Load Risk Assessments from localStorage
  useEffect(() => {
    try {
      const storedAssessments = localStorage.getItem(RISK_ASSESSMENTS_STORAGE_KEY);
      if (storedAssessments) {
        const parsedAssessments: RiskAssessment[] = JSON.parse(storedAssessments);
        const migratedAssessments = parsedAssessments.map(ra => ({
          ...ra,
          hazardEntries: (ra.hazardEntries || []).map(he => ({
            ...he,
            hazard: he.hazard || defaultRiskControlItem(),
            residualRiskLevel: he.residualRiskLevel || undefined,
            assessedRisks: (he.assessedRisks || []).map(ar => ({
              ...ar,
              risk: ar.risk || { value: "" },
              existingControls: (ar.existingControls || []).map(c => typeof c === 'string' ? {value: c} : (c || defaultRiskControlItem())),
              proposedControls: (ar.proposedControls || []).map((c: any) => typeof c === 'string' ? {value: c} : (c || defaultRiskControlItem())),
            }))
          }))
        }));
        setLoggedRiskAssessments(migratedAssessments);
      }
    } catch (error) {
      console.error("Error loading risk assessments from localStorage:", error);
    }
  }, []);

  // Save Risk Assessments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RISK_ASSESSMENTS_STORAGE_KEY, JSON.stringify(loggedRiskAssessments));
    } catch (error)      {
      console.error("Error saving risk assessments to localStorage:", error);
    }
  }, [loggedRiskAssessments]);

  // Incident Logging Handlers
  const handleIncidentLogged = (incident: Incident) => {
    setLoggedIncidents(prevIncidents => [incident, ...prevIncidents]);
  };

  const getIconForType = (type: Incident['type']) => {
    switch (type) {
      case 'Incident': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'Near Miss': return <HelpCircle className="h-5 w-5 text-yellow-500" />;
      case 'Hazard': return <Activity className="h-5 w-5 text-orange-500" />; // Using Activity for Hazard as CheckCircle is for completed
      default: return null;
    }
  };

  // Risk Assessment Handlers
  const handleSaveRiskAssessment = (assessment: RiskAssessment, isEditingSubmitted: boolean) => {
    if (isEditingSubmitted && editingAssessment) {
      setLoggedRiskAssessments(prevAssessments =>
        prevAssessments.map(ra => (ra.id === assessment.id ? assessment : ra))
      );
    } else {
      setLoggedRiskAssessments(prevAssessments => [{...assessment, id: assessment.id || new Date().toISOString()}, ...prevAssessments]);
    }
    setEditingAssessment(null);
    setAiPrefillData(null);
    setIsRiskFormVisible(false);
  };

  const handleEditRiskAssessment = (assessment: RiskAssessment) => {
    setEditingAssessment(assessment);
    setAiPrefillData(null);
    setIsRiskFormVisible(true);
    setIsAiAssistantSectionVisible(false);
  };

  const handleUseAiSuggestion = (suggestion: RiskAssessmentSuggestionOutput, activityInput: string, hazardsInputFromAIForm: string) => {
    const parsedHazardTexts = hazardsInputFromAIForm.split('\\n').map(h => h.trim()).filter(h => h);
    const parsedRiskTexts = suggestion.potentialRisks.split('\\n').map(r => r.trim()).filter(r => r);
    const aiProposedControlsByCategory = suggestion.recommendedControls;
    let newHazardEntries: HazardEntry[] = [];
    const effectiveHazardTexts = parsedHazardTexts.length > 0 ? parsedHazardTexts : ["AI Suggested Hazard (Please Review)"];

    effectiveHazardTexts.forEach(hazardText => {
        const assessedRisksForThisHazard: RiskEntry[] = [];
        const effectiveRiskTexts = parsedRiskTexts.length > 0 ? parsedRiskTexts : ["AI Suggested Risk (Please Review)"];

        effectiveRiskTexts.forEach(riskText => {
            const currentProposedControls: RiskControlItem[] = [];
            (Object.keys(aiProposedControlsByCategory) as Array<keyof typeof aiProposedControlsByCategory>).forEach(categoryKey => {
              const controlsInCategory = aiProposedControlsByCategory[categoryKey];
              if (controlsInCategory && controlsInCategory.length > 0) {
                const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
                controlsInCategory.forEach(ctrl => {
                  currentProposedControls.push({ value: `${categoryName}: ${ctrl}`, id: undefined });
                });
              }
            });
            if (currentProposedControls.length === 0) { currentProposedControls.push(defaultRiskControlItem()); }
            assessedRisksForThisHazard.push({
                id: undefined, risk: { value: riskText },
                existingControls: [defaultRiskControlItem()], proposedControls: currentProposedControls,
            });
        });
        newHazardEntries.push({
            id: undefined, hazard: { value: hazardText },
            assessedRisks: assessedRisksForThisHazard.length > 0 ? assessedRisksForThisHazard : [defaultRiskEntry()],
            residualRiskLevel: undefined,
        });
    });
    if (newHazardEntries.length === 0) {
        const fallbackRiskEntry = defaultRiskEntry();
        const fallbackProposedControls: RiskControlItem[] = [];
        (Object.keys(aiProposedControlsByCategory) as Array<keyof typeof aiProposedControlsByCategory>).forEach(categoryKey => {
            const controlsInCategory = aiProposedControlsByCategory[categoryKey];
            if (controlsInCategory && controlsInCategory.length > 0) {
                const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
                controlsInCategory.forEach(ctrl => { fallbackProposedControls.push({ value: `${categoryName}: ${ctrl}`, id: undefined }); });
            }
        });
        if (fallbackProposedControls.length > 0) { fallbackRiskEntry.proposedControls = fallbackProposedControls; }
        newHazardEntries.push({
            id: undefined, hazard: {value: "AI Suggested Hazard (Please Review)"},
            assessedRisks: [fallbackRiskEntry], residualRiskLevel: undefined,
        });
    }
    setAiPrefillData({
      activity: activityInput, hazardEntries: newHazardEntries,
      methodUsed: suggestion.suggestedMethod as RiskAssessmentMethod,
      assessmentDate: new Date().toISOString(), assessor: "",
    });
    setEditingAssessment(null);
    setIsRiskFormVisible(true);
    setIsAiAssistantSectionVisible(false);
  };

  const handleAddNewRiskAssessment = () => {
    setEditingAssessment(null);
    setAiPrefillData({ activity: "", hazardEntries: [defaultHazardEntry()], assessmentDate: new Date().toISOString(), assessor: "" });
    setIsRiskFormVisible(true);
    setIsAiAssistantSectionVisible(false);
  };

  const handleCancelRiskForm = () => {
    setEditingAssessment(null);
    setAiPrefillData(null);
    setIsRiskFormVisible(false);
  }

  const escapeCsvCell = (cellValue: string | undefined | null): string => {
    if (cellValue === undefined || cellValue === null) return '';
    let stringValue = String(cellValue);
    stringValue = stringValue.replace(/"/g, '""');
    if (stringValue.includes(',') || stringValue.includes('\\n') || stringValue.includes('"')) return `"${stringValue}"`;
    return stringValue;
  };

  const handleDownloadRiskRegister = () => {
    if (loggedRiskAssessments.length === 0) { alert("No risk assessments logged yet."); return; }
    const headers = ["Assessment ID", "Activity", "Assessor", "Assessment Date", "Method Used", "Hazard", "Hazard Residual Risk", "Risk", "Control Type", "Control Measure"];
    const csvRows: string[] = [headers.join(',')];
    loggedRiskAssessments.forEach(ra => {
      const commonAssessmentData = [escapeCsvCell(ra.id), escapeCsvCell(ra.activity), escapeCsvCell(ra.assessor), escapeCsvCell(ra.assessmentDate ? format(parseISO(ra.assessmentDate), "yyyy-MM-dd") : ""), escapeCsvCell(ra.methodUsed)];
      if (ra.hazardEntries && ra.hazardEntries.length > 0) {
        ra.hazardEntries.forEach(he => {
          const hazardText = escapeCsvCell(he.hazard?.value);
          const hazardResidualRisk = escapeCsvCell(he.residualRiskLevel);
          const commonHazardData = [...commonAssessmentData, hazardText, hazardResidualRisk];
          if (he.assessedRisks && he.assessedRisks.length > 0) {
            he.assessedRisks.forEach(ar => {
              const riskText = escapeCsvCell(ar.risk?.value);
              let riskHasControls = false;
              if (ar.existingControls && ar.existingControls.length > 0) {
                ar.existingControls.forEach(cm => { if (cm?.value && cm.value.trim() !== '') { csvRows.push([...commonHazardData, riskText, "Existing", escapeCsvCell(cm.value)].join(',')); riskHasControls = true; } });
              }
              if (ar.proposedControls && ar.proposedControls.length > 0) {
                ar.proposedControls.forEach(cm => { if (cm?.value && cm.value.trim() !== '') { csvRows.push([...commonHazardData, riskText, "Proposed", escapeCsvCell(cm.value)].join(',')); riskHasControls = true; } });
              }
              if (!riskHasControls && (riskText || hazardText)) { csvRows.push([...commonHazardData, riskText, "", ""].join(',')); }
            });
          } else if (hazardText) { csvRows.push([...commonHazardData, "", "", ""].join(',')); }
        });
      } else { csvRows.push([...commonAssessmentData, "", "", "", "", ""].join(',')); }
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Risk_Register_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image src="https://placehold.co/1200x400.png" alt="Safety helmet and clipboard" layout="fill" objectFit="cover" data-ai-hint="safety management" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Incident & Risk Hub</h1>
            <p className="text-sm text-neutral-300">Log occurrences and manage risk assessments in one place.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This central hub allows you to log incidents, near misses, and hazards, as well as conduct and manage detailed risk assessments.
            All data is stored locally in your browser.
          </p>
        </CardContent>
      </Card>

      {/* Log New Occurrence Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Log New Occurrence</CardTitle>
          <CardDescription>Fill out the form below to log an incident, near miss, or hazard.</CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentForm onIncidentLogged={handleIncidentLogged} />
        </CardContent>
      </Card>

      {loggedIncidents.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recently Logged Occurrences (Session Only)</CardTitle>
            <CardDescription>This list is for demonstration and will reset on page refresh.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {loggedIncidents.slice(0, 5).map((incident) => (
                <li key={incident.id} className="p-4 border rounded-md bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIconForType(incident.type)}
                      <h3 className="font-semibold">{incident.type} at {incident.location}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(parseISO(incident.timestamp), "PPP p")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">{incident.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Region: {incident.region}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />

      {/* Risk Assessment Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Risk Assessment Management</CardTitle>
          <CardDescription>Conduct, view, and manage your risk assessments. Use AI to assist if needed.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isRiskFormVisible && (
            <div className="flex flex-wrap gap-2 mb-6 items-center">
              <Button onClick={handleAddNewRiskAssessment} className="bg-primary hover:bg-primary/90">
                <ListChecks className="mr-2 h-4 w-4" /> Conduct New Risk Assessment
              </Button>
              <Button onClick={handleDownloadRiskRegister} variant="outline" className="text-primary border-primary hover:bg-primary/10">
                <Download className="mr-2 h-4 w-4" /> Download Risk Register (CSV)
              </Button>
              <Button onClick={() => setIsAiAssistantSectionVisible(!isAiAssistantSectionVisible)} variant="outline" className="text-accent border-accent hover:bg-accent/10">
                <SparklesIcon className="mr-2 h-4 w-4" /> {isAiAssistantSectionVisible ? "Hide AI Assist" : "Show AI Assist"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><ShieldAlert className="mr-2 h-4 w-4" /> Method Notes</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 max-h-96 overflow-y-auto">
                  {(riskAssessmentMethodsList as DescriptiveRiskAssessmentMethod[]).map((method) => (
                    <DropdownMenuItem key={method.name} onSelect={(e) => e.preventDefault()}> {/* Prevent close on select */}
                       <div className="p-2">
                         <p className="font-semibold text-sm text-primary">{method.name}</p>
                         <p className="text-xs text-muted-foreground mt-1"><strong>How it works:</strong> {method.description}</p>
                         <p className="text-xs text-muted-foreground mt-1"><strong>When to use:</strong> {method.useWhen}</p>
                       </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {isRiskFormVisible && (
            <RiskAssessmentForm
              key={editingAssessment?.id || (aiPrefillData ? JSON.stringify(aiPrefillData) : 'new-risk-form')}
              onSaveAssessment={handleSaveRiskAssessment}
              initialData={editingAssessment || aiPrefillData}
              onCancel={handleCancelRiskForm}
            />
          )}

          {isAiAssistantSectionVisible && !isRiskFormVisible && (
            <RiskAssessmentAiAssistant onUseSuggestion={handleUseAiSuggestion} />
          )}

          {loggedRiskAssessments.length > 0 && !isRiskFormVisible && !isAiAssistantSectionVisible && (
            <>
              <Separator className="my-4" />
              <h3 className="text-lg font-semibold mb-3">Logged Risk Assessments</h3>
              <ScrollArea className="h-[400px]">
                <ul className="space-y-4 pr-3">
                  {loggedRiskAssessments.map((assessment) => (
                    <li key={assessment.id} className="p-4 border rounded-md bg-secondary/30">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h4 className="font-semibold text-primary mb-1 sm:mb-0 truncate max-w-md">{assessment.activity}</h4>
                        <span className="text-xs text-muted-foreground">{assessment.assessmentDate ? format(parseISO(assessment.assessmentDate), "PPP") : "N/A"}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium">Method:</span> {assessment.methodUsed || 'N/A'} | <span className="font-medium">Assessor:</span> {assessment.assessor}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setViewingAssessment(assessment)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditRiskAssessment(assessment)}><EditIcon className="mr-1 h-3 w-3" /> Edit</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </>
          )}
          {loggedRiskAssessments.length === 0 && !isRiskFormVisible && !isAiAssistantSectionVisible && (
            <p className="text-center text-muted-foreground py-4">No risk assessments logged yet. Click "Conduct New Risk Assessment" to start.</p>
          )}
        </CardContent>
      </Card>

      <RiskAssessmentDetailsDialog assessment={viewingAssessment} onClose={() => setViewingAssessment(null)} />
    </div>
  );
}
