
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
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
import { CalendarIcon, Save, XCircle, User, Tag, AlertTriangle, BarChart, BookOpen, ShieldAlert, Users, FileSignature, Link as LinkIconSheq } from "lucide-react"; // Added LinkIconSheq
import type { RiskRegisterEntry, Likelihood, Severity, RiskLevel, RiskRegisterStatus, SheqAudit } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { likelihoodLevels, severityLevels, getRiskLevel, riskMatrix, riskRegisterStatuses, riskCategories, riskSources } from "@/lib/risk-assessment-config";
import { Separator } from "@/components/ui/separator";

const riskRegisterEntryFormSchema = z.object({
  riskTitle: z.string().min(5, "Risk title is required.").max(200),
  riskDescription: z.string().min(10, "Risk description is required.").max(2000),
  dateIdentified: z.string().refine(val => isValid(parseISO(val)), { message: "Date identified is required." }),
  identifiedBy: z.string().min(2, "Identified by is required.").max(100),
  category: z.string().optional(),
  source: z.string().optional(),
  
  initialLikelihood: z.enum(Object.keys(likelihoodLevels) as [Likelihood, ...Likelihood[]], { required_error: "Initial Likelihood is required." }),
  initialSeverity: z.enum(Object.keys(severityLevels) as [Severity, ...Severity[]], { required_error: "Initial Severity is required." }),
  initialRiskLevel: z.custom<RiskLevel>((val) => Object.keys(riskMatrix).includes(val as string), {message: "Invalid Risk Level"}).optional(),

  treatmentPlan: z.string().min(5, "Treatment plan description is required.").max(2000),
  riskOwner: z.string().min(2, "Risk owner is required.").max(100),
  treatmentDueDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid due date" }),
  status: z.enum(riskRegisterStatuses, { required_error: "Risk status is required." }),
  
  residualLikelihood: z.enum(Object.keys(likelihoodLevels) as [Likelihood, ...Likelihood[]]).optional(),
  residualSeverity: z.enum(Object.keys(severityLevels) as [Severity, ...Severity[]]).optional(),
  residualRiskLevel: z.custom<RiskLevel>((val) => Object.keys(riskMatrix).includes(val as string), {message: "Invalid Risk Level"}).optional(),

  lastReviewedDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid last reviewed date" }),
  nextReviewDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid next review date" }),
  linkedSheqAuditId: z.string().optional(),
  linkedSheqAuditName: z.string().optional(),
  notes: z.string().max(2000).optional(),
}).refine(data => (data.residualLikelihood && data.residualSeverity) || (!data.residualLikelihood && !data.residualSeverity), {
    message: "Both Residual Likelihood and Severity must be provided if one is entered.",
    path: ["residualLikelihood"], 
});

export type RiskRegisterEntryFormValues = z.infer<typeof riskRegisterEntryFormSchema>;

