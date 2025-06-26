
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Sparkles, Printer, Mail } from "lucide-react";
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
import { Alert, AlertDescription } from "../ui/alert";

// Enhanced Markdown to HTML converter
function markdownToHtml(markdown: string): string {
  if (!markdown) return "<p>No report content to display.</p>";

  let html = markdown;

  // Headers (process from h3 to h1 to avoid ### being caught by #)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
  
  // Horizontal Rules
  html = html.replace(/^\s*([-*_]){3,}\s*$/gim, '<hr />');

  // Unordered lists
  html = html.replace(/^\s*[-*+] (.*$)/gim, '<li>$1</li>');
  // Wrap consecutive <li> blocks with <ul>.
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/gis, '<ul>$1</ul>');
  
  // Replace escaped newlines with actual newlines for paragraph splitting
  html = html.replace(/\\n/g, '\n');

  // Paragraphs (split by double newlines, then wrap non-block elements)
  // Ensure that lines that are already part of a list or header are not re-wrapped in <p>
  return html.split(/\n\s*\n/).map(paragraph => {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) return '';
    if (!(trimmedParagraph.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr|table|thead|tbody|tr|th|td)/i as RegExp))) {
      // If it's already a block element or part of one, return as is
      return trimmedParagraph;
    }
    // Otherwise, wrap in <p>
    return `<p>${trimmedParagraph.replace(/\n/g, '<br />')}</p>`; // Convert single newlines within paragraphs to <br>
  }).join('');
}


export function GenerateReportButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [rawReportContent, setRawReportContent] = useState<string>(""); // For email body
  const [reportingPeriod, setReportingPeriod] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateReportClick = async () => {
    setIsLoading(true);
    setReportContent(null);
    setRawReportContent("");
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
      setRawReportContent(result.reportContent); // Store raw markdown for email
      setReportContent(markdownToHtml(result.reportContent)); // Convert to HTML for dialog
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

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(`SHE Report - ${reportingPeriod}`);
    const body = encodeURIComponent(
`Please find the SHE Report summary for ${reportingPeriod} below.

You can also save this report as a PDF using the "Print / Save as PDF" option in the application and attach it to this email.

---
${rawReportContent}
---

Generated by SHEiQpro Application.
`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Button 
        onClick={handleGenerateReportClick} 
        disabled={isLoading} 
        size="icon" 
        title="Generate SHE Report"
        className="bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                AI-Generated SHE Report Summary
            </DialogTitle>
            <DialogDescription>
              Review the AI-generated SHE report summary for {reportingPeriod}. You can print, save as PDF, or share this summary.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow my-4 pr-2">
            <div id="she-report-print-area" className="prose dark:prose-invert prose-sm sm:prose-base max-w-none leading-relaxed"
                 dangerouslySetInnerHTML={{ __html: reportContent || "<p>No report content to display.</p>" }} />
          </ScrollArea>
          
          <DialogFooter className="pt-4 border-t gap-2 flex-wrap justify-end">
            <Alert variant="info" className="text-xs print-hide w-full mb-2 sm:mb-0">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                    To share as a PDF via email, first use "Print / Save as PDF", then use "Share via Email" and attach the saved PDF.
                </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={handlePrintReport} className="print-hide">
              <Printer className="mr-2 h-4 w-4" />
              Print / Save as PDF
            </Button>
            <Button variant="outline" onClick={handleShareViaEmail} className="print-hide">
              <Mail className="mr-2 h-4 w-4" />
              Share via Email
            </Button>
            <DialogClose asChild className="print-hide">
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
