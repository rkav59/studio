
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UiCardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, PlusCircle, Trash2, Activity, Users, Briefcase, ShieldCheck, BarChart, ShieldAlert, ListChecks, Zap, Lightbulb } from "lucide-react"; 
import type { ManualRiskAssessment, RiskAssessmentControl, Likelihood, Severity, RiskLevel, ManualHazard } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { likelihoodLevels, severityLevels, getRiskLevel, riskMatrix, controlActionStatuses, riskAssessmentStatuses } from "@/lib/risk-assessment-config";
import { Separator } from "@/components/ui/separator";

const NO_SELECTION_VALUE = "__NONE__";

const riskAssessmentControlSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Control description is required.").max(500),
  responsiblePerson: z.string().max(100).optional(),
  dueDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid due date" }),
  status: z.enum(controlActionStatuses).optional().default('Open'),
});

const manualRiskAssessmentFormSchema = z.object({
  activityOrProcess: z.string().min(5, "Activity/Process is required.").max(300),
  assessmentDate: z.string().refine(val => isValid(parseISO(val)), { message: "Assessment date is required." }),
  assessedBy: z.string().min(2, "Assessor name is required.").max(100),
  teamMembers: z.string().max(500).optional(),
  scope: z.string().min(5, "Scope is required.").max(1000),
  
  linkedHazardId: z.string().optional(),
  unloggedHazardDescription: z.string().max(1000).optional(),
  existingControls: z.string().min(5, "Describe existing controls (or 'None').").max(2000),

  initialLikelihood: z.enum(Object.keys(likelihoodLevels) as [Likelihood, ...Likelihood[]], { required_error: "Initial Likelihood is required." }),
  initialSeverity: z.enum(Object.keys(severityLevels) as [Severity, ...Severity[]], { required_error: "Initial Severity is required." }),
  initialRiskLevel: z.custom<RiskLevel>((val) => Object.keys(riskMatrix).includes(val as string), {message: "Invalid Risk Level"}).optional(),

  additionalControls: z.array(riskAssessmentControlSchema).optional(),

  residualLikelihood: z.enum(Object.keys(likelihoodLevels) as [Likelihood, ...Likelihood[]]).optional(),
  residualSeverity: z.enum(Object.keys(severityLevels) as [Severity, ...Severity[]]).optional(),
  residualRiskLevel: z.custom<RiskLevel>((val) => Object.keys(riskMatrix).includes(val as string), {message: "Invalid Risk Level"}).optional(),

  reviewDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid review date" }),
  status: z.enum(riskAssessmentStatuses, { required_error: "Assessment status is required." }),
  overallComments: z.string().max(5000).optional(),
}).refine(data => (data.linkedHazardId && data.linkedHazardId !== NO_SELECTION_VALUE) || (data.unloggedHazardDescription && data.unloggedHazardDescription.trim().length > 5), {
  message: "You must either select a previously logged hazard or describe a new one (min 5 characters).",
  path: ["unloggedHazardDescription"],
}).refine(data => (data.residualLikelihood && data.residualSeverity) || (!data.residualLikelihood && !data.residualSeverity), {
    message: "Both Residual Likelihood and Severity must be provided if one is entered.",
    path: ["residualLikelihood"], 
});

export type ManualRiskAssessmentFormValues = z.infer<typeof manualRiskAssessmentFormSchema>;

