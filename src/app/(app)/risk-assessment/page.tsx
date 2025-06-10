
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ShieldAlert, ListChecks, CheckSquare, Eye, Edit, Download, InfoIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";

import type { RiskAssessment, RiskAssessmentMethod, RiskAssessmentSuggestionOutput, HazardEntry, RiskEntry, RiskControlItem } from "@/lib/types";
import { RiskAssessmentAiAssistant } from "@/components/risk-assessment/risk-assessment-ai-assistant";
import { RiskAssessmentForm } from '@/components/risk-assessment/risk-assessment-form';
import { riskAssessmentMethodsList, type DescriptiveRiskAssessmentMethod } from '@/lib/risk-assessment-config';

const LOCAL_STORAGE_KEY = 'sheild-risk-assessments-v2'; 

const stringToRiskControlItems = (str: string | undefined | null): RiskControlItem[] => {
  if (!str) return []; // Return empty array if no string
  const lines = str.split('\n').map(line => ({ value: line.trim() })).filter(item => item.value);
  return lines.length > 0 ? lines : []; // Return empty if only whitespace lines
};

const defaultRiskControlItem = (): RiskControlItem => ({ value: "" });
const defaultRiskEntry = (): RiskEntry => ({ 
    risk: defaultRiskControlItem(), 
    existingControls: [], // Start empty for AI prefill
    proposedControls: []  // Start empty for AI prefill
});
const defaultHazardEntry = (): HazardEntry => ({ 
    hazard: defaultRiskControlItem(), 
    assessedRisks: [defaultRiskEntry()] 
});


