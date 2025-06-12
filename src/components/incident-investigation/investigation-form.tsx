
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, PlusCircle, Trash2, FileText, Users, Workflow } from "lucide-react";
import type { IncidentInvestigation, CorrectiveAction, InvestigationTechnique, FiveWhyDetail, /*FishboneCategory, FishboneCause,*/ ScatDetails, GenericRcaDetails } from "@/lib/types"; // Removed Fishbone types from here as they will be form-specific
import { investigationTechniques } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "../ui/separator";
import { Card, CardContent, CardHeader as UICardHeader, CardTitle as UICardTitle, CardDescription as UICardDescription } from "@/components/ui/card";
import { FishboneCategoryItem } from "./fishbone-category-item"; // Import the new component
import { useToast } from "@/hooks/use-toast";


const fiveWhyDetailSchema = z.object({
  id: z.string(),
  why: z.string().min(1, "Required").max(500, "Too long"),
  because: z.string().min(1, "Required").max(1000, "Too long"),
});

const fishboneCauseSchema = z.object({
    id: z.string(),
    causeText: z.string().min(1, "Required").max(300, "Too long"),
});

const fishboneCategorySchema = z.object({
    id: z.string(),
    categoryName: z.string().min(1, "Required").max(100, "Too long"),
    causes: z.array(fishboneCauseSchema).min(1, "At least one cause required for category"),
});
export type FishboneCategory = z.infer<typeof fishboneCategorySchema>; // Export for FishboneCategoryItem

const scatDetailsSchema = z.object({
    summaryOfEvents: z.string().max(2000).optional(),
    immediateCauses: z.string().max(2000).optional(),
    underlyingFactors: z.string().max(2000).optional(),
    systemDeficiencies: z.string().max(2000).optional(),
});

const genericRcaDetailsSchema = z.object({
    problemStatement: z.string().min(1, "Required").max(1000, "Too long"),
    contributingFactors: z.string().max(3000).optional(),
    rootCauseSummary: z.string().min(1, "Required").max(1000, "Too long"),
});

const correctiveActionSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Required").max(1000, "Too long"),
  responsiblePerson: z.string().min(1, "Required").max(100, "Too long"),
  dueDate: z.string().refine(val => isValid(parseISO(val)), { message: "Invalid date" }),
  status: z.enum(['Open', 'In Progress', 'Completed', 'Overdue']),
  completionDate: z.string().optional().nullable().refine(val => !val || isValid(parseISO(val)), { message: "Invalid date" }),
  verificationNotes: z.string().max(2000).optional(),
});


const investigationFormSchema = z.object({
  incidentId: z.string().min(1, "Incident ID is required.").max(100),
  investigationTitle: z.string().min(3, "Title must be at least 3 characters.").max(150),
  investigationDate: z.date({ required_error: "Investigation date is required." }),
  investigators: z.string().min(2, "Investigator(s) name is required.").max(200),
  techniqueUsed: z.enum(['FiveWhys', 'FishboneIshikawa', 'SCAT', 'GenericRCA']).optional(),
  
  fiveWhysDetails: z.array(fiveWhyDetailSchema).optional(),
  fishboneCategories: z.array(fishboneCategorySchema).optional(),
  scatDetails: scatDetailsSchema.optional(),
  genericRcaDetails: genericRcaDetailsSchema.optional(),

  evidenceSummary: z.string().max(3000).optional(),
  witnessStatementsSummary: z.string().max(3000).optional(),
  summaryOfFindings: z.string().min(10, "Summary of findings is required.").max(5000),
  correctiveActions: z.array(correctiveActionSchema),
  status: z.enum(['Open', 'In Progress', 'Review', 'Closed'], { required_error: "Status is required."}),
});

export type InvestigationFormValues = z.infer<typeof investigationFormSchema>;

interface InvestigationFormProps {
  initialData?: Partial<IncidentInvestigation> | null; 
  onSave: (data: InvestigationFormValues) => void; 
  onCancel: () => void;
}

// Default factories
const getDefaultFiveWhy = (): FiveWhyDetail => ({ id: crypto.randomUUID(), why: "", because: "" });
const getDefaultFishboneCategory = (): FishboneCategory => ({ id: crypto.randomUUID(), categoryName: "", causes: [{ id: crypto.randomUUID(), causeText: "" }] });
const getDefaultCorrectiveAction = (): CorrectiveAction => ({
    id: crypto.randomUUID(),
    description: "",
    responsiblePerson: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    status: "Open",
    completionDate: undefined,
    verificationNotes: ""
});