interface ManualRiskAssessmentFormProps {
  initialData?: ManualRiskAssessment | null;
  manualHazards: ManualHazard[];
  onSave: (data: ManualRiskAssessmentFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const newControlDefault = (): RiskAssessmentControl => ({
    id: crypto.randomUUID(),
    description: "",
    responsiblePerson: "",
    dueDate: undefined,
    status: "Open",
});

export function ManualRiskAssessmentForm({ initialData, manualHazards, onSave, onCancel, isSubmitting }: ManualRiskAssessmentFormProps) {
  const isEditing = !!initialData;
  const [isHazardsAiPrefilled, setIsHazardsAiPrefilled] = useState(false);
  const [isControlsAiPrefilled, setIsControlsAiPrefilled] = useState(false);
  const [isRootCausesAiPrefilled, setIsRootCausesAiPrefilled] = useState(false);

  const form = useForm<ManualRiskAssessmentFormValues>({
    resolver: zodResolver(manualRiskAssessmentFormSchema),
    defaultValues: {
      activityOrProcess: initialData?.activityOrProcess || "",
      assessmentDate: initialData?.assessmentDate ? format(parseISO(initialData.assessmentDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      assessedBy: initialData?.assessedBy || "",
      teamMembers: initialData?.teamMembers || "",
      scope: initialData?.scope || "",
      linkedHazardId: initialData?.linkedHazardId || NO_SELECTION_VALUE,
      unloggedHazardDescription: initialData?.unloggedHazardDescription || "",
      existingControls: initialData?.existingControls || "",
      initialLikelihood: initialData?.initialLikelihood || undefined,
      initialSeverity: initialData?.initialSeverity || undefined,
      initialRiskLevel: initialData?.initialRiskLevel || undefined,
      additionalControls: initialData?.additionalControls?.map(ac => ({
        ...ac, 
        dueDate: ac.dueDate ? format(parseISO(ac.dueDate), 'yyyy-MM-dd') : undefined
      })) || [],
      residualLikelihood: initialData?.residualLikelihood || undefined,
      residualSeverity: initialData?.residualSeverity || undefined,
      residualRiskLevel: initialData?.residualRiskLevel || undefined,
      reviewDate: initialData?.reviewDate ? format(parseISO(initialData.reviewDate), 'yyyy-MM-dd') : undefined,
      status: initialData?.status || 'Open',
      overallComments: initialData?.overallComments || "",
    },
  });

  const { fields: controlFields, append: appendControl, remove: removeControl } = useFieldArray({
    control: form.control,
    name: "additionalControls",
  });

  const watchedInitialLikelihood = form.watch("initialLikelihood");
  const watchedInitialSeverity = form.watch("initialSeverity");
  const watchedResidualLikelihood = form.watch("residualLikelihood");
  const watchedResidualSeverity = form.watch("residualSeverity");
  const watchedStatus = form.watch("status");
  const watchedLinkedHazardId = useWatch({ control: form.control, name: "linkedHazardId" });

  useEffect(() => {
    // Note: The logic to pre-fill from AI was here, but has been moved to the parent 'new' page component
    // as it's a better place to handle one-time local storage access.
  }, []);

  useEffect(() => {
    if (watchedInitialLikelihood && watchedInitialSeverity) {
      const lValue = likelihoodLevels[watchedInitialLikelihood];
      const sValue = severityLevels[watchedInitialSeverity];
      form.setValue("initialRiskLevel", getRiskLevel(lValue, sValue));
    }
  }, [watchedInitialLikelihood, watchedInitialSeverity, form]);

  useEffect(() => {
    if (watchedResidualLikelihood && watchedResidualSeverity) {
      const lValue = likelihoodLevels[watchedResidualLikelihood];
      const sValue = severityLevels[watchedResidualSeverity];
      form.setValue("residualRiskLevel", getRiskLevel(lValue, sValue));
    } else if (!watchedResidualLikelihood && !watchedResidualSeverity) {
        form.setValue("residualRiskLevel", undefined); 
    }
  }, [watchedResidualLikelihood, watchedResidualSeverity, form]);

  const onSubmit = (data: ManualRiskAssessmentFormValues) => {
    onSave(data);
  };
  
  const getRiskLevelColor = (level?: RiskLevel) => level ? riskMatrix[level]?.color : 'bg-gray-200 text-gray-700';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              
              <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary"/>Assessment Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <FormField control={form.control} name="activityOrProcess" render={({ field }) => (
                          <FormItem><FormLabel>Activity / Process Assessed</FormLabel><FormControl><Input placeholder="e.g., Routine Maintenance on Conveyor X" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="assessmentDate" render={({ field }) => (
                              <FormItem className="flex flex-col"><FormLabel>Assessment Date</FormLabel>
                              <Popover><PopoverTrigger asChild><FormControl>
                                  <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button></FormControl></PopoverTrigger>
                                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} initialFocus/></PopoverContent>
                              </Popover><FormMessage /></FormItem>
                          )}/>
                          <FormField control={form.control} name="assessedBy" render={({ field }) => (
                              <FormItem><FormLabel>Assessed By</FormLabel><FormControl><Input placeholder="Lead Assessor Name" {...field} /></FormControl><FormMessage /></FormItem>
                          )}/>
                      </div>
                      <FormField control={form.control} name="teamMembers" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><Users className="h-4 w-4"/>Assessment Team (Optional)</FormLabel><FormControl><Input placeholder="Comma-separated names if applicable" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="scope" render={({ field }) => (
                          <FormItem><FormLabel>Scope of Assessment</FormLabel><FormControl><Textarea placeholder="Define the boundaries and limits of this assessment" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                  </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary"/>Hazard Identification & Existing Controls</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <FormField
                    control={form.control}
                    name="linkedHazardId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Previously Identified Hazard</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select a hazard..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                  <SelectItem value={NO_SELECTION_VALUE}>-- Describe a New Hazard Below --</SelectItem>
                                  {manualHazards.map(hazard => (
                                  <SelectItem key={hazard.id} value={hazard.id}>
                                      {hazard.hazardDescription.substring(0, 70)}{hazard.hazardDescription.length > 70 ? '...' : ''}
                                  </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                        <FormDescription>Select a hazard from the log, or describe a new one below.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedLinkedHazardId === NO_SELECTION_VALUE && !isEditing && (
                     <FormField
                      control={form.control}
                      name="unloggedHazardDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Hazard Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the specific hazard (e.g., Trailing electrical cable, Unguarded rotating parts). This will create a new entry in the hazard log."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Separator />

                  <FormField control={form.control} name="existingControls" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Existing Control Measures</FormLabel>
                      <FormControl><Textarea placeholder="List all current controls in place to mitigate the identified hazards. One per line recommended." rows={4} {...field} /></FormControl>
                      {isControlsAiPrefilled && (
                        <FormDescription className="text-xs text-blue-600 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" /> This field may have been pre-filled with AI suggested controls. Please review, categorize, and move to 'Additional Controls' if new.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}/>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/>Initial Risk Assessment</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField control={form.control} name="initialLikelihood" render={({ field }) => (
                            <FormItem><FormLabel>Initial Likelihood</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select likelihood" /></SelectTrigger></FormControl>
                                <SelectContent>{Object.keys(likelihoodLevels).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="initialSeverity" render={({ field }) => (
                            <FormItem><FormLabel>Initial Severity</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger></FormControl>
                                <SelectContent>{Object.keys(severityLevels).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )}/>
                        <FormItem><FormLabel>Initial Risk Level</FormLabel>
                            <Input value={form.watch("initialRiskLevel") || "N/A"} readOnly className={`font-semibold text-center ${getRiskLevelColor(form.watch("initialRiskLevel"))}`} />
                        </FormItem>
                    </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/>Additional Control Measures Required</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {controlFields.map((item, index) => (
                        <Card key={item.id} className="p-3 bg-muted/20 shadow-sm space-y-3">
                            <div className="flex justify-between items-center"><FormLabel className="text-sm font-medium">Control #{index + 1}</FormLabel><Button type="button" variant="ghost" size="icon" onClick={() => removeControl(index)} className="text-destructive h-6 w-6"><Trash2 className="h-4 w-4"/></Button></div>
                            <FormField control={form.control} name={`additionalControls.${index}.description`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Control Description</FormLabel><FormControl><Textarea placeholder="Specific action to implement" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <FormField control={form.control} name={`additionalControls.${index}.responsiblePerson`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Responsible</FormLabel><FormControl><Input placeholder="Name or Role" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`additionalControls.${index}.dueDate`} render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel className="text-xs">Due Date (Optional)</FormLabel>
                                    <Popover><PopoverTrigger asChild><FormControl>
                                        <Button variant="outline" size="sm" className={cn("w-full pl-3 text-left font-normal text-xs", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                        </Button></FormControl></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                                    </Popover><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`additionalControls.${index}.status`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="text-xs"><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                                        <SelectContent>{controlActionStatuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                                    </Select><FormMessage /></FormItem>
                                )}/>
                            </div>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendControl(newControlDefault())}><PlusCircle className="mr-2 h-4 w-4"/>Add Control</Button>
                    <FormField name="additionalControls" control={form.control} render={() => <FormMessage />} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary"/>Residual Risk Assessment (Optional)</CardTitle><UiCardDescription className="text-xs">Assess the risk level *after* all additional controls are implemented.</UiCardDescription></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <FormField control={form.control} name="residualLikelihood" render={({ field }) => (
                          <FormItem><FormLabel>Residual Likelihood</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === NO_SELECTION_VALUE ? undefined : value)} value={field.value || NO_SELECTION_VALUE}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select likelihood" /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value={NO_SELECTION_VALUE}>N/A</SelectItem>{Object.keys(likelihoodLevels).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="residualSeverity" render={({ field }) => (
                          <FormItem><FormLabel>Residual Severity</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === NO_SELECTION_VALUE ? undefined : value)} value={field.value || NO_SELECTION_VALUE}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value={NO_SELECTION_VALUE}>N/A</SelectItem>{Object.keys(severityLevels).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem>
                      )}/>
                      <FormItem><FormLabel>Residual Risk Level</FormLabel>
                          <Input value={form.watch("residualRiskLevel") || "N/A"} readOnly className={`font-semibold text-center ${getRiskLevelColor(form.watch("residualRiskLevel"))}`} />
                      </FormItem>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/>Review & Status</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Assessment Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                            <SelectContent>{riskAssessmentStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                    <div className={cn(watchedStatus === 'Closed' || watchedStatus === 'Superseded' ? 'hidden' : 'block')}>
                      <FormField control={form.control} name="reviewDate" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>Next Review Date (Optional)</FormLabel>
                          <Popover><PopoverTrigger asChild><FormControl>
                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(parseISO(field.value), "PPP") : <span>Pick review date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button></FormControl></PopoverTrigger>
                              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                          </Popover><FormMessage /></FormItem>
                      )}/>
                    </div>
                  </div>
                   <FormField control={form.control} name="overallComments" render={({ field }) => (
                      <FormItem className="mt-4">
                          <FormLabel>Overall Comments / Approval Notes (Optional)</FormLabel>
                          <FormControl><Textarea placeholder="Any final comments, approval notes, or context for the assessment." rows={3} {...field} /></FormControl>
                           {isRootCausesAiPrefilled && (
                              <FormDescription className="text-xs text-blue-600 flex items-center gap-1">
                                  <Lightbulb className="h-3 w-3" /> AI root cause suggestions have been appended. Please review and integrate as appropriate.
                              </FormDescription>
                          )}
                          <FormMessage />
                      </FormItem>
                  )}/>
                </CardContent>
              </Card>
            </div>
        </ScrollArea>
        <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData?.id ? "Save Changes" : "Save Assessment"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
