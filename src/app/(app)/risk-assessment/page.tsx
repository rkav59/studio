
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ShieldAlert, ListChecks, CheckSquare, Eye, Edit, Download, InfoIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Removed DialogTrigger as it's handled by button click

import type { RiskAssessment, RiskAssessmentMethod, RiskAssessmentSuggestionOutput } from "@/lib/types";
import { RiskAssessmentAiAssistant } from "@/components/risk-assessment/risk-assessment-ai-assistant";
import { RiskAssessmentForm } from '@/components/risk-assessment/risk-assessment-form';
import { riskAssessmentMethodsList, type DescriptiveRiskAssessmentMethod } from '@/lib/risk-assessment-config';

const LOCAL_STORAGE_KEY = 'sheild-risk-assessments';

export default function RiskAssessmentPage() {
  const [loggedRiskAssessments, setLoggedRiskAssessments] = useState<RiskAssessment[]>([]);
  const [editingAssessment, setEditingAssessment] = useState<RiskAssessment | null>(null);
  const [viewingAssessment, setViewingAssessment] = useState<RiskAssessment | null>(null);
  const [aiPrefillData, setAiPrefillData] = useState<Partial<RiskAssessment> | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    try {
      const storedAssessments = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedAssessments) {
        setLoggedRiskAssessments(JSON.parse(storedAssessments));
      }
    } catch (error) {
      console.error("Error loading risk assessments from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loggedRiskAssessments));
    } catch (error) {
      console.error("Error saving risk assessments to localStorage:", error);
    }
  }, [loggedRiskAssessments]);

  const handleSaveAssessment = (assessment: RiskAssessment, isEditing: boolean) => {
    if (isEditing) {
      setLoggedRiskAssessments(prevAssessments =>
        prevAssessments.map(ra => (ra.id === assessment.id ? assessment : ra))
      );
    } else {
      setLoggedRiskAssessments(prevAssessments => [assessment, ...prevAssessments]);
    }
    setEditingAssessment(null);
    setAiPrefillData(null); 
    setIsFormVisible(false); 
  };

  const handleEditAssessment = (assessment: RiskAssessment) => {
    setEditingAssessment(assessment);
    setAiPrefillData(null); 
    setIsFormVisible(true);
  };

  const handleViewAssessment = (assessment: RiskAssessment) => {
    setViewingAssessment(assessment);
  };

  const handleUseAiSuggestion = (suggestion: RiskAssessmentSuggestionOutput, activityInput: string, hazardsInput: string) => {
    setAiPrefillData({
      activity: activityInput,
      identifiedHazards: hazardsInput,
      assessedRisks: suggestion.potentialRisks,
      controlMeasures: suggestion.recommendedControls,
      methodUsed: suggestion.suggestedMethod as RiskAssessmentMethod,
    });
    setEditingAssessment(null); 
    setIsFormVisible(true); 
  };
  
  const handleAddNewAssessment = () => {
    setEditingAssessment(null);
    setAiPrefillData(null);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setEditingAssessment(null);
    setAiPrefillData(null);
    setIsFormVisible(false);
  }

  const escapeCsvField = (field: string | undefined | null): string => {
    if (field === undefined || field === null) {
      return '';
    }
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const handleDownloadRegister = () => {
    if (loggedRiskAssessments.length === 0) {
      alert("No risk assessments logged yet to download.");
      return;
    }

    const headers = [
      "ID", "Activity", "Assessor", "Assessment Date", "Method Used",
      "Identified Hazards", "Assessed Risks", "Control Measures", "Residual Risk Level"
    ];

    const csvRows = [
      headers.join(','),
      ...loggedRiskAssessments.map(ra => [
        escapeCsvField(ra.id),
        escapeCsvField(ra.activity),
        escapeCsvField(ra.assessor),
        escapeCsvField(ra.assessmentDate ? format(new Date(ra.assessmentDate), "yyyy-MM-dd") : ""),
        escapeCsvField(ra.methodUsed),
        escapeCsvField(ra.identifiedHazards),
        escapeCsvField(ra.assessedRisks),
        escapeCsvField(ra.controlMeasures),
        escapeCsvField(ra.residualRiskLevel)
      ].join(','))
    ];

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
            <p className="text-sm text-neutral-300">Systematically evaluate workplace hazards and implement effective controls.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module helps you conduct thorough risk assessments to ensure a safe working environment. 
            Utilize various methodologies, log your findings, and leverage AI assistance for comprehensive analysis.
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

      {(isFormVisible || editingAssessment || aiPrefillData) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-primary" />
              {editingAssessment ? "Edit Risk Assessment" : "Log New Risk Assessment"}
            </CardTitle>
            <CardDescription>
              {editingAssessment ? "Modify the details below." : "Fill out the form below to document a new risk assessment."}
               {aiPrefillData && !editingAssessment && " (Pre-filled with AI suggestions)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiskAssessmentForm
              key={editingAssessment?.id || (aiPrefillData ? 'ai-form' : 'new-form')}
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

      <RiskAssessmentAiAssistant onUseSuggestion={handleUseAiSuggestion} />

      <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <ShieldAlert className="h-6 w-6 text-primary"/>
            Risk Management Techniques
          </CardTitle>
          <CardDescription>Consider these established methodologies for your assessments. Click to learn more.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(riskAssessmentMethodsList as DescriptiveRiskAssessmentMethod[]).map((method) => (
              <Dialog key={method.name}>
                 <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-auto justify-start p-3 text-left hover:shadow-md transition-shadow bg-secondary/30 hover:bg-secondary/50">
                        <div className="flex flex-col">
                            <span className="font-semibold text-primary">{method.name}</span>
                        </div>
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
          <DialogContent className="sm:max-w-2xl">
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
              <div className="space-y-1">
                <p className="text-sm font-medium">Assessment Date:</p>
                <p className="text-sm text-muted-foreground">{viewingAssessment.assessmentDate ? format(new Date(viewingAssessment.assessmentDate), "PPP") : "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Assessor(s):</p>
                <p className="text-sm text-muted-foreground">{viewingAssessment.assessor}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Assessment Method Used:</p>
                <p className="text-sm text-muted-foreground">{viewingAssessment.methodUsed || 'N/A'}</p>
              </div>
               <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">Identified Hazards:</p>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-2 rounded-md">{viewingAssessment.identifiedHazards}</pre>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Assessed Risks:</p>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-2 rounded-md">{viewingAssessment.assessedRisks}</pre>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Control Measures:</p>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-2 rounded-md">{viewingAssessment.controlMeasures}</pre>
              </div>
               <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">Residual Risk Level:</p>
                <p className={`px-2 py-0.5 rounded-full text-xs font-semibold inline-block
                    ${viewingAssessment.residualRiskLevel === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : ''}
                    ${viewingAssessment.residualRiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' : ''}
                    ${viewingAssessment.residualRiskLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' : ''}
                  `}>
                    {viewingAssessment.residualRiskLevel}
                  </p>
              </div>
            </div>
            <div className="pt-4 border-t">
                 <Button variant="outline" onClick={() => setViewingAssessment(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