export function InvestigationForm({ initialData, onSave, onCancel }: InvestigationFormProps) {
  const { toast } = useToast();
  const form = useForm<InvestigationFormValues>({
    resolver: zodResolver(investigationFormSchema),
    defaultValues: {
      incidentId: initialData?.incidentId || "",
      investigationTitle: initialData?.investigationTitle || "",
      investigationDate: initialData?.investigationDate ? parseISO(initialData.investigationDate) : new Date(),
      investigators: initialData?.investigators || "",
      techniqueUsed: initialData?.techniqueUsed || undefined,
      fiveWhysDetails: initialData?.fiveWhysDetails?.length ? initialData.fiveWhysDetails : [getDefaultFiveWhy()],
      fishboneCategories: initialData?.fishboneCategories?.length ? initialData.fishboneCategories.map(cat => ({...cat, causes: cat.causes.length ? cat.causes : [{id: crypto.randomUUID(), causeText: ""}] })) : [],
      scatDetails: initialData?.scatDetails || { summaryOfEvents: "", immediateCauses: "", underlyingFactors: "", systemDeficiencies: "" },
      genericRcaDetails: initialData?.genericRcaDetails || { problemStatement: "", contributingFactors: "", rootCauseSummary: "" },
      evidenceSummary: initialData?.evidenceSummary || "",
      witnessStatementsSummary: initialData?.witnessStatementsSummary || "",
      summaryOfFindings: initialData?.summaryOfFindings || "",
      correctiveActions: initialData?.correctiveActions?.length 
        ? initialData.correctiveActions.map(ca => ({
            ...ca, 
            dueDate: ca.dueDate ? format(parseISO(ca.dueDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"), 
            completionDate: ca.completionDate ? format(parseISO(ca.completionDate), "yyyy-MM-dd") : undefined 
          })) 
        : [getDefaultCorrectiveAction()],
      status: initialData?.status || "Open",
    },
  });

  const selectedTechnique = form.watch("techniqueUsed");
  const isEditing = !!initialData;

  const { fields: fiveWhysFields, append: fiveWhysAppend, remove: fiveWhysRemove } = useFieldArray({
    control: form.control, name: "fiveWhysDetails"
  });
  const { fields: fishboneCatFields, append: fishboneCatAppend, remove: fishboneCatRemove } = useFieldArray({
    control: form.control, name: "fishboneCategories"
  });
  const { fields: capaFields, append: capaAppend, remove: capaRemove } = useFieldArray({
    control: form.control, name: "correctiveActions"
  });

  const processSubmit = (data: InvestigationFormValues) => {
    console.log("InvestigationForm: processSubmit called with data:", data);
    onSave(data);
  };

  const processError = (errors: any) => { // Use `any` or `FieldErrors<InvestigationFormValues>`
    console.error("InvestigationForm: Validation errors:", errors);
    Object.keys(errors).forEach(key => {
      console.error(`Field: ${key}, Error: ${errors[key]?.message}`);
      // For nested errors (like in arrays), you might need recursive logging
      if (errors[key] && typeof errors[key] === 'object' && errors[key].message) {
         console.error(`Field: ${key}, Error: ${errors[key].message}`);
      } else if (errors[key] && Array.isArray(errors[key])) {
        errors[key].forEach((itemError: any, index: number) => {
          if (itemError) {
            Object.keys(itemError).forEach(subKey => {
              if (itemError[subKey] && itemError[subKey].message) {
                console.error(`Field: ${key}[${index}].${subKey}, Error: ${itemError[subKey].message}`);
              }
            });
          }
        });
      }
    });
    toast({
      title: "Validation Error",
      description: "Please check the form for errors. Some fields might be invalid or missing. See console for details.",
      variant: "destructive",
      duration: 7000,
    });
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(processSubmit, processError)} className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1"> 
          <div className="p-4 md:p-6 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <UICardHeader className="p-2 pt-0 md:p-4 md:pt-0">
                <UICardTitle className="text-lg">Basic Information</UICardTitle>
              </UICardHeader>
              <CardContent className="space-y-4 p-2 md:p-4">
                <FormField control={form.control} name="investigationTitle" render={({ field }) => (
                    <FormItem><FormLabel>Investigation Title</FormLabel><FormControl><Input placeholder="e.g., Investigation into Machine Guard Failure" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="incidentId" render={({ field }) => (
                        <FormItem><FormLabel>Related Incident ID</FormLabel><FormControl><Input placeholder="Enter ID of the logged incident" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="investigationDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Investigation Date</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="investigators" render={({ field }) => (
                    <FormItem><FormLabel>Investigator(s)</FormLabel><FormControl><Input placeholder="Names or team, e.g., John Doe, Jane Smith" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </CardContent>
            </Card>

            {/* Investigation Technique & Details Card */}
            <Card>
                <UICardHeader className="p-2 pt-0 md:p-4 md:pt-0">
                    <UICardTitle className="text-lg">Investigation Details</UICardTitle>
                </UICardHeader>
                <CardContent className="space-y-4 p-2 md:p-4">
                    <FormField control={form.control} name="techniqueUsed" render={({ field }) => (
                        <FormItem><FormLabel>Investigation Technique</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a technique" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {investigationTechniques.map(tech => <SelectItem key={tech.name} value={tech.name}>{tech.label}</SelectItem>)}
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>

                    {selectedTechnique === 'FiveWhys' && (
                        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                            <FormLabel className="text-md font-semibold">5 Whys Analysis</FormLabel>
                            {fiveWhysFields.map((item, index) => (
                                <Card key={item.id} className="p-3 space-y-2 shadow-sm bg-background">
                                    <div className="flex justify-between items-center">
                                        <FormLabel className="text-sm">Why #{index + 1}</FormLabel>
                                        {fiveWhysFields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => fiveWhysRemove(index)} className="text-destructive h-6 w-6"><Trash2 className="h-4 w-4" /></Button>}
                                    </div>
                                    <FormField control={form.control} name={`fiveWhysDetails.${index}.why`} render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Why did it happen?</FormLabel><FormControl><Textarea placeholder="State the problem or 'Why...'" {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`fiveWhysDetails.${index}.because`} render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Because...</FormLabel><FormControl><Textarea placeholder="Explain the reason or 'Because...'" {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </Card>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => fiveWhysAppend(getDefaultFiveWhy())}><PlusCircle className="mr-2 h-4 w-4" /> Add Another Why</Button>
                            <FormField name="fiveWhysDetails" control={form.control} render={({ fieldState }) => fieldState.error ? <FormMessage>{fieldState.error.message}</FormMessage> : null} />
                        </div>
                    )}
                    
                    {selectedTechnique === 'GenericRCA' && (
                        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                            <FormLabel className="text-md font-semibold">Generic Root Cause Analysis</FormLabel>
                            <FormField control={form.control} name="genericRcaDetails.problemStatement" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm">Problem Statement</FormLabel><FormControl><Textarea placeholder="Clearly define the problem that occurred." {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="genericRcaDetails.contributingFactors" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm">Contributing Factors (Optional)</FormLabel><FormControl><Textarea placeholder="List factors that contributed to the problem, one per line." {...field} rows={4} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="genericRcaDetails.rootCauseSummary" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm">Root Cause(s) Summary</FormLabel><FormControl><Textarea placeholder="Summarize the fundamental root cause(s) identified." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    )}

                    {selectedTechnique === 'FishboneIshikawa' && (
                    <div className="space-y-4 p-3 border rounded-md bg-muted/30">
                        <div className="flex justify-between items-center">
                        <FormLabel className="text-md font-semibold">Fishbone (Ishikawa) Diagram Details</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={() => fishboneCatAppend(getDefaultFishboneCategory())}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Main Category
                        </Button>
                        </div>
                        <UICardDescription className="text-xs">
                        Define main categories (e.g., People, Process, Equipment, Environment, Materials, Management) and list potential causes under each.
                        </UICardDescription>

                        {fishboneCatFields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">No categories added yet. Click "Add Main Category" to start.</p>
                        )}

                        <div className="space-y-4">
                        {fishboneCatFields.map((catItem, catIndex) => (
                           <FishboneCategoryItem
                             key={catItem.id}
                             categoryIndex={catIndex}
                             control={form.control}
                             removeCategory={fishboneCatRemove}
                             watch={form.watch}
                           />
                         ))}
                        </div>
                        <FormField name="fishboneCategories" control={form.control} render={({ fieldState }) => fieldState.error ? <FormMessage>{fieldState.error.message || fieldState.error.root?.message}</FormMessage> : null} />
                    </div>
                    )}

                    {selectedTechnique === 'SCAT' && (
                        <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                            <FormLabel className="text-md font-semibold">SCAT Details</FormLabel>
                            <UICardDescription className="text-xs">Document key aspects of the Systematic Cause Analysis Technique.</UICardDescription>
                            <FormField control={form.control} name="scatDetails.summaryOfEvents" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm">Summary of Events / Unsafe Acts/Conditions</FormLabel><FormControl><Textarea placeholder="Describe the sequence of events and any unsafe acts or conditions observed." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="scatDetails.immediateCauses" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm">Immediate Causes</FormLabel><FormControl><Textarea placeholder="What were the direct causes of the incident?" {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="scatDetails.underlyingFactors" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm">Underlying Factors / Basic Causes</FormLabel><FormControl><Textarea placeholder="What were the underlying personal or job factors that contributed?" {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="scatDetails.systemDeficiencies" render={({ field }) => (
                                <FormItem><FormLabel className="text-sm">System Deficiencies / Lack of Control</FormLabel><FormControl><Textarea placeholder="Identify failures in management systems, standards, or procedures." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* Evidence and Witness Statements Card */}
            <Card>
                <UICardHeader className="p-2 pt-0 md:p-4 md:pt-0">
                    <UICardTitle className="text-lg">Evidence & Witness Information</UICardTitle>
                </UICardHeader>
                <CardContent className="space-y-4 p-2 md:p-4">
                    <FormField control={form.control} name="evidenceSummary" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1"><FileText className="h-4 w-4 text-muted-foreground"/>Summary of Evidence</FormLabel>
                            <FormControl><Textarea placeholder="Describe collected evidence (e.g., photos, documents, interviews). Actual file uploads require backend." rows={3} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="witnessStatementsSummary" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground"/>Summary of Witness Statements</FormLabel>
                            <FormControl><Textarea placeholder="Summarize key points from witness statements. Actual statement documents require backend." rows={3} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </CardContent>
            </Card>

            {/* Summary & CAPAs Card */}
            <Card>
                <UICardHeader className="p-2 pt-0 md:p-4 md:pt-0">
                    <UICardTitle className="text-lg">Findings & Actions</UICardTitle>
                </UICardHeader>
                <CardContent className="space-y-4 p-2 md:p-4">
                    <FormField control={form.control} name="summaryOfFindings" render={({ field }) => (
                        <FormItem><FormLabel>Overall Summary of Findings</FormLabel><FormControl><Textarea placeholder="Concisely summarize the key findings from the investigation." {...field} rows={4} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <Separator />
                    <div className="space-y-3">
                        <FormLabel className="text-md font-semibold">Corrective and Preventive Actions (CAPAs)</FormLabel>
                        {capaFields.map((item, index) => (
                            <Card key={item.id} className="p-3 space-y-2 shadow-sm bg-muted/30">
                                <div className="flex justify-between items-center">
                                    <FormLabel className="text-sm">CAPA #{index + 1}</FormLabel>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => capaRemove(index)} className="text-destructive h-6 w-6"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                                <FormField control={form.control} name={`correctiveActions.${index}.description`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Action Description</FormLabel><FormControl><Textarea placeholder="Describe the action to be taken." {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <FormField control={form.control} name={`correctiveActions.${index}.responsiblePerson`} render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Responsible</FormLabel><FormControl><Input placeholder="Name or role" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`correctiveActions.${index}.dueDate`} render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel className="text-xs">Due Date</FormLabel>
                                        <Popover><PopoverTrigger asChild><FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal text-xs h-9", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                            </Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd"): "")} initialFocus /></PopoverContent>
                                        </Popover><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`correctiveActions.${index}.status`} render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="text-xs h-9">
                                            <SelectValue placeholder="Set status" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Open">Open</SelectItem><SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem><SelectItem value="Overdue">Overdue</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                {form.watch(`correctiveActions.${index}.status`) === 'Completed' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-dashed mt-2">
                                        <FormField control={form.control} name={`correctiveActions.${index}.completionDate`} render={({ field }) => (
                                            <FormItem className="flex flex-col"><FormLabel className="text-xs">Completion Date</FormLabel>
                                            <Popover><PopoverTrigger asChild><FormControl>
                                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal text-xs h-9", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                                </Button></FormControl></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd"): "")} /></PopoverContent>
                                            </Popover><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`correctiveActions.${index}.verificationNotes`} render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Verification Notes (Optional)</FormLabel><FormControl><Textarea placeholder="How was completion verified?" {...field} rows={1} className="text-xs" /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                )}
                            </Card>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => capaAppend(getDefaultCorrectiveAction())}><PlusCircle className="mr-2 h-4 w-4" /> Add CAPA</Button>
                        <FormField name="correctiveActions" control={form.control} render={({ fieldState }) => fieldState.error ? <FormMessage>{fieldState.error.message || fieldState.error.root?.message}</FormMessage> : null} />
                    </div>
                </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <UICardHeader className="p-2 pt-0 md:p-4 md:pt-0">
                <UICardTitle className="text-lg">Investigation Status</UICardTitle>
              </UICardHeader>
              <CardContent className="p-2 md:p-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Overall Investigation Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Set status" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Open">Open</SelectItem><SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Review">Pending Review</SelectItem><SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        
        {/* Action Buttons Footer */}
        <div className="pt-4 md:pt-6 border-t flex-shrink-0 flex justify-end gap-2 p-4 md:p-6 bg-background sticky bottom-0 z-10">
          <Button type="button" variant="outline" onClick={onCancel}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" /> {isEditing ? "Save Changes" : "Create Investigation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

