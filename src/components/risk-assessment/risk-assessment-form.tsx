
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UICardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, InfoIcon, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RiskAssessment, RiskAssessmentMethod, HazardEntry, RiskEntry, RiskControlItem } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { riskAssessmentMethodsList, methodSpecificGuidance, type DescriptiveRiskAssessmentMethod } from "@/lib/risk-assessment-config";

// Zod schemas for the new nested structure
const riskControlItemSchema = z.object({
  id: z.string().optional(),
  value: z.string().max(1000, "Item too long, 1000 characters maximum.").optional(), // Made value optional
});

const riskEntrySchema = z.object({
  id: z.string().optional(),
  risk: riskControlItemSchema, // Risk description (value) is now optional
  existingControls: z.array(riskControlItemSchema).optional().default([]),
  proposedControls: z.array(riskControlItemSchema).optional().default([]),
});

const hazardEntrySchema = z.object({
  id: z.string().optional(),
  hazard: riskControlItemSchema.refine(data => data.value && data.value.trim().length > 0, {
    message: "Hazard description cannot be empty.", // Hazard description remains required
  }),
  assessedRisks: z.array(riskEntrySchema), // Can be empty initially if desired, or min(1) if a risk is always needed per hazard
});

// Main form schema
const riskAssessmentFormSchema = z.object({
  activity: z.string().min(10, {
    message: "Activity description must be at least 10 characters.",
  }).max(1000, "Activity description must be less than 1000 characters."),
  hazardEntries: z.array(hazardEntrySchema).min(1, "At least one hazard must be documented."),
  residualRiskLevel: z.enum(["Low", "Medium", "High"], {
    required_error: "Please select a residual risk level.",
  }),
  methodUsed: z.string().optional(),
  assessmentDate: z.date({
    required_error: "An assessment date is required.",
  }),
  assessor: z.string().min(2, {
    message: "Assessor name must be at least 2 characters.",
  }),
});

type RiskAssessmentFormValues = z.infer<typeof riskAssessmentFormSchema>;

interface RiskAssessmentFormProps {
  onSaveAssessment: (assessment: RiskAssessment, isEditing: boolean) => void;
  initialData?: Partial<RiskAssessment> | null;
  onCancel: () => void;
}

const defaultRiskControlItem = (): RiskControlItem => ({ value: "" }); // Default is empty string, schema handles min length if required
const defaultRiskEntry = (): RiskEntry => ({ 
    risk: { value: "" }, // Risk description defaults to empty
    existingControls: [defaultRiskControlItem()], 
    proposedControls: [defaultRiskControlItem()] 
});
const defaultHazardEntry = (): HazardEntry => ({ hazard: { value: "" }, assessedRisks: [defaultRiskEntry()] });


