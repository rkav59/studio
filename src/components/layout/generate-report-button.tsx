
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { generateSheReport, type SheReportInput, type SheReportOutput } from "@/ai/flows/generate-she-report-flow";
import { ScrollArea } from "../ui/scroll-area";

export function GenerateReportButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateReportClick = async () => {
    setIsLoading(true);
    setReportContent(null);

    // Simulate fetching data from various modules - use hardcoded sample data for now
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
        reportingPeriod: "Q3 2024 (Sample Data)",
      };
      const result: SheReportOutput = await generateSheReport(input);
      setReportContent(result.reportContent);
      setIsModalOpen(true); // Open modal with report content
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
        <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                AI-Generated SHE Report Summary
            </DialogTitle>
            <DialogDescription>
              Review the AI-generated SHE report summary below. This is based on sample data.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow overflow-y-auto pr-4">
            {reportContent ? (
              <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none">
                {/* Basic Markdown rendering - for more complex MD, a library might be needed */}
                {reportContent.split('\\n\\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">
                    {paragraph.split('\\n').map((line, lineIndex) => (
                        <span key={lineIndex}>
                        {line.replace(/### (.*)/g, '<h3>$1</h3>')
                             .replace(/## (.*)/g, '<h2>$1</h2>')
                             .replace(/# (.*)/g, '<h1>$1</h1>')
                             .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                             .replace(/\*(.*?)\*/g, '<em>$1</em>')
                             .replace(/^- (.*)/gm, '• $1')
                        }
                        <br />
                        </span>
                    ))}
                  </p>
                ))}
              </div>
            ) : (
              <p>No report content to display.</p>
            )}
          </ScrollArea>
          <div className="pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
