
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { format, isValid, parseISO } from "date-fns";


import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, AlertTriangle, Save, CheckCircle, XCircle, Edit3, CalendarIcon, User, FileText, MessageSquare, ListPlus, BookCheck, SearchCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SheqAudit, AuditChecklistItem, NonConformance, AuditObservationEntry } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";

const auditObservationEntrySchema = z.object({
    id: z.string(),
    text: z.string().min(1, "Observation text cannot be empty.").max(2000, "Observation text is too long."),
});

const auditChecklistItemSchema = z.object({
  id: z.string(),
  templateItemId: z.string().optional(),
  text: z.string().min(1, "Checklist item text cannot be empty.").max(1000, "Text too long"),
  status: z.enum(['Compliant', 'Non-Compliant', 'Not Applicable', 'Pending']),
  auditCriteriaReference: z.string().max(250).optional(),
  evidenceGatheringPrompt: z.string().max(500).optional(),
  evidenceNotes: z.string().max(2000, "Evidence notes too long.").optional(),
  responsiblePerson: z.string().max(100, "Responsible person name too long.").optional(),
  observations: z.array(auditObservationEntrySchema),
  comments: z.string().max(2000, "Comments text too long.").optional(),
});

const nonConformanceSchema = z.object({
  id: z.string(),
  description: z.string().min(5, "NC description is required.").max(1000, "Description too long."),
  severity: z.enum(['Minor', 'Major', 'Critical']),
  relatedChecklistItemId: z.string().optional(),
  relatedIncidentId: z.string().max(100, "Incident ID too long.").optional(), 
  correctiveActionsProposed: z.string().max(2000, "Proposed corrective actions text too long.").optional(),
  preventiveActionsProposed: z.string().max(2000, "Proposed preventive actions text too long.").optional(),
  actionAssignedTo: z.string().max(100, "Assignee name too long.").optional(),
  actionDueDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid due date" }),
  actionStatus: z.enum(['Open', 'In Progress', 'Completed', 'Overdue']).default('Open'),
  actionCompletionDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid completion date" }),
  actionVerificationNotes: z.string().max(2000, "Verification notes too long.").optional(),
});

const auditExecutionFormSchema = z.object({
  checklist: z.array(auditChecklistItemSchema),
  nonConformances: z.array(nonConformanceSchema),
  overallFindings: z.string().max(5000, "Overall findings too long.").optional(),
  recommendations: z.string().max(5000, "Recommendations too long.").optional(),
});

type AuditExecutionFormValues = z.infer<typeof auditExecutionFormSchema>;

interface AuditExecutionFormProps {
  audit: SheqAudit;
  onSaveAudit: (auditData: SheqAudit) => void;
}

const getDefaultNonConformanceValues = (): NonConformance => ({
    id: crypto.randomUUID(),
    description: "",
    severity: "Minor",
    relatedChecklistItemId: "",
    relatedIncidentId: "",
    correctiveActionsProposed: "",
    preventiveActionsProposed: "",
    actionAssignedTo: "",
    actionDueDate: undefined, 
    actionStatus: "Open",
    actionCompletionDate: undefined, 
    actionVerificationNotes: ""
});

const getDefaultObservationEntry = (): AuditObservationEntry => ({
  id: crypto.randomUUID(),
  text: "",
});


