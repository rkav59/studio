
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, Eye, FileSearch, AlertTriangle, CheckCircle2, Sparkles, Loader2, Printer, Mail, Filter, Workflow } from "lucide-react";
import type { IncidentInvestigation, CorrectiveAction, InvestigationTechnique, SuggestRootCauseInput, SuggestRootCauseOutput, FiveWhyDetail, FishboneCategory, FishboneCause, GenericRcaDetails, ScatDetails } from "@/lib/types";
import { investigationTechniques } from "@/lib/types";
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from '@/components/ui/alert'; 
import { suggestRootCause } from '@/ai/flows/suggest-root-cause-flow';
import { Label } from "@/components/ui/label"; // Added missing import


const INVESTIGATIONS_STORAGE_KEY = 'sheild-incident-investigations-v1';

// Helper for Markdown to HTML for report
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
  html = html.replace(/^\s*([-*_]){3,}\s*$/gim, '<hr />';
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


export default function IncidentInvestigationPage() {
  const router = useRouter(); // Initialize router
  const { toast } = useToast();
  const [investigations, setInvestigations] = useState<IncidentInvestigation[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false); // This state now only controls the edit dialog
  const [editingInvestigation, setEditingInvestigation] = useState<IncidentInvestigation | null>(null);
  const [viewingInvestigation, setViewingInvestigation] = useState<IncidentInvestigation | null>(null);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportHtmlContent, setReportHtmlContent] = useState<string>("");
  const [rawReportMarkdown, setRawReportMarkdown] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<IncidentInvestigation['status'] | 'All'>('All');
  const [techniqueFilter, setTechniqueFilter] = useState<InvestigationTechnique | 'All' | ''>('All');


  useEffect(() => {
    try {
      const storedInvestigations = localStorage.getItem(INVESTIGATIONS_STORAGE_KEY);
      if (storedInvestigations) {
        setInvestigations(JSON.parse(storedInvestigations));
      }
    } catch (error) {
      console.error("Error loading investigations from localStorage:", error);
      toast({ title: "Error", description: "Could not load investigations.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem(INVESTIGATIONS_STORAGE_KEY, JSON.stringify(investigations));
    } catch (error) {
      console.error("Error saving investigations to localStorage:", error);
    }
  }, [investigations]);

  const handleStartNewInvestigation = () => {
    router.push('/incident-investigation/new'); // Navigate to the new investigation page
  };

  const handleEditInvestigation = (investigation: IncidentInvestigation) => {
    setEditingInvestigation(investigation);
    setIsFormOpen(true); // Open dialog for editing
  };

  const handleDeleteInvestigation = (investigationId: string) => {
    setInvestigations(prev => prev.filter(inv => inv.id !== investigationId));
    toast({ title: "Investigation Deleted", description: "The incident investigation has been deleted." });
  };

  // This function now primarily handles updates for existing investigations
  const handleSaveInvestigation = (data: Omit<IncidentInvestigation, 'id'> | IncidentInvestigation) => {
    if (editingInvestigation) { // This implies it's an update
      const updatedInvestigation: IncidentInvestigation = {
        ...editingInvestigation, // Spread existing ID and other fields
        ...data, // Spread new form data
        // Ensure dates are in ISO string format if InvestigationForm provides Date objects
        investigationDate: typeof data.investigationDate === 'string' ? data.investigationDate : (data.investigationDate as Date).toISOString(),
        correctiveActions: data.correctiveActions.map(ca => ({
          ...ca,
          dueDate: typeof ca.dueDate === 'string' ? ca.dueDate : (ca.dueDate as Date).toISOString(),
          completionDate: ca.completionDate ? (typeof ca.completionDate === 'string' ? ca.completionDate : (ca.completionDate as Date).toISOString()) : undefined,
        })),
      };
      setInvestigations(prev => prev.map(inv => inv.id === editingInvestigation.id ? updatedInvestigation : inv));
      toast({ title: "Investigation Updated", description: `Investigation "${updatedInvestigation.investigationTitle}" has been updated.` });
    }
    // Creation is handled by the new page
    setIsFormOpen(false);
    setEditingInvestigation(null);
  };

  const getStatusColor = (status: IncidentInvestigation['status'] | CorrectiveAction['status']) => {
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
  
  const getStatusIcon = (status: IncidentInvestigation['status'] | CorrectiveAction['status']) => {
    switch (status) {
      case 'Open':
      case 'In Progress':
      case 'Review':
        return <AlertTriangle className="h-3 w-3" />;
      case 'Completed':
      case 'Closed':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'Overdue':
        return <AlertTriangle className="h-3 w-3 text-red-500" />; 
      default: return null;
    }
  };
  
  const handleAiSuggestRootCauses = async () => {
    if (!viewingInvestigation) return;
    setIsAiLoading(true);
    setAiSuggestions(null);
    try {
      const input: SuggestRootCauseInput = {
        incidentDescription: viewingInvestigation.investigationTitle, 
        summaryOfFindings: viewingInvestigation.summaryOfFindings,
      };
      const result: SuggestRootCauseOutput = await suggestRootCause(input);
      setAiSuggestions(result.suggestedRootCauses);
      toast({
        title: "AI Root Cause Suggestions",
        description: "AI has provided potential root causes. Review them below.",
        duration: 7000,
      });
    } catch (error) {
      console.error("Error getting AI root cause suggestions:", error);
      toast({ title: "AI Error", description: "Failed to get AI suggestions.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
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
      inv.fiveWhysDetails.forEach(item => {
        md += `- **Why:** ${item.why}\n  - **Because:** ${item.because}\n`;
      });
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
            cat.causes.forEach(cause => {
            md += `  - ${cause.causeText}\n`;
            });
        });
    } else if (inv.techniqueUsed === 'SCAT' && inv.scatDetails) {
        md += "### SCAT Details\n";
        const scat = inv.scatDetails as ScatDetails; 
        md += `**Summary of Events/Unsafe Acts:**\n${scat.summaryOfEvents || "N/A"}\n\n`;
        md += `**Immediate Causes:**\n${scat.immediateCauses || "N/A"}\n\n`;
        md += `**Underlying Factors/Basic Causes:**\n${scat.underlyingFactors || "N/A"}\n\n`;
        md += `**System Deficiencies/Lack of Control:**\n${scat.systemDeficiencies || "N/A"}\n`;
    }
    md += "\n";

    md += "## Evidence and Witness Information\n";
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
    } else {
      md += "No CAPAs documented.\n";
    }
    return md;
  };

  const handleGenerateReport = () => {
    if (!viewingInvestigation) return;
    const markdown = formatInvestigationToMarkdown(viewingInvestigation);
    setRawReportMarkdown(markdown);
    setReportHtmlContent(markdownToHtml(markdown));
    setIsReportModalOpen(true);
  };

  const handlePrintReport = () => window.print();
  const handleShareReportViaEmail = () => {
    if (!viewingInvestigation) return;
    const subject = encodeURIComponent(`Investigation Report: ${viewingInvestigation.investigationTitle}`);
    const body = encodeURIComponent(
      `Please find the Investigation Report for "${viewingInvestigation.investigationTitle}" (Incident ID: ${viewingInvestigation.incidentId}) below.\n\n${rawReportMarkdown}\n\n---\nGenerated by SHEild Application.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const filteredInvestigations = useMemo(() => {
    return investigations.filter(inv => {
      const statusMatch = statusFilter === 'All' || inv.status === statusFilter;
      const techniqueMatch = techniqueFilter === 'All' || techniqueFilter === '' || inv.techniqueUsed === techniqueFilter;
      return statusMatch && techniqueMatch;
    });
  }, [investigations, statusFilter, techniqueFilter]);


  const InvestigationDetailView = ({ investigation }: { investigation: IncidentInvestigation }) => (
    <ScrollArea className="max-h-[70vh] pr-3 text-sm">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
            <div>
                <p><strong>Incident ID:</strong> {investigation.incidentId}</p>
                <p><strong>Investigation Date:</strong> {investigation.investigationDate && isValid(parseISO(investigation.investigationDate)) ? format(parseISO(investigation.investigationDate), "PPP") : "N/A"}</p>
                <p><strong>Investigator(s):</strong> {investigation.investigators || "N/A"}</p>
                <p><strong>Technique Used:</strong> {investigationTechniques.find(t => t.name === investigation.techniqueUsed)?.label || "N/A"}</p>
                <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusColor(investigation.status)}`}>{getStatusIcon({status: investigation.status})} {investigation.status}</span></p>
            </div>
             <div className="flex flex-col gap-2">
                <Button onClick={handleAiSuggestRootCauses} disabled={isAiLoading} size="sm" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                    AI: Suggest Root Causes
                </Button>
                 <Button onClick={handleGenerateReport} size="sm" variant="outline">
                    <Printer className="mr-2 h-4 w-4"/> Generate Report
                </Button>
            </div>
        </div>
        
        {aiSuggestions && (
            <Alert variant="info" className="mt-3">
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI Suggested Root Causes</AlertTitle>
                <UIAlertDescription>
                    <pre className="whitespace-pre-wrap font-mono text-xs">{aiSuggestions}</pre>
                    <p className="text-xs text-muted-foreground mt-2">Review these suggestions and incorporate them into your analysis as appropriate.</p>
                </UIAlertDescription>
            </Alert>
        )}

        <Separator />
        
        {investigation.techniqueUsed === 'FiveWhys' && investigation.fiveWhysDetails && (
          <div>
            <h4 className="font-semibold mb-1">5 Whys Details:</h4>
            <ul className="list-decimal list-inside space-y-1 pl-2">
              {investigation.fiveWhysDetails.map(item => (
                <li key={item.id}><strong>Why:</strong> {item.why} <br/><span className="text-muted-foreground"><strong>Because:</strong> {item.because}</span></li>
              ))}
            </ul>
          </div>
        )}
        
        {investigation.techniqueUsed === 'GenericRCA' && investigation.genericRcaDetails && (
          <div>
            <h4 className="font-semibold mb-1">Generic RCA Details:</h4>
            <p><strong>Problem Statement:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.genericRcaDetails.problemStatement || "N/A"}</span></p>
            <p><strong>Contributing Factors:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.genericRcaDetails.contributingFactors || "N/A"}</span></p>
            <p><strong>Root Cause Summary:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.genericRcaDetails.rootCauseSummary || "N/A"}</span></p>
          </div>
        )}

        {investigation.techniqueUsed === 'FishboneIshikawa' && investigation.fishboneCategories && (
          <div>
            <h4 className="font-semibold mb-1">Fishbone/Ishikawa Details:</h4>
            {investigation.fishboneCategories.map(cat => (
              <div key={cat.id} className="mb-2">
                <p><strong>Category: {cat.categoryName}</strong></p>
                <ul className="list-disc list-inside pl-4 text-muted-foreground">
                  {cat.causes.map(cause => <li key={cause.id}>{cause.causeText}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {investigation.techniqueUsed === 'SCAT' && investigation.scatDetails && (
           <div>
            <h4 className="font-semibold mb-1">SCAT Details:</h4>
            <p><strong>Summary of Events:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.scatDetails.summaryOfEvents || "N/A"}</span></p>
            <p><strong>Immediate Causes:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.scatDetails.immediateCauses || "N/A"}</span></p>
            <p><strong>Underlying Factors:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.scatDetails.underlyingFactors || "N/A"}</span></p>
             <p><strong>System Deficiencies:</strong><br/><span className="whitespace-pre-wrap text-muted-foreground">{investigation.scatDetails.systemDeficiencies || "N/A"}</span></p>
          </div>
        )}
        <Separator />
         <div>
            <h4 className="font-semibold mb-1">Summary of Evidence:</h4>
            <p className="whitespace-pre-wrap text-muted-foreground">{investigation.evidenceSummary || "N/A"}</p>
        </div>
         <Separator />
         <div>
            <h4 className="font-semibold mb-1">Summary of Witness Statements:</h4>
            <p className="whitespace-pre-wrap text-muted-foreground">{investigation.witnessStatementsSummary || "N/A"}</p>
        </div>

        <Separator />
        <div>
            <h4 className="font-semibold mb-1">Summary of Findings:</h4>
            <p className="whitespace-pre-wrap text-muted-foreground">{investigation.summaryOfFindings || "N/A"}</p>
        </div>
        <Separator />
        <div>
            <h4 className="font-semibold mb-1">Corrective and Preventive Actions (CAPAs):</h4>
            {investigation.correctiveActions && investigation.correctiveActions.length > 0 ? (
                <ul className="space-y-2">
                {investigation.correctiveActions.map(capa => (
                    <li key={capa.id} className="p-2 border rounded bg-muted/30">
                    <p><strong>Action:</strong> {capa.description}</p>
                    <p><strong>Responsible:</strong> {capa.responsiblePerson}</p>
                    <p><strong>Due Date:</strong> {capa.dueDate && isValid(parseISO(capa.dueDate)) ? format(parseISO(capa.dueDate), "PPP") : "N/A"}</p>
                    <p><strong>Status:</strong> <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusColor(capa.status)}`}>{getStatusIcon({status: capa.status})} {capa.status}</span></p>
                    {capa.status === 'Completed' && capa.completionDate && <p><strong>Completed:</strong> {format(parseISO(capa.completionDate), "PPP")}</p>}
                    {capa.verificationNotes && <p><strong>Verification:</strong> {capa.verificationNotes}</p>}
                    </li>
                ))}
                </ul>
            ) : <p className="text-muted-foreground italic">No CAPAs documented.</p>}
        </div>
      </div>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
          <Image 
            src="https://placehold.co/1200x400.png" 
            alt="Investigators at a scene" 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="investigation team"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Incident Investigation</h1>
            <p className="text-sm text-neutral-300">Thoroughly investigate incidents to learn and prevent recurrence.</p>
          </div>
        </div>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            This module provides tools for conducting detailed incident investigations. 
            Select an investigation technique, document findings, identify root causes, and manage corrective and preventive actions (CAPA).
            AI assistance can help suggest root causes, and a printable report can be generated.
            New investigations are created on a dedicated page.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2"><FileSearch className="h-6 w-6 text-primary"/>Investigation Register</CardTitle>
                <CardDescription>Manage your incident investigations. Use filters to narrow down the list. All data is stored locally.</CardDescription>
            </div>
            <Button onClick={handleStartNewInvestigation} className="bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Start New Investigation
            </Button>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-md bg-muted/50">
              <div className="flex-1 min-w-[150px]">
                <Label htmlFor="statusFilter" className="text-xs font-medium">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IncidentInvestigation['status'] | 'All')}>
                  <SelectTrigger id="statusFilter">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Review">Pending Review</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label htmlFor="techniqueFilter" className="text-xs font-medium">Filter by Technique</Label>
                <Select value={techniqueFilter} onValueChange={(value) => setTechniqueFilter(value as InvestigationTechnique | 'All' | '')}>
                  <SelectTrigger id="techniqueFilter">
                    <SelectValue placeholder="Filter by Technique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Techniques</SelectItem>
                    {investigationTechniques.map(tech => (
                      <SelectItem key={tech.name} value={tech.name}>{tech.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredInvestigations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No investigations match your current filters, or no investigations started yet.</p>
            ) : (
                <ScrollArea className="max-h-[600px] pr-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredInvestigations.map(inv => (
                            <Card key={inv.id} className="shadow-md flex flex-col">
                                <CardHeader>
                                    <CardTitle className="truncate text-lg">{inv.investigationTitle}</CardTitle>
                                    <CardDescription>Incident ID: {inv.incidentId}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow text-xs space-y-1">
                                    <p>Date: {inv.investigationDate && isValid(parseISO(inv.investigationDate)) ? format(parseISO(inv.investigationDate), "PPP") : "N/A"}</p>
                                    <p>Technique: {investigationTechniques.find(t => t.name === inv.techniqueUsed)?.label || "N/A"}</p>
                                    <p>Status: <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getStatusColor(inv.status)}`}>{getStatusIcon({status:inv.status})} {inv.status}</span></p>
                                </CardContent>
                                <CardFooter className="flex flex-wrap gap-2 justify-start border-t pt-4">
                                    <Button variant="outline" size="sm" onClick={() => { setViewingInvestigation(inv); setAiSuggestions(null); }}>
                                        <Eye className="mr-1 h-3 w-3" /> View
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => handleEditInvestigation(inv)}>
                                        <Edit2 className="mr-1 h-3 w-3" /> Edit
                                    </Button>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="mr-1 h-3 w-3" /> Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the investigation "{inv.investigationTitle}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteInvestigation(inv.id)}>
                                                Delete Investigation
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
      </Card>

    {/* Dialog for EDITING an existing investigation */}
    {editingInvestigation && isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsFormOpen(false); setEditingInvestigation(null); }}}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0"> {/* p-0 because form will handle its internal padding */}
                 <DialogHeader className="p-4 md:p-6 border-b flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-primary">
                        <FileSearch className="h-6 w-6"/>
                        Edit Incident Investigation
                    </DialogTitle>
                    <DialogDescription>
                        Update the details of investigation: "{editingInvestigation.investigationTitle}".
                    </DialogDescription>
                </DialogHeader>
                <InvestigationForm
                    initialData={editingInvestigation}
                    onSave={handleSaveInvestigation} // This will be an update operation
                    onCancel={() => { setIsFormOpen(false); setEditingInvestigation(null); }}
                />
            </DialogContent>
        </Dialog>
    )}

    {viewingInvestigation && (
        <Dialog open={!!viewingInvestigation} onOpenChange={() => { setViewingInvestigation(null); setAiSuggestions(null); }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-primary">
                        <FileSearch className="h-6 w-6"/>
                        {viewingInvestigation.investigationTitle}
                    </DialogTitle>
                    <DialogDescription>
                        Details of the incident investigation.
                    </DialogDescription>
                </DialogHeader>
                <InvestigationDetailView investigation={viewingInvestigation} />
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
      
      {isReportModalOpen && (
        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Printer className="h-6 w-6 text-primary" />
                    Investigation Report
                </DialogTitle>
                <DialogDescription>
                Review the generated report. You can print or share it.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow my-4 pr-2">
                <div id="she-report-print-area" className="prose dark:prose-invert prose-sm sm:prose-base max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: reportHtmlContent || "<p>No report content.</p>" }} />
            </ScrollArea>
            <DialogFooter className="pt-4 border-t gap-2 flex-wrap justify-end">
                <UIAlertDescription className="text-xs print-hide w-full mb-2 sm:mb-0 text-muted-foreground">
                     To share as a PDF via email, first use "Print / Save as PDF", then use "Share via Email" and attach the saved PDF.
                </UIAlertDescription>
                <Button variant="outline" onClick={handlePrintReport} className="print-hide">
                <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
                </Button>
                <Button variant="outline" onClick={handleShareReportViaEmail} className="print-hide">
                <Mail className="mr-2 h-4 w-4" /> Share via Email
                </Button>
                <DialogClose asChild className="print-hide">
                <Button variant="outline">Close</Button>
                </DialogClose>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
      
      <Separator className="my-8"/>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Investigation Tools - Features</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mt-2 mb-2">
                This module now includes:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Creation of new investigations on a dedicated page.</li>
                <li>Editing of existing investigations in a dialog.</li>
                <li>Structured investigation logging with choice of technique (5 Whys, Generic RCA, simplified Fishbone & SCAT).</li>
                <li>Detailed CAPA (Corrective and Preventive Action) tracking for each investigation.</li>
                <li>Textual fields for summarizing evidence and witness statements (actual uploads require backend).</li>
                <li>AI-assisted root cause suggestion based on incident details and findings.</li>
                <li>Printable investigation report generation (Markdown based).</li>
                <li>Client-side filtering of the investigation register by status and technique.</li>
                <li>Local storage of all investigation data.</li>
            </ul>
            <Separator className="my-4"/>
             <p className="text-sm text-muted-foreground mt-2 mb-2">
                Future backend-dependent enhancements could include:
            </p>
             <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>More interactive visual tools for Fishbone diagrams.</li>
                <li>Secure evidence file uploads (photos, documents).</li>
                <li>Trend analysis of investigation findings and CAPA effectiveness across multiple investigations.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}

    