interface RiskRegisterEntryFormProps {
  initialData?: RiskRegisterEntry | null;
  sheqAudits: SheqAudit[]; // Added prop for SHEQ Audits
  onSave: (data: RiskRegisterEntryFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const NO_SELECTION_VALUE = "__NONE__";


export function RiskRegisterEntryForm({ initialData, sheqAudits, onSave, onCancel, isSubmitting }: RiskRegisterEntryFormProps) {
  const form = useForm<RiskRegisterEntryFormValues>({
    resolver: zodResolver(riskRegisterEntryFormSchema),
    defaultValues: {
      riskTitle: initialData?.riskTitle || "",
      riskDescription: initialData?.riskDescription || "",
      dateIdentified: initialData?.dateIdentified ? format(parseISO(initialData.dateIdentified), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      identifiedBy: initialData?.identifiedBy || "",
      category: initialData?.category || undefined,
      source: initialData?.source || undefined,
      initialLikelihood: initialData?.initialLikelihood || undefined,
      initialSeverity: initialData?.initialSeverity || undefined,
      initialRiskLevel: initialData?.initialRiskLevel || undefined,
      treatmentPlan: initialData?.treatmentPlan || "",
      riskOwner: initialData?.riskOwner || "",
      treatmentDueDate: initialData?.treatmentDueDate ? format(parseISO(initialData.treatmentDueDate), 'yyyy-MM-dd') : undefined,
      status: initialData?.status || 'Open',
      residualLikelihood: initialData?.residualLikelihood || undefined,
      residualSeverity: initialData?.residualSeverity || undefined,
      residualRiskLevel: initialData?.residualRiskLevel || undefined,
      lastReviewedDate: initialData?.lastReviewedDate ? format(parseISO(initialData.lastReviewedDate), 'yyyy-MM-dd') : undefined,
      nextReviewDate: initialData?.nextReviewDate ? format(parseISO(initialData.nextReviewDate), 'yyyy-MM-dd') : undefined,
      linkedSheqAuditId: initialData?.linkedSheqAuditId || undefined,
      linkedSheqAuditName: initialData?.linkedSheqAuditName || undefined,
      notes: initialData?.notes || "",
    },
  });

  const watchedInitialLikelihood = form.watch("initialLikelihood");
  const watchedInitialSeverity = form.watch("initialSeverity");
  const watchedResidualLikelihood = form.watch("residualLikelihood");
  const watchedResidualSeverity = form.watch("residualSeverity");
  const watchedLinkedSheqAuditId = form.watch("linkedSheqAuditId");

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

  useEffect(() => {
    if (watchedLinkedSheqAuditId) {
      const selectedAudit = sheqAudits.find(audit => audit.id === watchedLinkedSheqAuditId);
      if (selectedAudit) {
        form.setValue("linkedSheqAuditName", `${selectedAudit.auditName} (${selectedAudit.auditType} - ${format(parseISO(selectedAudit.auditDate), "PPP")})`);
      } else {
        form.setValue("linkedSheqAuditName", undefined);
      }
    } else {
      form.setValue("linkedSheqAuditName", undefined);
    }
  }, [watchedLinkedSheqAuditId, sheqAudits, form]);


  const onSubmit = (data: RiskRegisterEntryFormValues) => {
    onSave(data);
  };
  
  const getRiskLevelColor = (level?: RiskLevel) => level ? riskMatrix[level]?.color : 'bg-gray-200 text-gray-700';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
            <CardContent className="p-6 space-y-6">
                {/* Risk Identification */}
                <Card className="p-4 bg-secondary/20">
                    <CardHeader className="p-0 pb-3 mb-3 border-b"><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary"/>Risk Identification</CardTitle></CardHeader>
                    <div className="space-y-4">
                        <FormField control={form.control} name="riskTitle" render={({ field }) => (
                            <FormItem><FormLabel>Risk Title</FormLabel><FormControl><Input placeholder="e.g., Failure of Main Water Pump leading to Flood" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="riskDescription" render={({ field }) => (
                            <FormItem><FormLabel>Risk Description</FormLabel><FormControl><Textarea placeholder="Detailed description of the risk, its causes, and potential impacts..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="dateIdentified" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Date Identified</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl>
                                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button></FormControl></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} initialFocus/></PopoverContent>
                                </Popover><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="identifiedBy" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center gap-1"><User className="h-4 w-4"/>Identified By</FormLabel><FormControl><Input placeholder="Name or Department" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem><FormLabel>Category (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="">None</SelectItem>{riskCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="source" render={({ field }) => (
                                <FormItem><FormLabel>Source (Optional)</FormLabel>
                                 <Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                                 <SelectContent><SelectItem value="">None</SelectItem>{riskSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                 </Select><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </div>
                </Card>

                {/* Initial Risk Assessment */}
                 <Card className="p-4 bg-secondary/20">
                    <CardHeader className="p-0 pb-3 mb-3 border-b"><CardTitle className="text-lg flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/>Initial Risk Level</CardTitle></CardHeader>
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
                </Card>
                
                {/* Risk Treatment */}
                 <Card className="p-4 bg-secondary/20">
                    <CardHeader className="p-0 pb-3 mb-3 border-b"><CardTitle className="text-lg flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary"/>Risk Treatment</CardTitle></CardHeader>
                     <div className="space-y-4">
                        <FormField control={form.control} name="treatmentPlan" render={({ field }) => (
                            <FormItem><FormLabel>Treatment Plan / Control Measures</FormLabel><FormControl><Textarea placeholder="Describe actions to mitigate or treat the risk..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="riskOwner" render={({ field }) => (
                                <FormItem><FormLabel className="flex items-center gap-1"><User className="h-4 w-4"/>Risk Owner</FormLabel><FormControl><Input placeholder="Person or Department" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="treatmentDueDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Treatment Due Date (Optional)</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl>
                                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button></FormControl></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                                </Popover><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem><FormLabel>Risk Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                <SelectContent>{riskRegisterStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )}/>
                    </div>
                </Card>

                {/* Residual Risk Assessment */}
                <Card className="p-4 bg-secondary/20">
                    <CardHeader className="p-0 pb-3 mb-3 border-b"><CardTitle className="text-lg flex items-center gap-2"><BarChart className="h-5 w-5 text-primary"/>Residual Risk Level (Optional)</CardTitle><UiCardDescription>Assess after treatment plan is implemented.</UiCardDescription></CardHeader>
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
                </Card>

                {/* Review & Monitoring */}
                <Card className="p-4 bg-secondary/20">
                     <CardHeader className="p-0 pb-3 mb-3 border-b"><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/>Review, Monitoring & Links</CardTitle></CardHeader>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="lastReviewedDate" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Last Reviewed Date (Optional)</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button></FormControl></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                            </Popover><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="nextReviewDate" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Next Review Date (Optional)</FormLabel>
                            <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button></FormControl></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                            </Popover><FormMessage /></FormItem>
                        )}/>
                     </div>
                      <FormField
                        control={form.control}
                        name="linkedSheqAuditId"
                        render={({ field }) => (
                            <FormItem className="mt-4">
                            <FormLabel className="flex items-center gap-1"><LinkIconSheq className="h-4 w-4"/>Link to SHEQ Audit (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select an audit to link" /></SelectTrigger></FormControl>
                                <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {sheqAudits.map(audit => (
                                    <SelectItem key={audit.id} value={audit.id}>
                                    {audit.auditName} ({audit.auditType} - {format(parseISO(audit.auditDate), "PPP")})
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>Associate this risk with a specific SHEQ audit for context.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem className="mt-4"><FormLabel>General Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any other relevant information or updates for this risk..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </Card>
            </CardContent>
        </ScrollArea>
        <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData?.id ? "Save Changes" : "Add Risk to Register"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
