

"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ShieldAlert, ListChecks, CheckSquare, Eye, Edit, Download, InfoIcon, SparklesIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { RiskAssessment, RiskAssessmentMethod, RiskAssessmentSuggestionOutput, HazardEntry, RiskEntry, RiskControlItem } from "@/lib/types";
import { RiskAssessmentAiAssistant } from "@/components/risk-assessment/risk-assessment-ai-assistant";
import { RiskAssessmentForm } from '@/components/risk-assessment/risk-assessment-form';
import { riskAssessmentMethodsList, type DescriptiveRiskAssessmentMethod } from '@/lib/risk-assessment-config';
import { ScrollArea } from "@/components/ui/scroll-area"; // Added ScrollArea import

const LOCAL_STORAGE_KEY = 'sheild-risk-assessments-v3';


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


export default function RiskAssessmentPage() {
  const [loggedRiskAssessments, setLoggedRiskAssessments] = useState<RiskAssessment[]>([]);
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessment | null>(null);
  const [viewingAssessment, setViewingAssessment] = useState<RiskAssessment | null>(null);
  const [aiPrefillData, setAiPrefillData] = useState<Partial<RiskAssessment> | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isAiAssistantSectionVisible, setIsAiAssistantSectionVisible] = useState(false);


  useEffect(() => {
    try {
      const storedAssessments = localStorage.getItem(LOCAL_STORAGE_KEY);
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

      } else {
        // Clear old version data if new key is not found
        const oldV2Key = 'sheild-risk-assessments-v2';
        const oldV1Key = 'sheild-risk-assessments';
        if (localStorage.getItem(oldV2Key)) {
            console.warn(`SHEild: Risk assessment data structure has been updated. Old data from '${oldV2Key}' will not be migrated and has been cleared. Please re-enter if needed.`);
            localStorage.removeItem(oldV2Key);
        }
        if (localStorage.getItem(oldV1Key)) {
             console.warn(`SHEild: Risk assessment data structure has been updated. Old data from '${oldV1Key}' will not be migrated and has been cleared. Please re-enter if needed.`);
            localStorage.removeItem(oldV1Key);
        }
      }
    } catch (error) {
      console.error("Error loading risk assessments from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loggedRiskAssessments));
    } catch (error)      {
      console.error("Error saving risk assessments to localStorage:", error);
      alert("Could not save risk assessments. Your browser's local storage might be full or an error occurred.");
    }
  }, [loggedRiskAssessments]);

  const handleSaveAssessment = (assessment: RiskAssessment, isEditingSubmitted: boolean) => {
    if (isEditingSubmitted && editingAssessment) {
      setLoggedRiskAssessments(prevAssessments =>
        prevAssessments.map(ra => (ra.id === assessment.id ? assessment : ra))
      );
    } else {
      setLoggedRiskAssessments(prevAssessments => [{...assessment, id: assessment.id || new Date().toISOString()}, ...prevAssessments]);
    }
    setEditingAssessment(null);
    setAiPrefillData(null);
    setIsFormVisible(false);
  };

  const handleEditAssessment = (assessment: RiskAssessment) => {
    setEditingAssessment(assessment);
    setAiPrefillData(null);
    setIsFormVisible(true);
    setIsAiAssistantSectionVisible(false); 
  };

  const handleViewAssessment = (assessment: RiskAssessment) => {
    setViewingAssessment(assessment);
  };

  const handleUseAiSuggestion = (suggestion: RiskAssessmentSuggestionOutput, activityInput: string, hazardsInputFromAIForm: string) => {
    const parsedHazardTexts = hazardsInputFromAIForm.split('\n').map(h => h.trim()).filter(h => h);
    const parsedRiskTexts = suggestion.potentialRisks.split('\n').map(r => r.trim()).filter(r => r);
    
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
            
            if (currentProposedControls.length === 0) {
                currentProposedControls.push(defaultRiskControlItem());
            }

            assessedRisksForThisHazard.push({
                id: undefined, 
                risk: { value: riskText },
                existingControls: [defaultRiskControlItem()], 
                proposedControls: currentProposedControls,
            });
        });
        
        newHazardEntries.push({
            id: undefined, 
            hazard: { value: hazardText },
            assessedRisks: assessedRisksForThisHazard.length > 0 ? assessedRisksForThisHazard : [defaultRiskEntry()],
            residualRiskLevel: undefined, // Needs to be set by user for each hazard
        });
    });
    
    if (newHazardEntries.length === 0) { 
        const fallbackRiskEntry = defaultRiskEntry();
        const fallbackProposedControls: RiskControlItem[] = [];
        (Object.keys(aiProposedControlsByCategory) as Array<keyof typeof aiProposedControlsByCategory>).forEach(categoryKey => {
            const controlsInCategory = aiProposedControlsByCategory[categoryKey];
            if (controlsInCategory && controlsInCategory.length > 0) {
                const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
                controlsInCategory.forEach(ctrl => {
                    fallbackProposedControls.push({ value: `${categoryName}: ${ctrl}`, id: undefined });
                });
            }
        });
        if (fallbackProposedControls.length > 0) {
            fallbackRiskEntry.proposedControls = fallbackProposedControls;
        }

        newHazardEntries.push({
            id: undefined,
            hazard: {value: "AI Suggested Hazard (Please Review)"},
            assessedRisks: [fallbackRiskEntry],
            residualRiskLevel: undefined,
        });
    }

    setAiPrefillData({
      activity: activityInput,
      hazardEntries: newHazardEntries,
      methodUsed: suggestion.suggestedMethod as RiskAssessmentMethod,
      assessmentDate: new Date().toISOString(),
      assessor: "", 
    });
    setEditingAssessment(null);
    setIsFormVisible(true);
    setIsAiAssistantSectionVisible(false); 
  };

  const handleAddNewAssessment = () => {
    setEditingAssessment(null);
    setAiPrefillData({
        activity: "",
        hazardEntries: [defaultHazardEntry()], 
        assessmentDate: new Date().toISOString(),
        assessor: "",
    });
    setIsFormVisible(true);
    setIsAiAssistantSectionVisible(false); 
  };

  const handleCancelForm = () => {
    setEditingAssessment(null);
    setAiPrefillData(null);
    setIsFormVisible(false);
  }

  const escapeCsvCell = (cellValue: string | undefined | null): string => {
    if (cellValue === undefined || cellValue === null) {
      return '';
    }
    let stringValue = String(cellValue);
    stringValue = stringValue.replace(/"/g, '""');
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue}"`;
    }
    return stringValue;
  };

  const handleDownloadRegister = () => {
    if (loggedRiskAssessments.length === 0) {
      alert("No risk assessments logged yet to download.");
      return;
    }

    const headers = [
      "Assessment ID", "Activity", "Assessor", "Assessment Date", "Method Used", 
      "Hazard", "Hazard Residual Risk", "Risk", "Control Type", "Control Measure"
    ];

    const csvRows: string[] = [headers.join(',')];

    loggedRiskAssessments.forEach(ra => {
      const commonAssessmentData = [
        escapeCsvCell(ra.id),
        escapeCsvCell(ra.activity),
        escapeCsvCell(ra.assessor),
        escapeCsvCell(ra.assessmentDate ? format(new Date(ra.assessmentDate), "yyyy-MM-dd") : ""),
        escapeCsvCell(ra.methodUsed),
      ];

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
                ar.existingControls.forEach(cm => {
                  if (cm?.value && cm.value.trim() !== '') {
                    const controlText = escapeCsvCell(cm.value);
                    csvRows.push([...commonHazardData, riskText, "Existing", controlText].join(','));
                    riskHasControls = true;
                  }
                });
              }

              if (ar.proposedControls && ar.proposedControls.length > 0) {
                ar.proposedControls.forEach(cm => {
                   if (cm?.value && cm.value.trim() !== '') {
                    const controlText = escapeCsvCell(cm.value);
                    csvRows.push([...commonHazardData, riskText, "Proposed", controlText].join(','));
                    riskHasControls = true;
                  }
                });
              }
              
              if (!riskHasControls && (riskText || hazardText)) { 
                  csvRows.push([...commonHazardData, riskText, "", ""].join(','));
              }
            });
          } else if (hazardText) { 
            csvRows.push([...commonHazardData, "", "", ""].join(','));
          }
        });
      } else { 
        csvRows.push([...commonAssessmentData, "", "", "", "", ""].join(','));
      }
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Risk Assessment</h1>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image
            src="https://placehold.co/1200x400.png"
            alt="Safety professional analyzing risk charts on a computer"
            layout="fill"
            objectFit="cover"
            data-ai-hint="risk analysis"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h2 className="text-2xl font-semibold text-white font-headline">Identify and Mitigate Risks</h2>
            <p className="text-sm text-neutral-300">Systematically evaluate workplace hazards and implement effective controls by linking hazards, risks, and controls.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module helps you conduct thorough risk assessments. Document activity, identify specific hazards, assess associated risks, and define existing and proposed control measures for each.
            Utilize various methodologies and leverage AI assistance for comprehensive analysis. Each hazard will have its own residual risk level.
          </p>
        </CardContent>
      </Card>

      {!isFormVisible && (
        <div className="flex flex-wrap gap-2 mb-6 items-center">
            <Button onClick={handleAddNewAssessment} className="bg-primary hover:bg-primary/90">
            <ListChecks className="mr-2 h-4 w-4" /> Log New Risk Assessment
            </Button>
            <Button onClick={handleDownloadRegister} variant="outline" className="text-primary border-primary hover:bg-primary/10">
                <Download className="mr-2 h-4 w-4" /> Download Risk Register (CSV)
            </Button>
            <Button 
                onClick={() => setIsAiAssistantSectionVisible(!isAiAssistantSectionVisible)} 
                variant="outline" 
                className="text-accent border-accent hover:bg-accent/10"
            >
                <SparklesIcon className="mr-2 h-4 w-4" /> 
                {isAiAssistantSectionVisible ? "Hide AI Assist Tools" : "Show AI Assist Tools"}
            </Button>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Brief notes on the different risk assessment methods
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 max-h-96 overflow-y-auto">
                {(riskAssessmentMethodsList as DescriptiveRiskAssessmentMethod[]).map((method) => (
                  <Dialog key={method.name}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        {method.name}
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-primary">{method.name}</DialogTitle>
                        </DialogHeader>
                        <div className="py-2 space-y-2 text-sm max-h-[60vh] overflow-y-auto">
                            <p><strong>How it works:</strong> {method.description}</p>
                            <p><strong>When to use:</strong> {method.useWhen}</p>
                        </div>
                         <div className="pt-4 border-t">
                            <DialogClose asChild>
                                <Button variant="outline">Close</Button>
                            </DialogClose>
                        </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )}

      {isFormVisible && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-primary" />
              {editingAssessment ? "Edit Risk Assessment" : "Log New Risk Assessment"}
            </CardTitle>
            <CardDescription>
              {editingAssessment ? "Modify the details below." : "Fill out the form to document a new risk assessment, linking hazards, risks, and controls."}
               {aiPrefillData && !editingAssessment && " (Partially pre-filled with AI suggestions. Please review and complete.)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[75vh] flex flex-col overflow-hidden"> {/* Constrain height and setup flex */}
            <RiskAssessmentForm
              key={editingAssessment?.id || (aiPrefillData ? JSON.stringify(aiPrefillData) : 'new-form')}
              onSaveAssessment={handleSaveAssessment}
              initialData={editingAssessment || aiPrefillData}
              onCancel={handleCancelForm}
              className="flex-grow min-h-0" // Allow form to grow and its ScrollArea to work
            />
          </CardContent>
        </Card>
      )}

      {isAiAssistantSectionVisible && !isFormVisible && (
          <RiskAssessmentAiAssistant onUseSuggestion={handleUseAiSuggestion} />
      )}


      {loggedRiskAssessments.length > 0 && !isFormVisible && (
        <>
          <Separator className="my-8" />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-6 w-6 text-primary" />
                Logged Risk Assessments
              </CardTitle>
              <CardDescription>Review and manage your documented risk assessments. Data is stored in your browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {loggedRiskAssessments.map((assessment) => (
                  <li key={assessment.id} className="p-4 border rounded-md bg-secondary/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold text-primary mb-1 sm:mb-0">{assessment.activity.length > 50 ? `${assessment.activity.substring(0,50)}...` : assessment.activity}</h3>
                      <span className="text-xs text-muted-foreground">
                        {assessment.assessmentDate ? format(new Date(assessment.assessmentDate), "PPP") : "N/A"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium">Method:</span> {assessment.methodUsed || 'N/A'} | <span className="font-medium">Assessor:</span> {assessment.assessor}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewAssessment(assessment)}>
                            <Eye className="mr-1 h-3 w-3" /> View Details
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEditAssessment(assessment)}>
                            <Edit className="mr-1 h-3 w-3" /> Edit
                        </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}


      {viewingAssessment && (
        <Dialog open={!!viewingAssessment} onOpenChange={() => setViewingAssessment(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <InfoIcon className="h-6 w-6 text-primary"/>
                Risk Assessment Details
              </DialogTitle>
              <DialogDescription>
                Activity: {viewingAssessment.activity}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Assessment Date:</p>
                  <p className="text-sm text-muted-foreground">{viewingAssessment.assessmentDate ? format(new Date(viewingAssessment.assessmentDate), "PPP") : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Assessor(s):</p>
                  <p className="text-sm text-muted-foreground">{viewingAssessment.assessor}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Method Used:</p>
                  <p className="text-sm text-muted-foreground">{viewingAssessment.methodUsed || 'N/A'}</p>
                </div>
              </div>
               <Separator />

              <div className="space-y-4">
                <p className="text-sm font-medium">Hazard Entries:</p>
                {viewingAssessment.hazardEntries && viewingAssessment.hazardEntries.length > 0 ? (
                  viewingAssessment.hazardEntries.map((hazardEntry, hIndex) => (
                    <Card key={hazardEntry.id || `hazard-${hIndex}`} className="p-3 bg-muted/50">
                      <CardHeader className="p-1 mb-2">
                        <CardTitle className="text-base text-primary">Hazard {hIndex + 1}: {hazardEntry.hazard?.value || 'N/A'}</CardTitle>
                        <CardDescription>
                            Residual Risk for this Hazard:
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                                ${hazardEntry.residualRiskLevel === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : ''}
                                ${hazardEntry.residualRiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' : ''}
                                ${hazardEntry.residualRiskLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' : ''}
                            `}>
                                {hazardEntry.residualRiskLevel || 'N/A'}
                            </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-1 pl-4 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Assessed Risks for this Hazard:</p>
                        {hazardEntry.assessedRisks && hazardEntry.assessedRisks.length > 0 ? (
                          hazardEntry.assessedRisks.map((riskEntry, rIndex) => (
                            <div key={riskEntry.id || `risk-${hIndex}-${rIndex}`} className="pl-3 border-l-2 border-secondary space-y-2">
                              <p className="text-sm font-semibold">Risk {rIndex + 1}: {riskEntry.risk?.value || '(No description provided)'}</p>

                              <div>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Existing Control Measures:</p>
                                {riskEntry.existingControls && riskEntry.existingControls.length > 0 && riskEntry.existingControls.some(c => c.value && c.value.trim() !== '') ? (
                                  <ul className="list-disc list-inside pl-3 text-sm text-muted-foreground">
                                    {riskEntry.existingControls.filter(c => c.value && c.value.trim() !== '').map((control, cIndex) => (
                                      <li key={control.id || `existing-control-${hIndex}-${rIndex}-${cIndex}`}>{control.value || 'N/A'}</li>
                                    ))}
                                  </ul>
                                ) : <p className="text-xs text-muted-foreground italic">No existing controls listed.</p>}
                              </div>

                              <div>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Proposed Control Measures:</p>
                                {riskEntry.proposedControls && riskEntry.proposedControls.length > 0 && riskEntry.proposedControls.some(c => c.value && c.value.trim() !== '') ? (
                                  <ul className="list-disc list-inside pl-3 text-sm text-muted-foreground">
                                    {riskEntry.proposedControls.filter(c => c.value && c.value.trim() !== '').map((control, cIndex) => (
                                      <li key={control.id || `proposed-control-${hIndex}-${rIndex}-${cIndex}`}>{control.value || 'N/A'}</li>
                                    ))}
                                  </ul>
                                ) : <p className="text-xs text-muted-foreground italic">No proposed controls listed.</p>}
                              </div>
                            </div>
                          ))
                        ) : <p className="text-xs text-muted-foreground italic">No specific risks listed for this hazard.</p>}
                      </CardContent>
                    </Card>
                  ))
                ) : <p className="text-sm text-muted-foreground italic">No hazard entries documented.</p>}
              </div>
            </div>
            <div className="pt-4 border-t flex justify-end">
                 <Button variant="outline" onClick={() => setViewingAssessment(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

