
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit2, Trash2, Eye, FileSearch, AlertTriangle, CheckCircle2, Sparkles, Loader2, Printer, Mail, Filter, Workflow, ShieldAlert, ListChecks, CheckSquare as CheckSquareIcon, Download, SparklesIcon as SparklesIconRA, HelpCircle, Activity as ActivityIcon, Siren, FileText as FileTextIcon, BookOpenCheck } from "lucide-react"; // Renamed some icons to avoid conflicts

import type { Incident, RiskAssessment, RiskAssessmentMethod, RiskAssessmentSuggestionOutput, HazardEntry, RiskControlItem, Inspection, InspectionChecklistItem, SheqAudit, AuditChecklistItem as SheqAuditChecklistItem, ChecklistItemTemplate as SheqChecklistItemTemplate, NonConformance as SheqNonConformance, AnalyzeAuditDataInput, AnalyzeAuditDataOutput, ChecklistTemplate as SheqChecklistTemplate, IncidentInvestigation, CorrectiveAction, InvestigationTechnique, SuggestRootCauseInput, SuggestRootCauseOutput, FiveWhyDetail, FishboneCategory, GenericRcaDetails, ScatDetails, AuditObservationEntry } from "@/lib/types";
import { investigationTechniques } from "@/lib/types";
import { IncidentForm } from "@/components/incident-logging/incident-form";
import { RiskAssessmentAiAssistant } from "@/components/risk-assessment/risk-assessment-ai-assistant";
import { RiskAssessmentForm } from '@/components/risk-assessment/risk-assessment-form';
import { RiskAssessmentDetailsDialog } from '@/components/risk-assessment/risk-assessment-details-dialog';
import { riskAssessmentMethodsList, type DescriptiveRiskAssessmentMethod } from '@/lib/risk-assessment-config';

import { InspectionScheduler } from "@/components/inspections/inspection-scheduler";
import { InspectionForm as InspectionsModuleInspectionForm } from "@/components/inspections/inspection-form"; // Aliased
import { defaultChecklistTemplates as defaultInspectionChecklistTemplates } from '@/lib/checklist-templates'; // For Inspections

import { InvestigationForm } from "@/components/incident-investigation/investigation-form";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as UIAlertDialogDescription, // Aliased
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as UIAlertDialogTitle, // Aliased
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription as UIOriginalAlertDescription } from '@/components/ui/alert'; // Aliased
import { suggestRootCause } from '@/ai/flows/suggest-root-cause-flow';
import { Label } from "@/components/ui/label";


// Storage Keys
const INCIDENTS_STORAGE_KEY_RMH = 'sheild-incidents-rmh-v1'; // Potentially update if structure changes
const RISK_ASSESSMENTS_STORAGE_KEY_RMH = 'sheild-risk-assessments-v3'; // Keep if structure is compatible
const INSPECTIONS_STORAGE_KEY_RMH = 'sheild-inspections-rmh-v1';
const INVESTIGATIONS_STORAGE_KEY_RMH = 'sheild-incident-investigations-v1'; // Keep if structure is compatible

// Helper for Markdown to HTML for investigation reports
function markdownToHtml(markdown: string): string {
  if (!markdown) return "<p>No content to display.</p>";
  let html = markdown;
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
  html = html.replace(new RegExp("^\\s*([*_\\-]){3,}\\s*$", "gim"), '<hr />');
  html = html.replace(/^\s*[-*+] (.*$)/gim, '<li>$1</li>');
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/gis, '<ul>$1</ul>');
  html = html.replace(/\\n/g, '\n');
  return html.split(/\n\s*\n/).map(paragraph => {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) return '';
    if (trimmedParagraph.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr|table|thead|tbody|tr|th|td)/i)) {
      return trimmedParagraph;
    }
    return `<p>${trimmedParagraph.replace(/\n/g, '<br />')}</p>`;
  }).join('');
}

// Risk Assessment Default Factories
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

const defaultInspectionChecklist: SheqAuditChecklistItem[] = [ // Using SheqAuditChecklistItem for consistency if types merge further, or use Inspections specific type
  { id: "item-1", text: "Are emergency exits clear and accessible?", status: 'Pending', observations: [] },
  { id: "item-2", text: "Are fire extinguishers in place and charged?", status: 'Pending', observations: [] },
  { id: "item-3", text: "Is PPE being used correctly?", status: 'Pending', observations: [] },
];