export function AuditExecutionForm({ audit, onSaveAudit }: AuditExecutionFormProps) {
  const { toast } = useToast();
  
  const form = useForm<AuditExecutionFormValues>({
    resolver: zodResolver(auditExecutionFormSchema),
    defaultValues: {
      checklist: audit.checklist?.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        templateItemId: item.templateItemId || '',
        auditCriteriaReference: item.auditCriteriaReference || '',
        evidenceGatheringPrompt: item.evidenceGatheringPrompt || '',
        evidenceNotes: item.evidenceNotes || '',
        responsiblePerson: item.responsiblePerson || "",
        observations: item.observations && item.observations.length > 0 
            ? item.observations.map(obs => ({...obs, id: obs.id || crypto.randomUUID()})) 
            : [],
        comments: item.comments || "",
      })) || [],
      nonConformances: audit.nonConformances?.map(nc => ({
        ...getDefaultNonConformanceValues(),
        ...nc,
        id: nc.id || crypto.randomUUID(),
        actionDueDate: nc.actionDueDate && isValid(parseISO(nc.actionDueDate)) ? format(parseISO(nc.actionDueDate), 'yyyy-MM-dd') : undefined,
        actionCompletionDate: nc.actionCompletionDate && isValid(parseISO(nc.actionCompletionDate)) ? format(parseISO(nc.actionCompletionDate), 'yyyy-MM-dd') : undefined,
      })) || [],
      overallFindings: audit.overallFindings || "",
      recommendations: audit.recommendations || "",
    },
  });

  const { fields: checklistFields, update: updateChecklistItem, append: appendChecklistItem, remove: removeChecklistItem } = useFieldArray({
    control: form.control,
    name: "checklist",
  });

  const { fields: ncFields, append: appendNc, remove: removeNc } = useFieldArray({
    control: form.control,
    name: "nonConformances",
  });

  async function onSubmit(data: AuditExecutionFormValues) {
    const updatedAuditData: SheqAudit = {
      ...audit,
      checklist: data.checklist.map(item => ({...item})), 
      nonConformances: data.nonConformances.map(nc => ({
        ...nc,
        actionDueDate: nc.actionDueDate && isValid(parseISO(nc.actionDueDate)) ? parseISO(nc.actionDueDate).toISOString() : undefined,
        actionCompletionDate: nc.actionCompletionDate && isValid(parseISO(nc.actionCompletionDate)) ? parseISO(nc.actionCompletionDate).toISOString() : undefined,
      })),
      overallFindings: data.overallFindings,
      recommendations: data.recommendations,
      status: "Completed", 
    };
    onSaveAudit(updatedAuditData);
    toast({
      title: "Audit Data Saved",
      description: `Audit findings for "${audit.auditName}" have been recorded.`,
    });
  }
  
  const handleAddNewChecklistItem = () => {
    appendChecklistItem({
      id: crypto.randomUUID(),
      text: "New custom checklist item (edit me)",
      status: 'Pending',
      auditCriteriaReference: 'N/A - Custom Item',
      evidenceGatheringPrompt: 'Describe evidence to be gathered for this custom item.',
      evidenceNotes: '',
      responsiblePerson: '',
      observations: [],
      comments: '',
    });
  };

  const handleAddNewNc = () => {
    appendNc(getDefaultNonConformanceValues());
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card>
          <CardHeader>
            <CardTitle>Audit Checklist</CardTitle>
            <CardDescription>Go through each item, edit as needed, update status, and add relevant notes and observations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklistFields.map((item, checklistIndex) => {
               const { fields: observationFields, append: appendObservation, remove: removeObservation } = useFieldArray({
                control: form.control,
                name: `checklist.${checklistIndex}.observations`
              });

              return (
              <Card key={item.id} className="p-4 bg-secondary/40 space-y-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-grow mr-2">
                        <FormField
                            control={form.control}
                            name={`checklist.${checklistIndex}.text`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="font-medium">Item {checklistIndex + 1}</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Checklist item description..." 
                                        {...field} 
                                        rows={2}
                                        className="bg-background"
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeChecklistItem(checklistIndex)}
                        className="text-destructive hover:bg-destructive/10 mt-1"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Item</span>
                    </Button>
                </div>
                
                {item.auditCriteriaReference && (
                    <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                        <BookCheck className="h-3 w-3"/> 
                        <strong>Criteria:</strong> {item.auditCriteriaReference}
                    </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`checklist.${checklistIndex}.status`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Compliant">Compliant</SelectItem>
                            <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                            <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`checklist.${checklistIndex}.responsiblePerson`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><User className="h-4 w-4 text-muted-foreground"/>Responsible Person</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Site Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name={`checklist.${checklistIndex}.evidenceNotes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><SearchCheck className="h-4 w-4 text-muted-foreground"/>Evidence Notes</FormLabel>
                      {item.evidenceGatheringPrompt && <FormDescription className="text-xs italic mb-1">{item.evidenceGatheringPrompt}</FormDescription>}
                      <FormControl>
                        <Textarea placeholder="Record objective evidence found..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel className="flex items-center gap-1"><FileText className="h-4 w-4 text-muted-foreground"/>Observations</FormLabel>
                  {observationFields.map((observationItem, observationIndex) => (
                    <div key={observationItem.id} className="flex items-start gap-2 pl-4 border-l-2 border-muted/50 py-1">
                      <FormField
                        control={form.control}
                        name={`checklist.${checklistIndex}.observations.${observationIndex}.text`}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                             <FormLabel className="sr-only">Observation {observationIndex + 1}</FormLabel>
                            <FormControl>
                              <Textarea placeholder={`Observation ${observationIndex + 1}...`} rows={2} {...field} className="bg-background"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeObservation(observationIndex)}
                        className="text-destructive hover:bg-destructive/10 mt-1 shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Remove Observation</span>
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendObservation(getDefaultObservationEntry())}
                    className="text-primary border-primary hover:bg-primary/10"
                  >
                    <ListPlus className="mr-2 h-4 w-4" /> Add Observation
                  </Button>
                  <FormField name={`checklist.${checklistIndex}.observations`} control={form.control} render={() => <FormMessage />} />
                </div>


                <FormField
                  control={form.control}
                  name={`checklist.${checklistIndex}.comments`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><MessageSquare className="h-4 w-4 text-muted-foreground"/>Comments</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional comments or context..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
              )
            })}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNewChecklistItem}
                className="mt-4"
            >
                <PlusCircle className="mr-2 h-4 w-4"/> Add Checklist Item
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Non-Conformances (NCs)</CardTitle>
            <CardDescription>Log any deviations or non-conformances identified during the audit, including proposed CAPA details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ncFields.map((ncItem, index) => {
              const currentStatus = form.watch(`nonConformances.${index}.actionStatus`);
              return (
                <Card key={ncItem.id} className="p-4 relative bg-destructive/10 border-destructive/50 space-y-3">
                  <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeNc(index)} 
                      className="absolute top-2 right-2 text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove NC {index + 1}</span>
                  </Button>
                  <FormField
                    control={form.control}
                    name={`nonConformances.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NC #{index+1} Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the non-conformance observed..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                      control={form.control}
                      name={`nonConformances.${index}.severity`}
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Severity</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                              <SelectItem value="Minor">Minor</SelectItem>
                              <SelectItem value="Major">Major</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                      <FormField
                          control={form.control}
                          name={`nonConformances.${index}.relatedChecklistItemId`}
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Related Checklist Item (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                  <SelectTrigger>
                                  <SelectValue placeholder="Link to checklist item" />
                                  </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {form.watch("checklist").map((chkItem, chkIndex) => (
                                  <SelectItem key={chkItem.id} value={chkItem.id}>
                                      Item {chkIndex + 1}: {chkItem.text.substring(0,50)}{chkItem.text.length > 50 ? '...' : ''}
                                  </SelectItem>
                                  ))}
                              </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                  </div>
                   <FormField
                    control={form.control}
                    name={`nonConformances.${index}.relatedIncidentId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Incident ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Incident ID if applicable" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <Separator />
                  <CardDescription className="font-medium">Corrective & Preventive Actions (CAPA)</CardDescription>

                  <FormField
                    control={form.control}
                    name={`nonConformances.${index}.correctiveActionsProposed`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Corrective Actions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Detail proposed corrective actions..." rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`nonConformances.${index}.preventiveActionsProposed`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Preventive Actions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Detail proposed preventive actions..." rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`nonConformances.${index}.actionAssignedTo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned To</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., John Doe, Maintenance Team" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`nonConformances.${index}.actionDueDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <FormControl>
                                  <Button
                                      variant={"outline"}
                                      className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                      )}
                                  >
                                      {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                  </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                  mode="single"
                                  selected={field.value ? parseISO(field.value) : undefined}
                                  onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                  initialFocus
                                  />
                              </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                      control={form.control}
                      name={`nonConformances.${index}.actionStatus`}
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Action Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "Open"}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select action status" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="Open">Open</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                  <SelectItem value="Overdue">Overdue</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                  />

                  {currentStatus === 'Completed' && (
                    <>
                      <FormField
                        control={form.control}
                        name={`nonConformances.${index}.actionCompletionDate`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Completion Date</FormLabel>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    mode="single"
                                    selected={field.value ? parseISO(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`nonConformances.${index}.actionVerificationNotes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Notes on verification of action completion..." rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </Card>
              )
            })}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddNewNc}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <AlertTriangle className="mr-2 h-4 w-4" /> Add Non-Conformance
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <Card>
            <CardHeader>
                <CardTitle>Overall Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                control={form.control}
                name="overallFindings"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Overall Audit Findings</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Summarize the key findings of the audit..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="recommendations"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Recommendations</FormLabel>
                    <FormControl>
                        <Textarea placeholder="List any recommendations for improvement..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
        </Card>
        
        <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" /> Save and Complete Audit
            </Button>
        </div>
      </form>
    </Form>
  );
}

    