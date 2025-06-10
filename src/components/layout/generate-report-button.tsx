
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Sparkles, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { generateSheReport, type SheReportInput, type SheReportOutput } from "@/ai/flows/generate-she-report-flow";
import { ScrollArea } from "../ui/scroll-area";

// Basic Markdown to HTML converter
function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // Headers (process from h3 to h1 to avoid ### being caught by #)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>'); // Alternative bold

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>'); // Alternative italic

  // Unordered lists
  // Convert lines starting with - or * to <li>
  html = html.replace(/^\s*[-*+] (.*$)/gim, '<li>$1</li>');
  // Wrap consecutive <li> blocks with <ul>. This is a simplified approach.
  // A more robust parser would handle nested lists and mixed content better.
  // This regex attempts to group consecutive <li> items.
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/gis, '<ul>$1</ul>');
  
  // Replace escaped newlines (from AI potentially) with actual newlines for paragraph splitting
  html = html.replace(/\\n/g, '\n');

  // Paragraphs (split by double newlines, then wrap non-block elements)
  return html.split(/\n\s*\n/).map(paragraph => {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) return '';
    // Check if it's already a block element (header or list)
    if (trimmedParagraph.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/i)) {
      return trimmedParagraph;
    }
    return `<p>${trimmedParagraph}</p>`;
  }).join('');
}


export function GenerateReportButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportingPeriod, setReportingPeriod] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateReportClick = async () => {
    setIsLoading(true);
    setReportContent(null);
    const currentReportingPeriod = `Q${Math.floor((new Date().getMonth() / 3) + 1)} ${new Date().getFullYear()} (Sample Data)`;
    setReportingPeriod(currentReportingPeriod);

    const sampleIncidentSummary = `
- Total Incidents: 15 (5 major, 10 minor)
- Key Trends: Increase in slips, trips, and falls in Warehouse B. 2 near misses related to forklift operations.
- Significant Events: Minor chemical spill in Lab A (no injuries, procedure followed).
    `;
    const sampleInspectionSummary = `
- Inspections Conducted: 35 (20 scheduled, 15 ad-hoc)
- Common Findings: 10 instances of blocked emergency exits, 5 fire extinguishers out of date.
- Overdue Actions: 3 critical actions pending from last quarter's site safety audit.
    `;
    const sampleRiskAssessmentSummary = `
- New Risk Assessments: 5 (including for new welding process and manual handling procedure update).
- Significant Risks: High risk identified for 'working at height' on new construction phase. Medium risk for 'chemical exposure' in new R&D lab.
- Control Measures: Implemented new guardrail system for height work. Enhanced PPE requirements for lab.
    `;
    const sampleSafetyInitiatives = `
- 'Zero Harm' campaign launched in Q3, focusing on proactive hazard reporting.
- 250 employees completed mandatory fire safety training.
- Near-miss reporting drive resulted in a 20% increase in reports.
    `;

    try {
      const input: SheReportInput = {
        incidentSummary: sampleIncidentSummary,
        inspectionSummary: sampleInspectionSummary,
        riskAssessmentSummary: sampleRiskAssessmentSummary,
        safetyInitiativesSummary: sampleSafetyInitiatives,
        reportingPeriod: currentReportingPeriod,
      };
      const result: SheReportOutput = await generateSheReport(input);
      setReportContent(result.reportContent);
      setIsModalOpen(true);
      toast({
        title: "SHE Report Generated",
        description: "The AI-generated SHE report summary is ready for review.",
      });
    } catch (error) {
      console.error("Error generating SHE report:", error);
      toast({
        title: "Error Generating Report",
        description: "Failed to generate the SHE report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <>
      <Button onClick={handleGenerateReportClick} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Generate SHE Report
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                AI-Generated SHE Report Summary
            </DialogTitle>
            <DialogDescription>
              Review the AI-generated SHE report summary for {reportingPeriod}. You can print this summary or save it as a PDF.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow my-4 pr-2">
            <div id="she-report-print-area" className="prose dark:prose-invert prose-sm sm:prose-base max-w-none leading-relaxed"
                 dangerouslySetInnerHTML={{ __html: reportContent ? markdownToHtml(reportContent) : "<p>No report content to display.</p>" }} />
          </ScrollArea>
          
          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="mr-2 h-4 w-4" />
              Print / Save as PDF
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