export default function RiskManagementHubPage() {
  const router = useRouter();
  const { toast } = useToast();

  // --- State for Incident Logging & Risk Assessment ---
  const [loggedIncidents, setLoggedIncidents] = useState<Incident[]>([]);
  const [loggedRiskAssessments, setLoggedRiskAssessments] = useState<RiskAssessment[]>([]);
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessment | null>(null);
  const [viewingAssessment, setViewingAssessment] = useState<RiskAssessment | null>(null);
  const [aiPrefillData, setAiPrefillData] = useState<Partial<RiskAssessment> | null>(null);
  const [isRiskFormVisible, setIsRiskFormVisible] = useState(false);
  const [isAiAssistantSectionVisible, setIsAiAssistantSectionVisible] = useState(false);

  // --- State for Inspections ---
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);
  
  // --- State for Incident Investigation ---
  const [investigations, setInvestigations] = useState<IncidentInvestigation[]>([]);
  const [editingInvestigation, setEditingInvestigation] = useState<IncidentInvestigation | null>(null);
  const [viewingInvestigation, setViewingInvestigation] = useState<IncidentInvestigation | null>(null);
  const [isInvestigationFormOpen, setIsInvestigationFormOpen] = useState(false); // For edit dialog
  const [isAiLoadingInvestigation, setIsAiLoadingInvestigation] = useState(false);
  const [aiSuggestionsInvestigation, setAiSuggestionsInvestigation] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportHtmlContent, setReportHtmlContent] = useState<string>("");
  const [rawReportMarkdown, setRawReportMarkdown] = useState<string>("");
  const [statusFilterInvestigation, setStatusFilterInvestigation] = useState<IncidentInvestigation['status'] | 'All'>('All');
  const [techniqueFilterInvestigation, setTechniqueFilterInvestigation] = useState<InvestigationTechnique | 'All' | ''>('All');

  // --- Data Loading Effects ---
  useEffect(() => { // Load Incidents (session only for demo for now)
    // For this merged hub, we'll also make incidents session-only to keep it simple
  }, []);

  useEffect(() => { // Load Risk Assessments
    try {
      const storedAssessments = localStorage.getItem(RISK_ASSESSMENTS_STORAGE_KEY_RMH);
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
    } catch (error) { console.error("Error loading risk assessments:", error); }
  }, []);
  useEffect(() => { // Save Risk Assessments
    try { localStorage.setItem(RISK_ASSESSMENTS_STORAGE_KEY_RMH, JSON.stringify(loggedRiskAssessments)); }
    catch (error) { console.error("Error saving risk assessments:", error); }
  }, [loggedRiskAssessments]);

  useEffect(() => { // Load Inspections
    try {
      const storedInspections = localStorage.getItem(INSPECTIONS_STORAGE_KEY_RMH);
      if (storedInspections) setInspections(JSON.parse(storedInspections));
    } catch (error) { console.error("Error loading inspections:", error); }
  }, []);
  useEffect(() => { // Save Inspections
    try { localStorage.setItem(INSPECTIONS_STORAGE_KEY_RMH, JSON.stringify(inspections)); }
    catch (error) { console.error("Error saving inspections:", error); }
  }, [inspections]);
  
  useEffect(() => { // Load Investigations
    try {
      const stored = localStorage.getItem(INVESTIGATIONS_STORAGE_KEY_RMH);
      if (stored) setInvestigations(JSON.parse(stored));
    } catch (error) { console.error("Error loading investigations:", error); }
  }, []);
  useEffect(() => { // Save Investigations
    try { localStorage.setItem(INVESTIGATIONS_STORAGE_KEY_RMH, JSON.stringify(investigations)); }
    catch (error) { console.error("Error saving investigations:", error); }
  }, [investigations]);


  // --- Handlers for Incident Logging & Risk Assessment ---
  const handleIncidentLogged = (incident: Incident) => {
    setLoggedIncidents(prevIncidents => [incident, ...prevIncidents]);
  };
  const getIconForIncidentType = (type: Incident['type']) => {
    switch (type) {
      case 'Incident': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'Near Miss': return <HelpCircle className="h-5 w-5 text-yellow-500" />;
      case 'Hazard': return <ActivityIcon className="h-5 w-5 text-orange-500" />;
      default: return null;
    }
  };
  const handleSaveRiskAssessment = (assessment: RiskAssessment, isEditingSubmitted: boolean) => {
    if (isEditingSubmitted && editingAssessment) {
      setLoggedRiskAssessments(prev => prev.map(ra => (ra.id === assessment.id ? assessment : ra)));
    } else {
      setLoggedRiskAssessments(prev => [{...assessment, id: assessment.id || crypto.randomUUID()}, ...prev]);
    }
    setEditingAssessment(null); setAiPrefillData(null); setIsRiskFormVisible(false);
  };
  const handleEditRiskAssessment = (assessment: RiskAssessment) => {
    setEditingAssessment(assessment); setAiPrefillData(null); setIsRiskFormVisible(true); setIsAiAssistantSectionVisible(false);
  };
 const handleUseAiRiskSuggestion = (suggestion: RiskAssessmentSuggestionOutput, activityInput: string, hazardsInputFromAIForm: string) => {
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
    setEditingAssessment(null); setIsRiskFormVisible(true); setIsAiAssistantSectionVisible(false);
  };
  const handleAddNewRiskAssessment = () => {
    setEditingAssessment(null); setAiPrefillData({ activity: "", hazardEntries: [defaultHazardEntry()], assessmentDate: new Date().toISOString(), assessor: "" });
    setIsRiskFormVisible(true); setIsAiAssistantSectionVisible(false);
  };
  const handleCancelRiskForm = () => { setEditingAssessment(null); setAiPrefillData(null); setIsRiskFormVisible(false); };
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

  // --- Handlers for Inspections ---
  const handleScheduleInspection = (newInspectionData: Omit<Inspection, 'id' | 'status' | 'checklist' | 'findings'>) => {
    const newInspection: Inspection = {
      id: crypto.randomUUID(),
      ...newInspectionData,
      status: "Pending",
      checklist: defaultInspectionChecklistTemplates.find(t => t.name.includes("General"))?.items.map(item => ({...item, id: `${item.id}-${Date.now()}`, completed: false })) || [],
    };
    setInspections(prev => [newInspection, ...prev]);
  };
  const handleStartInspection = (inspection: Inspection) => {
    setCurrentInspection(inspection);
  };
  const handleInspectionCompleted = (completedInspection: Inspection) => {
    setInspections(prev => prev.map(insp => insp.id === completedInspection.id ? { ...completedInspection, status: "Completed" } : insp));
    setCurrentInspection(null);
  };

  // --- Handlers for Incident Investigation ---
  const handleStartNewInvestigation = () => router.push('/risk-management-hub/investigation/new');
  const handleEditInvestigation = (investigation: IncidentInvestigation) => {
    setEditingInvestigation(investigation); setIsInvestigationFormOpen(true);
  };
  const handleDeleteInvestigation = (investigationId: string) => {
    setInvestigations(prev => prev.filter(inv => inv.id !== investigationId));
    toast({ title: "Investigation Deleted" });
  };
  const handleSaveInvestigation = (data: Omit<IncidentInvestigation, 'id'> | IncidentInvestigation) => {
    if (editingInvestigation) {
      const updatedInvestigation: IncidentInvestigation = {
        ...editingInvestigation, ...data,
        investigationDate: typeof data.investigationDate === 'string' ? data.investigationDate : (data.investigationDate as Date).toISOString(),
        correctiveActions: data.correctiveActions.map(ca => ({
          ...ca,
          dueDate: typeof ca.dueDate === 'string' ? ca.dueDate : (ca.dueDate as Date).toISOString(),
          completionDate: ca.completionDate ? (typeof ca.completionDate === 'string' ? ca.completionDate : (ca.completionDate as Date).toISOString()) : undefined,
        })),
      };
      setInvestigations(prev => prev.map(inv => inv.id === editingInvestigation.id ? updatedInvestigation : inv));
      toast({ title: "Investigation Updated" });
    }
    setIsInvestigationFormOpen(false); setEditingInvestigation(null);
  };
  const getInvestigationStatusColor = (status: IncidentInvestigation['status'] | CorrectiveAction['status']) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      case 'In Progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Review': return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300';
      case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'Closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
      case 'Overdue': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  const getInvestigationStatusIcon = (status: IncidentInvestigation['status'] | CorrectiveAction['status']) => {
    switch (status) {
      case 'Open': case 'In Progress': case 'Review': return <AlertTriangle className="h-3 w-3" />;
      case 'Completed': case 'Closed': return <CheckCircle2 className="h-3 w-3" />;
      case 'Overdue': return <AlertTriangle className="h-3 w-3 text-red-500" />; 
      default: return null;
    }
  };
  const handleAiSuggestRootCauses = async () => {
    if (!viewingInvestigation) return;
    setIsAiLoadingInvestigation(true); setAiSuggestionsInvestigation(null);
    try {
      const input: SuggestRootCauseInput = {
        incidentDescription: viewingInvestigation.investigationTitle, 
        summaryOfFindings: viewingInvestigation.summaryOfFindings,
      };
      const result: SuggestRootCauseOutput = await suggestRootCause(input);
      setAiSuggestionsInvestigation(result.suggestedRootCauses);
      toast({ title: "AI Root Cause Suggestions Received" });
    } catch (error) {
      console.error("Error getting AI root cause suggestions:", error);
      toast({ title: "AI Error", variant: "destructive" });
    } finally { setIsAiLoadingInvestigation(false); }
  };
  const formatInvestigationToMarkdown = (inv: IncidentInvestigation): string => {
    let md = `# Investigation Report: ${inv.investigationTitle}\n\n`;
    md += `**Incident ID:** ${inv.incidentId || "N/A"}\n`;
    md += `**Investigation Date:** ${inv.investigationDate ? format(parseISO(inv.investigationDate), "PPP") : "N/A"}\n`;
    md += `**Investigator(s):** ${inv.investigators || "N/A"}\n`;
    md += `**Overall Status:** ${inv.status}\n`;
    const techniqueUsed = investigationTechniques.find(t => t.name === inv.techniqueUsed);
    md += `**Technique Used:** ${techniqueUsed ? techniqueUsed.label : "N/A"}\n\n`;
    md += `## Investigation Details\n`;
    if (inv.techniqueUsed === 'FiveWhys' && inv.fiveWhysDetails?.length) {
      md += "### 5 Whys Analysis\n";
      inv.fiveWhysDetails.forEach(item => { md += `- **Why:** ${item.why}\n  - **Because:** ${item.because}\n`; });
    } else if (inv.techniqueUsed === 'GenericRCA' && inv.genericRcaDetails) {
      md += "### Generic Root Cause Analysis\n";
      const rcaDetails = inv.genericRcaDetails as GenericRcaDetails; 
      md += `**Problem Statement:** ${rcaDetails.problemStatement || "N/A"}\n`;
      md += `**Contributing Factors:**\n${rcaDetails.contributingFactors?.split('\n').map(f => `- ${f}`).join('\n') || "- N/A"}\n`;
      md += `**Root Cause Summary:** ${rcaDetails.rootCauseSummary || "N/A"}\n`;
    } else if (inv.techniqueUsed === 'FishboneIshikawa' && inv.fishboneCategories?.length) {
        md += "### Fishbone (Ishikawa) Diagram Details\n";
        inv.fishboneCategories.forEach(cat => {
            md += `**Category: ${cat.categoryName}**\n`;
            cat.causes.forEach(cause => { md += `  - ${cause.causeText}\n`; });
        });
    } else if (inv.techniqueUsed === 'SCAT' && inv.scatDetails) {
        md += "### SCAT Details\n";
        const scat = inv.scatDetails as ScatDetails; 
        md += `**Summary of Events/Unsafe Acts:**\n${scat.summaryOfEvents || "N/A"}\n\n`;
        md += `**Immediate Causes:**\n${scat.immediateCauses || "N/A"}\n\n`;
        md += `**Underlying Factors/Basic Causes:**\n${scat.underlyingFactors || "N/A"}\n\n`;
        md += `**System Deficiencies/Lack of Control:**\n${scat.systemDeficiencies || "N/A"}\n`;
    }
    md += "\n## Evidence and Witness Information\n";
    md += `**Summary of Evidence:**\n${inv.evidenceSummary || "No specific evidence summary provided."}\n\n`;
    md += `**Summary of Witness Statements:**\n${inv.witnessStatementsSummary || "No witness statement summaries provided."}\n\n`;
    md += "## Overall Summary of Findings\n";
    md += `${inv.summaryOfFindings || "N/A"}\n\n`;
    md += "## Corrective and Preventive Actions (CAPAs)\n";
    if (inv.correctiveActions?.length) {
      inv.correctiveActions.forEach(capa => {
        md += `### CAPA: ${capa.description}\n`;
        md += `- **Responsible:** ${capa.responsiblePerson}\n`;
        md += `- **Due Date:** ${capa.dueDate ? format(parseISO(capa.dueDate), "PPP") : "N/A"}\n`;
        md += `- **Status:** ${capa.status}\n`;
        if (capa.status === 'Completed' && capa.completionDate) {
          md += `- **Completed Date:** ${format(parseISO(capa.completionDate), "PPP")}\n`;
          md += `- **Verification:** ${capa.verificationNotes || "N/A"}\n`;
        }
        md += "\n";
      });
    } else { md += "No CAPAs documented.\n"; }
    return md;
  };
  const handleGenerateInvestigationReport = () => {
    if (!viewingInvestigation) return;
    const markdown = formatInvestigationToMarkdown(viewingInvestigation);
    setRawReportMarkdown(markdown); setReportHtmlContent(markdownToHtml(markdown)); setIsReportModalOpen(true);
  };
  const handlePrintInvestigationReport = () => window.print();
  const handleShareInvestigationReportViaEmail = () => {
    if (!viewingInvestigation) return;
    const subject = encodeURIComponent(`Investigation Report: ${viewingInvestigation.investigationTitle}`);
    const body = encodeURIComponent(`Please find the Investigation Report for "${viewingInvestigation.investigationTitle}" (Incident ID: ${viewingInvestigation.incidentId}) below.\n\n${rawReportMarkdown}\n\n---\nGenerated by SHEild Application.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  const filteredInvestigations = useMemo(() => {
    return investigations.filter(inv => {
      const statusMatch = statusFilterInvestigation === 'All' || inv.status === statusFilterInvestigation;
      const techniqueMatch = techniqueFilterInvestigation === 'All' || techniqueFilterInvestigation === '' || inv.techniqueUsed === techniqueFilterInvestigation;
      return statusMatch && techniqueMatch;
    });
  }, [investigations, statusFilterInvestigation, techniqueFilterInvestigation]);


  const InvestigationDetailView = ({ investigation }: { investigation: IncidentInvestigation }) => (
    <ScrollArea className="max-h-[70vh] pr-3 text-sm">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
            <div>
                <p><strong>Incident ID:</strong> {investigation.incidentId}</p>
                <p><strong>Investigation Date:</strong> {investigation.investigationDate && isValid(parseISO(investigation.investigationDate)) ? format(parseISO(investigation.investigationDate), "PPP") : "N/A"}</p>
                <p><strong>Investigator(s):</strong> {investigation.investigators || "N/A"}</p>
                <p><strong>Technique Used:</strong> {investigationTechniques.find(t => t.name === investigation.techniqueUsed)?.label || "N/A"}</p>
                <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getInvestigationStatusColor(investigation.status)}`}>{getInvestigationStatusIcon({status: investigation.status})} {investigation.status}</span></p>
            </div>
             <div className="flex flex-col gap-2">
                <Button onClick={handleAiSuggestRootCauses} disabled={isAiLoadingInvestigation} size="sm" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                    {isAiLoadingInvestigation ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>} AI: Suggest Root Causes
                </Button>
                 <Button onClick={handleGenerateInvestigationReport} size="sm" variant="outline"> <Printer className="mr-2 h-4 w-4"/> Generate Report </Button>
            </div>
        </div>
        {aiSuggestionsInvestigation && (
            <Alert variant="info" className="mt-3"> <Sparkles className="h-4 w-4" /> <AlertTitle>AI Suggested Root Causes</AlertTitle>
                <UIOriginalAlertDescription> <pre className="whitespace-pre-wrap font-mono text-xs">{aiSuggestionsInvestigation}</pre> <p className="text-xs text-muted-foreground mt-2">Review these suggestions.</p> </UIOriginalAlertDescription>
            </Alert>
        )}
        <Separator />
        {investigation.techniqueUsed === 'FiveWhys' && investigation.fiveWhysDetails && ( <div> <h4 className="font-semibold mb-1">5 Whys Details:</h4> <ul className="list-decimal list-inside space-y-1 pl-2"> {investigation.fiveWhysDetails.map(item => ( <li key={item.id}><strong>Why:</strong> {item.why} <br/><span className="text-muted-foreground"><strong>Because:</strong> {item.because}</span></li> ))} </ul> </div> )}
        {investigation.techniqueUsed === 'GenericRCA' && investigation.genericRcaDetails && ( <div> <h4 className="font-semibold mb-1">Generic RCA Details:</h4> <p><strong>Problem Statement:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.genericRcaDetails.problemStatement || "N/A"}</span></p> <p><strong>Contributing Factors:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.genericRcaDetails.contributingFactors || "N/A"}</span></p> <p><strong>Root Cause Summary:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.genericRcaDetails.rootCauseSummary || "N/A"}</span></p> </div> )}
        {investigation.techniqueUsed === 'FishboneIshikawa' && investigation.fishboneCategories && ( <div> <h4 className="font-semibold mb-1">Fishbone/Ishikawa Details:</h4> {investigation.fishboneCategories.map(cat => ( <div key={cat.id} className="mb-2"> <p><strong>Category: {cat.categoryName}</strong></p> <ul className="list-disc list-inside pl-4 text-muted-foreground"> {cat.causes.map(cause => <li key={cause.id}>{cause.causeText}</li>)} </ul> </div> ))} </div> )}
        {investigation.techniqueUsed === 'SCAT' && investigation.scatDetails && ( <div> <h4 className="font-semibold mb-1">SCAT Details:</h4> <p><strong>Summary of Events:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.scatDetails.summaryOfEvents || "N/A"}</span></p> <p><strong>Immediate Causes:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.scatDetails.immediateCauses || "N/A"}</span></p> <p><strong>Underlying Factors:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.scatDetails.underlyingFactors || "N/A"}</span></p> <p><strong>System Deficiencies:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.scatDetails.systemDeficiencies || "N/A"}</span></p> </div> )}
        <Separator /> <div> <h4 className="font-semibold mb-1">Summary of Evidence:</h4> <p className="whitespace-pre-wrap text-muted-foreground">{investigation.evidenceSummary || "N/A"}</p> </div>
        <Separator /> <div> <h4 className="font-semibold mb-1">Summary of Witness Statements:</h4> <p className="whitespace-pre-wrap text-muted-foreground">{investigation.witnessStatementsSummary || "N/A"}</p> </div>
        <Separator /> <div> <h4 className="font-semibold mb-1">Summary of Findings:</h4> <p className="whitespace-pre-wrap text-muted-foreground">{investigation.summaryOfFindings || "N/A"}</p> </div>
        <Separator /> <div> <h4 className="font-semibold mb-1">Corrective and Preventive Actions (CAPAs):</h4> {investigation.correctiveActions && investigation.correctiveActions.length > 0 ? ( <ul className="space-y-2"> {investigation.correctiveActions.map(capa => ( <li key={capa.id} className="p-2 border rounded bg-muted/30"> <p><strong>Action:</strong> {capa.description}</p> <p><strong>Responsible:</strong> {capa.responsiblePerson}</p> <p><strong>Due Date:</strong> {capa.dueDate && isValid(parseISO(capa.dueDate)) ? format(parseISO(capa.dueDate), "PPP") : "N/A"}</p> <p><strong>Status:</strong> <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getInvestigationStatusColor(capa.status)}`}>{getInvestigationStatusIcon({status: capa.status})} {capa.status}</span></p> {capa.status === 'Completed' && capa.completionDate && <p><strong>Completed:</strong> {format(parseISO(capa.completionDate), "PPP")}</p>} {capa.verificationNotes && <p><strong>Verification:</strong> {capa.verificationNotes}</p>} </li> ))} </ul> ) : <p className="text-muted-foreground italic">No CAPAs documented.</p>} </div>
      </div>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image src="https://placehold.co/1200x400.png" alt="Integrated Risk Management Concept" layout="fill" objectFit="cover" data-ai-hint="risk management gears" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Risk Management Hub</h1>
            <p className="text-sm text-neutral-300">Centralized hub for occurrences, risks, inspections, and investigations.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This unified module allows you to manage key aspects of your SHEQ system: log occurrences, conduct risk assessments, schedule and perform inspections, and carry out detailed incident investigations. All data is stored locally in your browser.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="occurrences-risks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="occurrences-risks">Occurrences & Risks</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="investigations">Investigations</TabsTrigger>
        </TabsList>

        {/* Tab 1: Occurrences & Risks */}
        <TabsContent value="occurrences-risks" className="space-y-6 mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Log New Occurrence</CardTitle>
              <CardDescription>Fill out the form below to log an incident, near miss, or hazard.</CardDescription>
            </CardHeader>
            <CardContent>
              <IncidentForm onIncidentLogged={handleIncidentLogged} />
            </CardContent>
          </Card>

          {loggedIncidents.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Recently Logged Occurrences (Session Only)</CardTitle>
                <CardDescription>This list is for demonstration and will reset on page refresh.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <ul className="space-y-3 pr-3">
                    {loggedIncidents.map((incident) => (
                      <li key={incident.id} className="p-3 border rounded-md bg-secondary/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"> {getIconForIncidentType(incident.type)} <h3 className="font-semibold">{incident.type} at {incident.location}</h3> </div>
                          <span className="text-xs text-muted-foreground">{format(parseISO(incident.timestamp), "PPP p")}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground truncate">{incident.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Region: {incident.region}</p>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
          <Separator />
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Risk Assessment Management</CardTitle>
              <CardDescription>Conduct, view, and manage your risk assessments. Use AI to assist if needed.</CardDescription>
            </CardHeader>
            <CardContent>
              {!isRiskFormVisible && (
                <div className="flex flex-wrap gap-2 mb-6 items-center">
                  <Button onClick={handleAddNewRiskAssessment} className="bg-primary hover:bg-primary/90"> <ListChecks className="mr-2 h-4 w-4" /> Conduct New Risk Assessment </Button>
                  <Button onClick={handleDownloadRiskRegister} variant="outline" className="text-primary border-primary hover:bg-primary/10"> <Download className="mr-2 h-4 w-4" /> Download Risk Register (CSV) </Button>
                  <Button onClick={() => setIsAiAssistantSectionVisible(!isAiAssistantSectionVisible)} variant="outline" className="text-accent border-accent hover:bg-accent/10"> <SparklesIconRA className="mr-2 h-4 w-4" /> {isAiAssistantSectionVisible ? "Hide AI Assist" : "Show AI Assist"} </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild> <Button variant="outline"><ShieldAlert className="mr-2 h-4 w-4" /> Method Notes</Button> </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72 max-h-96 overflow-y-auto">
                      {(riskAssessmentMethodsList as DescriptiveRiskAssessmentMethod[]).map((method) => ( <DropdownMenuItem key={method.name} onSelect={(e) => e.preventDefault()}> <div className="p-2"> <p className="font-semibold text-sm text-primary">{method.name}</p> <p className="text-xs text-muted-foreground mt-1"><strong>How:</strong> {method.description}</p> <p className="text-xs text-muted-foreground mt-1"><strong>When:</strong> {method.useWhen}</p> </div> </DropdownMenuItem> ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {isRiskFormVisible && ( <RiskAssessmentForm key={editingAssessment?.id || (aiPrefillData ? JSON.stringify(aiPrefillData) : 'new-risk-form')} onSaveAssessment={handleSaveRiskAssessment} initialData={editingAssessment || aiPrefillData} onCancel={handleCancelRiskForm} /> )}
              {isAiAssistantSectionVisible && !isRiskFormVisible && ( <RiskAssessmentAiAssistant onUseSuggestion={handleUseAiRiskSuggestion} /> )}
              {loggedRiskAssessments.length > 0 && !isRiskFormVisible && !isAiAssistantSectionVisible && (
                <> <Separator className="my-4" /> <h3 className="text-lg font-semibold mb-3">Logged Risk Assessments</h3>
                  <ScrollArea className="h-[300px]">
                    <ul className="space-y-3 pr-3">
                      {loggedRiskAssessments.map((assessment) => (
                        <li key={assessment.id} className="p-3 border rounded-md bg-secondary/30">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between"> <h4 className="font-semibold text-primary mb-1 sm:mb-0 truncate max-w-md">{assessment.activity}</h4> <span className="text-xs text-muted-foreground">{assessment.assessmentDate ? format(parseISO(assessment.assessmentDate), "PPP") : "N/A"}</span> </div>
                          <p className="mt-1 text-sm text-muted-foreground"> <span className="font-medium">Method:</span> {assessment.methodUsed || 'N/A'} | <span className="font-medium">Assessor:</span> {assessment.assessor} </p>
                          <div className="mt-3 flex flex-wrap gap-2"> <Button variant="outline" size="sm" onClick={() => setViewingAssessment(assessment)}><Eye className="mr-1 h-3 w-3" /> View</Button> <Button variant="secondary" size="sm" onClick={() => handleEditRiskAssessment(assessment)}><Edit2 className="mr-1 h-3 w-3" /> Edit</Button> </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </>
              )}
              {loggedRiskAssessments.length === 0 && !isRiskFormVisible && !isAiAssistantSectionVisible && ( <p className="text-center text-muted-foreground py-4">No risk assessments logged yet.</p> )}
            </CardContent>
          </Card>
          <RiskAssessmentDetailsDialog assessment={viewingAssessment} onClose={() => setViewingAssessment(null)} />
        </TabsContent>

        {/* Tab 2: Inspections */}
        <TabsContent value="inspections" className="space-y-6 mt-6">
          {!currentInspection ? (
            <InspectionScheduler scheduledInspections={inspections} onScheduleInspection={handleScheduleInspection} onStartInspection={handleStartInspection} />
          ) : (
            <Card className="shadow-sm">
              <CardHeader> <CardTitle>Conduct Inspection: {currentInspection.name}</CardTitle> <CardDescription> Complete the checklist and record findings for {currentInspection.location}. </CardDescription> </CardHeader>
              <CardContent> <InspectionsModuleInspectionForm inspection={currentInspection} onInspectionCompleted={handleInspectionCompleted} /> <Button variant="outline" onClick={() => setCurrentInspection(null)} className="mt-4"> Back to Scheduled Inspections </Button> </CardContent>
            </Card>
          )}
          {inspections.filter(insp => insp.status === "Completed").length > 0 && !currentInspection && (
            <> <Separator className="my-6" />
              <Card className="shadow-sm">
                <CardHeader> <CardTitle>Completed Inspections</CardTitle> <CardDescription>Recently completed inspections (session only).</CardDescription> </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <ul className="space-y-2 pr-3">
                      {inspections.filter(insp => insp.status === "Completed").slice(0,3).map(insp => ( <li key={insp.id} className="p-3 border rounded-md bg-secondary/30"> <p className="font-medium">{insp.name} - {insp.location}</p> <p className="text-xs text-muted-foreground">Completed: {insp.scheduledDate ? new Date(insp.scheduledDate).toLocaleDateString() : 'N/A'}</p> </li> ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tab 3: Investigations */}
        <TabsContent value="investigations" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div> <CardTitle className="flex items-center gap-2"><FileSearch className="h-6 w-6 text-primary"/>Investigation Register</CardTitle> <CardDescription>Manage your incident investigations. Use filters to narrow down the list.</CardDescription> </div>
                <Button onClick={handleStartNewInvestigation} className="bg-primary hover:bg-primary/90"> <PlusCircle className="mr-2 h-4 w-4" /> Start New Investigation </Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-md bg-muted/50">
                  <div className="flex-1 min-w-[150px]"> <Label htmlFor="statusFilterInv" className="text-xs font-medium">Filter by Status</Label> <Select value={statusFilterInvestigation} onValueChange={(value) => setStatusFilterInvestigation(value as IncidentInvestigation['status'] | 'All')}> <SelectTrigger id="statusFilterInv"><SelectValue placeholder="Filter by Status" /></SelectTrigger> <SelectContent> <SelectItem value="All">All Statuses</SelectItem> <SelectItem value="Open">Open</SelectItem> <SelectItem value="In Progress">In Progress</SelectItem> <SelectItem value="Review">Pending Review</SelectItem> <SelectItem value="Closed">Closed</SelectItem> </SelectContent> </Select> </div>
                  <div className="flex-1 min-w-[150px]"> <Label htmlFor="techniqueFilterInv" className="text-xs font-medium">Filter by Technique</Label> <Select value={techniqueFilterInvestigation} onValueChange={(value) => setTechniqueFilterInvestigation(value as InvestigationTechnique | 'All' | '')}> <SelectTrigger id="techniqueFilterInv"><SelectValue placeholder="Filter by Technique" /></SelectTrigger> <SelectContent> <SelectItem value="All">All Techniques</SelectItem> {investigationTechniques.map(tech => ( <SelectItem key={tech.name} value={tech.name}>{tech.label}</SelectItem> ))} </SelectContent> </Select> </div>
                </div>
                {filteredInvestigations.length === 0 ? ( <p className="text-muted-foreground text-center py-4">No investigations match filters or started yet.</p> ) : (
                    <ScrollArea className="max-h-[400px] pr-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredInvestigations.map(inv => (
                                <Card key={inv.id} className="shadow-sm flex flex-col">
                                    <CardHeader> <CardTitle className="truncate text-lg">{inv.investigationTitle}</CardTitle> <CardDescription>Incident ID: {inv.incidentId}</CardDescription> </CardHeader>
                                    <CardContent className="flex-grow text-xs space-y-1"> <p>Date: {inv.investigationDate && isValid(parseISO(inv.investigationDate)) ? format(parseISO(inv.investigationDate), "PPP") : "N/A"}</p> <p>Technique: {investigationTechniques.find(t => t.name === inv.techniqueUsed)?.label || "N/A"}</p> <p>Status: <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getInvestigationStatusColor(inv.status)}`}>{getInvestigationStatusIcon({status:inv.status})} {inv.status}</span></p> </CardContent>
                                    <CardFooter className="flex flex-wrap gap-2 justify-start border-t pt-4"> <Button variant="outline" size="sm" onClick={() => { setViewingInvestigation(inv); setAiSuggestionsInvestigation(null); }}> <Eye className="mr-1 h-3 w-3" /> View </Button> <Button variant="secondary" size="sm" onClick={() => handleEditInvestigation(inv)}> <Edit2 className="mr-1 h-3 w-3" /> Edit </Button> <AlertDialog> <AlertDialogTrigger asChild> <Button variant="destructive" size="sm"> <Trash2 className="mr-1 h-3 w-3" /> Delete </Button> </AlertDialogTrigger> <AlertDialogContent> <AlertDialogHeader> <UIAlertDialogTitle>Are you sure?</UIAlertDialogTitle> <UIAlertDialogDescription> This will permanently delete investigation "{inv.investigationTitle}". </UIAlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={() => handleDeleteInvestigation(inv.id)}> Delete Investigation </AlertDialogAction> </AlertDialogFooter> </AlertDialogContent> </AlertDialog> </AlertDialogFooter>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
          </Card>
          {editingInvestigation && isInvestigationFormOpen && ( <Dialog open={isInvestigationFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsInvestigationFormOpen(false); setEditingInvestigation(null); }}}> <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0"> <DialogHeader className="p-4 md:p-6 border-b flex-shrink-0"> <DialogTitle className="flex items-center gap-2 text-primary"> <FileSearch className="h-6 w-6"/> Edit Incident Investigation </DialogTitle> <DialogDescription> Update details of: "{editingInvestigation.investigationTitle}". </DialogDescription> </DialogHeader> <InvestigationForm initialData={editingInvestigation} onSave={handleSaveInvestigation} onCancel={() => { setIsInvestigationFormOpen(false); setEditingInvestigation(null); }} /> </DialogContent> </Dialog> )}
          {viewingInvestigation && ( <Dialog open={!!viewingInvestigation} onOpenChange={() => { setViewingInvestigation(null); setAiSuggestionsInvestigation(null); }}> <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col"> <DialogHeader> <DialogTitle className="flex items-center gap-2 text-primary"> <FileSearch className="h-6 w-6"/> {viewingInvestigation.investigationTitle} </DialogTitle> <DialogDescription> Details of the incident investigation. </DialogDescription> </DialogHeader> <InvestigationDetailView investigation={viewingInvestigation} /> <DialogFooter className="pt-4 border-t"> <DialogClose asChild> <Button variant="outline">Close</Button> </DialogClose> </DialogFooter> </DialogContent> </Dialog> )}
          {isReportModalOpen && ( <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}> <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col"> <DialogHeader> <DialogTitle className="flex items-center gap-2"> <Printer className="h-6 w-6 text-primary" /> Investigation Report </DialogTitle> <DialogDescription> Review the generated report. </DialogDescription> </DialogHeader> <ScrollArea className="flex-grow my-4 pr-2"> <div id="she-report-print-area" className="prose dark:prose-invert prose-sm sm:prose-base max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: reportHtmlContent || "<p>No report content.</p>" }} /> </ScrollArea> <DialogFooter className="pt-4 border-t gap-2 flex-wrap justify-end"> <UIOriginalAlertDescription className="text-xs print-hide w-full mb-2 sm:mb-0 text-muted-foreground"> To share as PDF, first use "Print / Save as PDF", then "Share via Email" and attach. </UIOriginalAlertDescription> <Button variant="outline" onClick={handlePrintInvestigationReport} className="print-hide"> <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF </Button> <Button variant="outline" onClick={handleShareInvestigationReportViaEmail} className="print-hide"> <Mail className="mr-2 h-4 w-4" /> Share via Email </Button> <DialogClose asChild className="print-hide"> <Button variant="outline">Close</Button> </DialogClose> </DialogFooter> </DialogContent> </Dialog> )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

    