
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { RiskAssessment, HazardEntry, RiskControlItem } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { InfoIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UICardDescription } from "@/components/ui/card";


interface RiskAssessmentDetailsDialogProps {
  assessment: RiskAssessment | null;
  onClose: () => void;
}

export function RiskAssessmentDetailsDialog({ assessment, onClose }: RiskAssessmentDetailsDialogProps) {
  if (!assessment) return null;

  return (
    <Dialog open={!!assessment} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <InfoIcon className="h-6 w-6 text-primary"/>
            Risk Assessment Details
          </DialogTitle>
          <DialogDescription>
            Activity: {assessment.activity}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Assessment Date:</p>
                <p className="text-sm text-muted-foreground">{assessment.assessmentDate ? format(parseISO(assessment.assessmentDate), "PPP") : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Assessor(s):</p>
                <p className="text-sm text-muted-foreground">{assessment.assessor}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Method Used:</p>
                <p className="text-sm text-muted-foreground">{assessment.methodUsed || 'N/A'}</p>
              </div>
            </div>
            <Separator />

            <div className="space-y-4">
              <p className="text-sm font-medium">Hazard Entries:</p>
              {assessment.hazardEntries && assessment.hazardEntries.length > 0 ? (
                assessment.hazardEntries.map((hazardEntry, hIndex) => (
                  <Card key={hazardEntry.id || `hazard-${hIndex}`} className="p-3 bg-muted/50">
                    <CardHeader className="p-1 mb-2">
                      <CardTitle className="text-base text-primary">Hazard {hIndex + 1}: {hazardEntry.hazard?.value || 'N/A'}</CardTitle>
                      <UICardDescription>
                          Residual Risk for this Hazard:
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                              ${hazardEntry.residualRiskLevel === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' : ''}
                              ${hazardEntry.residualRiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' : ''}
                              ${hazardEntry.residualRiskLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' : ''}
                          `}>
                              {hazardEntry.residualRiskLevel || 'N/A'}
                          </span>
                      </UICardDescription>
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
        </ScrollArea>
        <DialogFooter className="pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