export function RiskAssessmentForm({ onSaveAssessment, initialData, onCancel }: RiskAssessmentFormProps) {
  const { toast } = useToast();
  const isEditing = !!initialData?.id;

  const form = useForm<RiskAssessmentFormValues>({
    resolver: zodResolver(riskAssessmentFormSchema),
    defaultValues: {
      activity: "",
      hazardEntries: [defaultHazardEntry()],
      residualRiskLevel: undefined,
      methodUsed: undefined,
      assessmentDate: new Date(),
      assessor: "",
    },
  });
  
  const { fields: hazardFields, append: hazardAppend, remove: hazardRemove } = useFieldArray({
    control: form.control,
    name: "hazardEntries",
  });
  
  const selectedMethod = form.watch("methodUsed") as RiskAssessmentMethod | undefined;
  const currentGuidance = selectedMethod ? methodSpecificGuidance[selectedMethod] : null;

  useEffect(() => {
    if (initialData) {
      const transformedInitialData = {
        ...initialData,
        assessmentDate: initialData.assessmentDate ? new Date(initialData.assessmentDate) : new Date(),
        hazardEntries: initialData.hazardEntries && initialData.hazardEntries.length > 0
          ? initialData.hazardEntries.map(he => ({
              ...he,
              hazard: he.hazard || { value: "" },
              assessedRisks: he.assessedRisks && he.assessedRisks.length > 0
                ? he.assessedRisks.map(ar => {
                    return {
                      ...ar,
                      risk: ar.risk || { value: "" }, // Ensure risk object exists, value can be empty/undefined
                      existingControls: (ar.existingControls && ar.existingControls.length > 0 ? ar.existingControls.map(ec => ec || defaultRiskControlItem()) : [defaultRiskControlItem()]),
                      proposedControls: (ar.proposedControls && ar.proposedControls.length > 0 ? ar.proposedControls.map(pc => pc || defaultRiskControlItem()) : [defaultRiskControlItem()]),
                    };
                  })
                : [defaultRiskEntry()]
            }))
          : [defaultHazardEntry()],
      };
      form.reset(transformedInitialData  as RiskAssessmentFormValues);
    } else {
      form.reset({
        activity: "",
        hazardEntries: [defaultHazardEntry()],
        residualRiskLevel: undefined,
        methodUsed: undefined,
        assessmentDate: new Date(),
        assessor: "",
      });
    }
  }, [initialData, form]); // form.reset was form before


  async function onSubmit(data: RiskAssessmentFormValues) {
    const assessmentToSave: RiskAssessment = {
      id: initialData?.id || new Date().toISOString(), 
      ...data,
      assessmentDate: data.assessmentDate.toISOString(),
      methodUsed: data.methodUsed as RiskAssessmentMethod | undefined,
      hazardEntries: data.hazardEntries.map(he => ({
        ...he,
        hazard: he.hazard, // hazard value is now required by schema refine
        assessedRisks: he.assessedRisks.map(ar => ({
            ...ar,
            risk: ar.risk, // risk value is optional
            existingControls: ar.existingControls?.filter(c => c.value && c.value.trim() !== '') || [], 
            proposedControls: ar.proposedControls?.filter(c => c.value && c.value.trim() !== '') || [],
        }))
      }))
    };
    onSaveAssessment(assessmentToSave, isEditing); 
    
    toast({
      title: isEditing ? "Risk Assessment Updated" : "Risk Assessment Logged",
      description: `Assessment for "${data.activity.substring(0,30)}..." has been successfully ${isEditing ? 'updated' : 'logged'}.`,
    });
  }

  const renderGuidance = (text?: string) => {
    if (!text) return null;
    return (
      <Alert variant="info" className="mt-2 text-xs">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>{text}</AlertDescription>
      </Alert>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="activity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity/Process Being Assessed</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the activity or process in detail (e.g., Routine maintenance of conveyor belt, Office-based data entry tasks)."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="methodUsed"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Assessment Method Used</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select assessment method (optional)" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {(riskAssessmentMethodsList as DescriptiveRiskAssessmentMethod[]).map(method => (
                        <SelectItem key={method.name} value={method.name}>{method.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormDescription>Selecting a method may show specific guidance below.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {/* Hazard Entries Section */}
        <div className="space-y-6">
          <FormLabel className="text-lg font-semibold">Hazards, Risks, and Controls</FormLabel>
          {hazardFields.map((hazardItem, hazardIndex) => (
            <Card key={hazardItem.id} className="p-4 border-primary/50 shadow-md">
              <CardHeader className="p-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md">Hazard #{hazardIndex + 1}</CardTitle>
                  <Button type="button" variant="ghost" size="icon" onClick={() => hazardRemove(hazardIndex)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" /> <span className="sr-only">Remove Hazard</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-4">
                <div className="space-y-2 pl-4 border-l-2 border-muted/70 ml-1 py-2">
                    <FormField
                    control={form.control}
                    name={`hazardEntries.${hazardIndex}.hazard.value`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-sm font-medium">Describe Hazard</FormLabel>
                        <FormControl>
                            <Textarea placeholder="e.g., Working at height, Chemical exposure" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    {renderGuidance(currentGuidance?.identifiedHazards)}
                </div>

                {/* Assessed Risks within this Hazard */}
                <Controller
                  control={form.control}
                  name={`hazardEntries.${hazardIndex}.assessedRisks`}
                  render={({ field: { onChange, value: riskFieldValue, name: riskFieldName } }) => {
                    const { fields: riskFields, append: riskAppend, remove: riskRemove } = useFieldArray({
                      control: form.control,
                      name: riskFieldName as `hazardEntries.${number}.assessedRisks`,
                    });
                    return (
                      <div className="space-y-3 pl-4 border-l-2 border-secondary ml-2">
                        <FormLabel className="text-base font-medium">Associated Risks for Hazard #{hazardIndex + 1}</FormLabel>
                        {riskFields.map((riskItem, riskIndex) => (
                          <Card key={riskItem.id} className="p-3 bg-secondary/30 shadow-sm">
                            <CardHeader className="p-1">
                              <div className="flex justify-between items-center">
                                <UICardDescription className="text-sm">Risk #{riskIndex + 1}</UICardDescription>
                                <Button type="button" variant="ghost" size="icon" onClick={() => riskRemove(riskIndex)} className="text-destructive hover:text-destructive/80">
                                  <Trash2 className="h-4 w-4" /><span className="sr-only">Remove Risk</span>
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-1 space-y-4">
                                <div className="space-y-2 pl-4 border-l-2 border-muted/70 ml-1 py-2">
                                   {/* Replaced FormField for risk.value with an "Add Risk" button */}
                                   {/* This button is intended to add a new risk to the CURRENT HAZARD, which is what riskAppend does */}
                                   {/* However, placing it here replaces the description field of the CURRENT risk item */}
                                   {/* This is a functional change where individual risk descriptions are removed */}
                                   <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => riskAppend(defaultRiskEntry())}
                                      className="text-primary border-primary hover:bg-primary/10"
                                    >
                                      <PlusCircle className="mr-2 h-4 w-4" /> Add Another Risk to Hazard #{hazardIndex + 1}
                                    </Button>
                                    <FormDescription className="text-xs">Individual risk descriptions are no longer available. Use the button above to add a new risk structure to this hazard.</FormDescription>
                                    {renderGuidance(currentGuidance?.assessedRisks)}
                                </div>

                              {/* Existing Control Measures for this Risk */}
                              <div className="space-y-2 pl-4 border-l-2 border-muted/70 ml-1 py-2">
                                <FormLabel className="text-sm font-medium">Existing Control Measures</FormLabel>
                                <Controller
                                  control={form.control}
                                  name={`hazardEntries.${hazardIndex}.assessedRisks.${riskIndex}.existingControls`}
                                  render={() => {
                                    const { fields: existingControlFields, append: existingControlAppend, remove: existingControlRemove } = useFieldArray({
                                      control: form.control,
                                      name: `hazardEntries.${hazardIndex}.assessedRisks.${riskIndex}.existingControls`,
                                    });
                                    return (
                                      <>
                                        {existingControlFields.map((controlItem, controlIndex) => (
                                          <div key={controlItem.id} className="flex items-start gap-2 p-2 border rounded-md bg-background shadow-xs">
                                            <FormField
                                              control={form.control}
                                              name={`hazardEntries.${hazardIndex}.assessedRisks.${riskIndex}.existingControls.${controlIndex}.value`}
                                              render={({ field }) => (
                                                <FormItem className="flex-grow">
                                                  <FormLabel className="text-xs sr-only">Existing Control #{controlIndex + 1}</FormLabel>
                                                  <FormControl>
                                                    <Textarea placeholder={`Existing Control ${controlIndex + 1}`} rows={1} {...field} />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => existingControlRemove(controlIndex)} className="mt-0.5 text-muted-foreground hover:text-destructive shrink-0">
                                              <Trash2 className="h-3 w-3" /><span className="sr-only">Remove Control</span>
                                            </Button>
                                          </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => existingControlAppend(defaultRiskControlItem())} className="text-xs text-blue-600 border-blue-600 hover:bg-blue-600/10">
                                          <PlusCircle className="mr-1 h-3 w-3" /> Add Existing Control
                                        </Button>
                                      </>
                                    );
                                  }}
                                />
                                {renderGuidance(currentGuidance?.controlMeasures)}
                              </div>
                              
                              {/* Proposed Control Measures for this Risk */}
                              <div className="space-y-2 pl-4 border-l-2 border-muted/70 ml-1 py-2">
                                <FormLabel className="text-sm font-medium">Proposed Control Measures</FormLabel>
                                <Controller
                                  control={form.control}
                                  name={`hazardEntries.${hazardIndex}.assessedRisks.${riskIndex}.proposedControls`}
                                  render={() => {
                                    const { fields: proposedControlFields, append: proposedControlAppend, remove: proposedControlRemove } = useFieldArray({
                                      control: form.control,
                                      name: `hazardEntries.${hazardIndex}.assessedRisks.${riskIndex}.proposedControls`,
                                    });
                                    return (
                                      <>
                                        {proposedControlFields.map((controlItem, controlIndex) => (
                                          <div key={controlItem.id} className="flex items-start gap-2 p-2 border rounded-md bg-background shadow-xs">
                                            <FormField
                                              control={form.control}
                                              name={`hazardEntries.${hazardIndex}.assessedRisks.${riskIndex}.proposedControls.${controlIndex}.value`}
                                              render={({ field }) => (
                                                <FormItem className="flex-grow">
                                                  <FormLabel className="text-xs sr-only">Proposed Control #{controlIndex + 1}</FormLabel>
                                                  <FormControl>
                                                    <Textarea placeholder={`Proposed Control ${controlIndex + 1}`} rows={1} {...field} />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => proposedControlRemove(controlIndex)} className="mt-0.5 text-muted-foreground hover:text-destructive shrink-0">
                                              <Trash2 className="h-3 w-3" /><span className="sr-only">Remove Control</span>
                                            </Button>
                                          </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => proposedControlAppend(defaultRiskControlItem())} className="text-xs text-green-600 border-green-600 hover:bg-green-600/10">
                                          <PlusCircle className="mr-1 h-3 w-3" /> Add Proposed Control
                                        </Button>
                                      </>
                                    );
                                  }}
                                />
                                {renderGuidance(currentGuidance?.controlMeasures)}
                              </div>

                            </CardContent>
                          </Card>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => riskAppend(defaultRiskEntry())} className="text-primary border-primary hover:bg-primary/10">
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Risk to Hazard #{hazardIndex+1}
                        </Button>
                      </div>
                    );
                  }}
                />
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="default" onClick={() => hazardAppend(defaultHazardEntry())} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Hazard Entry
          </Button>
           <FormField name="hazardEntries" control={form.control} render={() => <FormMessage />} />
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="residualRiskLevel"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Overall Residual Risk Level (Post Controls)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select residual risk level" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="assessor"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Assessor(s)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., John Doe, SHEQ Department" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="assessmentDate"
          render={({ field }) => (
              <FormItem className="flex flex-col">
              <FormLabel>Date of Assessment</FormLabel>
              <Popover>
                  <PopoverTrigger asChild>
                  <FormControl>
                      <Button
                      variant={"outline"}
                      className={cn(
                          "w-full md:w-1/2 lg:w-1/3 pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                      )}
                      >
                      {field.value ? (
                          format(field.value, "PPP")
                      ) : (
                          <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                  </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                  />
                  </PopoverContent>
              </Popover>
              <FormMessage />
              </FormItem>
          )}
        />
        
        <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="mr-2 h-4 w-4" /> {isEditing ? "Save Changes" : "Log Risk Assessment"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
        </div>
      </form>
    </Form>
  );
}