export default function RiskAssessmentPage() {
  const [loggedRiskAssessments, setLoggedRiskAssessments] = useState<RiskAssessment[]>([]);
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessment | null>(null);
  const [viewingAssessment, setViewingAssessment] = useState<RiskAssessment | null>(null);
  const [aiPrefillData, setAiPrefillData] = useState<Partial<RiskAssessment> | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isAiAssistantVisible, setIsAiAssistantVisible] = useState(true);


  useEffect(() => {
    try {
      const storedAssessments = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedAssessments) {
        const parsedAssessments: RiskAssessment[] = JSON.parse(storedAssessments);
        // Basic migration/check for new control structure
        const migratedAssessments = parsedAssessments.map(ra => ({
          ...ra,
          hazardEntries: ra.hazardEntries.map(he => ({
            ...he,
            assessedRisks: he.assessedRisks.map(ar => ({
              ...ar,
              existingControls: ar.existingControls || [],
              proposedControls: ar.proposedControls || (ar as any).controlMeasures || [], // Move old controlMeasures to proposed
            }))
          }))
        }));
        setLoggedRiskAssessments(migratedAssessments);

      } else {
        const oldStoredAssessments = localStorage.getItem('sheild-risk-assessments');
        if (oldStoredAssessments) {
          console.warn("SHEild: Risk assessment data structure has been updated. Old data from 'sheild-risk-assessments' will not be migrated automatically and has been cleared for the new format. Please re-enter if needed.");
          localStorage.removeItem('sheild-risk-assessments');
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
    setIsAiAssistantVisible(true);
  };

  const handleEditAssessment = (assessment: RiskAssessment) => {
    setEditingAssessment(assessment);
    setAiPrefillData(null); 
    setIsFormVisible(true);
    setIsAiAssistantVisible(false);
  };

  const handleViewAssessment = (assessment: RiskAssessment) => {
    setViewingAssessment(assessment);
  };

  const handleUseAiSuggestion = (suggestion: RiskAssessmentSuggestionOutput, activityInput: string, hazardsInput: string) => {
    const prefillHazardEntry: HazardEntry = {
      hazard: { value: hazardsInput || "AI Suggested Hazard (Please Review)" },
      assessedRisks: [
        {
          risk: { value: suggestion.potentialRisks || "AI Suggested Risk (Please Review)" },
          existingControls: [], // AI suggestions go to proposed by default
          proposedControls: stringToRiskControlItems(suggestion.recommendedControls),
        },
      ],
    };

    setAiPrefillData({
      activity: activityInput,
      hazardEntries: [prefillHazardEntry],
      methodUsed: suggestion.suggestedMethod as RiskAssessmentMethod,
      assessmentDate: new Date().toISOString(),
      assessor: "",
      residualRiskLevel: undefined, // User must set this
    });
    setEditingAssessment(null);
    setIsFormVisible(true);
    setIsAiAssistantVisible(false);
  };
  
  const handleAddNewAssessment = () => {
    setEditingAssessment(null);
    setAiPrefillData({ 
        activity: "",
        hazardEntries: [defaultHazardEntry()], 
        assessmentDate: new Date().toISOString(),
        assessor: "",
        residualRiskLevel: undefined,
    });
    setIsFormVisible(true);
    setIsAiAssistantVisible(false);
  };

  const handleCancelForm = () => {
    setEditingAssessment(null);
    setAiPrefillData(null);
    setIsFormVisible(false);
    setIsAiAssistantVisible(true);
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
      "Assessment ID", "Activity", "Assessor", "Assessment Date", "Method Used", "Residual Risk Level",
      "Hazard", "Risk", "Control Type", "Control Measure"
    ];

    const csvRows: string[] = [headers.join(',')];

    loggedRiskAssessments.forEach(ra => {
      const commonData = [
        escapeCsvCell(ra.id),
        escapeCsvCell(ra.activity),
        escapeCsvCell(ra.assessor),
        escapeCsvCell(ra.assessmentDate ? format(new Date(ra.assessmentDate), "yyyy-MM-dd") : ""),
        escapeCsvCell(ra.methodUsed),
        escapeCsvCell(ra.residualRiskLevel)
      ];

      if (ra.hazardEntries && ra.hazardEntries.length > 0) {
        ra.hazardEntries.forEach(he => {
          const hazardText = escapeCsvCell(he.hazard.value);
          if (he.assessedRisks && he.assessedRisks.length > 0) {
            he.assessedRisks.forEach(ar => {
              const riskText = escapeCsvCell(ar.risk.value);
              
              if (ar.existingControls && ar.existingControls.length > 0) {
                ar.existingControls.forEach(cm => {
                  const controlText = escapeCsvCell(cm.value);
                  csvRows.push([...commonData, hazardText, riskText, "Existing", controlText].join(','));
                });
              } else if (!ar.proposedControls || ar.proposedControls.length === 0) {
                 // If no existing and no proposed controls, still add a row for the risk
                csvRows.push([...commonData, hazardText, riskText, "", ""].join(','));
              }

              if (ar.proposedControls && ar.proposedControls.length > 0) {
                ar.proposedControls.forEach(cm => {
                  const controlText = escapeCsvCell(cm.value);
                  csvRows.push([...commonData, hazardText, riskText, "Proposed", controlText].join(','));
                });
              }
            });
          } else {
            csvRows.push([...commonData, hazardText, "", "", ""].join(','));
          }
        });
      } else {
        csvRows.push([...commonData, "", "", "", ""].join(','));
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
            alt="Risk assessment process"
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
            Utilize various methodologies and leverage AI assistance for comprehensive analysis.
          </p>
        </CardContent>
      </Card>

      {!isFormVisible && (
        <div className="flex flex-wrap gap-2 mb-6">
            <Button onClick={handleAddNewAssessment} className="bg-primary hover:bg-primary/90">
            <ListChecks className="mr-2 h-4 w-4" /> Log New Risk Assessment
            </Button>
            <Button onClick={handleDownloadRegister} variant="outline" className="text-primary border-primary hover:bg-primary/10">
                <Download className="mr-2 h-4 w-4" /> Download Risk Register (CSV)
            </Button>
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
          <CardContent>
            <RiskAssessmentForm
              key={editingAssessment?.id || (aiPrefillData ? JSON.stringify(aiPrefillData) : 'new-form')}
              onSaveAssessment={handleSaveAssessment}
              initialData={editingAssessment || aiPrefillData}
              onCancel={handleCancelForm}
            />
          </CardContent>
        </Card>
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
                     <p className="mt-1 text-sm">
                      <span className="font-medium">Residual Risk:</span> 
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${assessment.residualRiskLevel === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : ''}
                        ${assessment.residualRiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' : ''}
                        ${assessment.residualRiskLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' : ''}
                      `}>
                        {assessment.residualRiskLevel}
                      </span>
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

      {isAiAssistantVisible && <RiskAssessmentAiAssistant onUseSuggestion={handleUseAiSuggestion} />}


      <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <ShieldAlert className="h-6 w-6 text-primary"/>
            Risk Management Techniques
          </CardTitle>
          <CardDescription>Consider these established methodologies for your assessments. Click to learn more.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(riskAssessmentMethodsList as DescriptiveRiskAssessmentMethod[]).map((method) => (
              <Dialog key={method.name}>
                 <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto justify-start p-3 text-left hover:shadow-md transition-shadow bg-secondary/30 hover:bg-secondary/50">
                        <span className="font-semibold text-primary">{method.name}</span>
                    </Button>
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
          </div>
        </CardContent>
      </Card>

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
                        <CardTitle className="text-base text-primary">Hazard {hIndex + 1}: {hazardEntry.hazard.value}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-1 pl-4 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Assessed Risks for this Hazard:</p>
                        {hazardEntry.assessedRisks && hazardEntry.assessedRisks.length > 0 ? (
                          hazardEntry.assessedRisks.map((riskEntry, rIndex) => (
                            <div key={riskEntry.id || `risk-${hIndex}-${rIndex}`} className="pl-3 border-l-2 border-secondary space-y-2">
                              <p className="text-sm font-semibold">Risk {rIndex + 1}: {riskEntry.risk.value}</p>
                              
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Existing Control Measures:</p>
                                {riskEntry.existingControls && riskEntry.existingControls.length > 0 ? (
                                  <ul className="list-disc list-inside pl-3 text-sm text-muted-foreground">
                                    {riskEntry.existingControls.map((control, cIndex) => (
                                      <li key={control.id || `existing-control-${hIndex}-${rIndex}-${cIndex}`}>{control.value}</li>
                                    ))}
                                  </ul>
                                ) : <p className="text-xs text-muted-foreground italic">No existing controls listed.</p>}
                              </div>

                              <div>
                                <p className="text-xs font-medium text-muted-foreground mt-1">Proposed Control Measures:</p>
                                {riskEntry.proposedControls && riskEntry.proposedControls.length > 0 ? (
                                  <ul className="list-disc list-inside pl-3 text-sm text-muted-foreground">
                                    {riskEntry.proposedControls.map((control, cIndex) => (
                                      <li key={control.id || `proposed-control-${hIndex}-${rIndex}-${cIndex}`}>{control.value}</li>
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
               
               <Separator />
              <div>
                <p className="text-sm font-medium">Overall Residual Risk Level:</p>
                <p className={`px-2 py-0.5 rounded-full text-xs font-semibold inline-block
                    ${viewingAssessment.residualRiskLevel === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : ''}
                    ${viewingAssessment.residualRiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' : ''}
                    ${viewingAssessment.residualRiskLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' : ''}
                  `}>
                    {viewingAssessment.residualRiskLevel}
                  </p>
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

