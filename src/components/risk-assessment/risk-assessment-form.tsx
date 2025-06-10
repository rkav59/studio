
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, InfoIcon, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RiskAssessment, RiskAssessmentMethod, RiskAssessmentItem } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { riskAssessmentMethodsList, methodSpecificGuidance, type DescriptiveRiskAssessmentMethod } from "@/lib/risk-assessment-config";

const riskAssessmentItemSchema = z.object({
  id: z.string().optional(), // for react-hook-form key
  value: z.string().min(1, "Item cannot be empty.").max(500, "Item too long, 500 characters maximum."),
});

const riskAssessmentFormSchema = z.object({
  activity: z.string().min(10, {
    message: "Activity description must be at least 10 characters.",
  }).max(1000, "Activity description must be less than 1000 characters."),
  identifiedHazards: z.array(riskAssessmentItemSchema).min(1, "At least one hazard must be identified."),
  assessedRisks: z.array(riskAssessmentItemSchema).min(1, "At least one risk must be assessed."),
  controlMeasures: z.array(riskAssessmentItemSchema).min(1, "At least one control measure must be listed."),
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

export function RiskAssessmentForm({ onSaveAssessment, initialData, onCancel }: RiskAssessmentFormProps) {
  const { toast } = useToast();
  const isEditing = !!initialData?.id;

  const form = useForm<RiskAssessmentFormValues>({
    resolver: zodResolver(riskAssessmentFormSchema),
    defaultValues: {
      activity: "",
      identifiedHazards: [{ value: "" }],
      assessedRisks: [{ value: "" }],
      controlMeasures: [{ value: "" }],
      residualRiskLevel: undefined,
      methodUsed: undefined,
      assessmentDate: new Date(),
      assessor: "",
      ...initialData, // Spread initialData last to override defaults if present
      assessmentDate: initialData?.assessmentDate ? new Date(initialData.assessmentDate) : new Date(),
      // Ensure array fields are correctly initialized from initialData or with a default empty item
      identifiedHazards: initialData?.identifiedHazards && initialData.identifiedHazards.length > 0 ? initialData.identifiedHazards : [{ value: "" }],
      assessedRisks: initialData?.assessedRisks && initialData.assessedRisks.length > 0 ? initialData.assessedRisks : [{ value: "" }],
      controlMeasures: initialData?.controlMeasures && initialData.controlMeasures.length > 0 ? initialData.controlMeasures : [{ value: "" }],
    },
  });
  
  const {
    fields: hazardFields,
    append: hazardAppend,
    remove: hazardRemove,
  } = useFieldArray({
    control: form.control,
    name: "identifiedHazards",
  });

  const {
    fields: riskFields,
    append: riskAppend,
    remove: riskRemove,
  } = useFieldArray({
    control: form.control,
    name: "assessedRisks",
  });

  const {
    fields: controlMeasuresFields,
    append: controlMeasuresAppend,
    remove: controlMeasuresRemove,
  } = useFieldArray({
    control: form.control,
    name: "controlMeasures",
  });
  
  const selectedMethod = form.watch("methodUsed") as RiskAssessmentMethod | undefined;
  const currentGuidance = selectedMethod ? methodSpecificGuidance[selectedMethod] : null;

  useEffect(() => {
    form.reset({
      activity: initialData?.activity || "",
      identifiedHazards: initialData?.identifiedHazards && initialData.identifiedHazards.length > 0 ? initialData.identifiedHazards : [{ value: "" }],
      assessedRisks: initialData?.assessedRisks && initialData.assessedRisks.length > 0 ? initialData.assessedRisks : [{ value: "" }],
      controlMeasures: initialData?.controlMeasures && initialData.controlMeasures.length > 0 ? initialData.controlMeasures : [{ value: "" }],
      residualRiskLevel: initialData?.residualRiskLevel || undefined,
      methodUsed: initialData?.methodUsed || undefined,
      assessmentDate: initialData?.assessmentDate ? new Date(initialData.assessmentDate) : new Date(),
      assessor: initialData?.assessor || "",
    });
  }, [initialData, form.reset]);


  async function onSubmit(data: RiskAssessmentFormValues) {
    const assessmentToSave: RiskAssessment = {
      id: initialData?.id || new Date().toISOString(), 
      ...data,
      assessmentDate: data.assessmentDate.toISOString(),
      methodUsed: data.methodUsed as RiskAssessmentMethod | undefined,
    };
    onSaveAssessment(assessmentToSave, isEditing); 
    
    toast({
      title: isEditing ? "Risk Assessment Updated" : "Risk Assessment Logged",
      description: `Assessment for "${data.activity.substring(0,30)}..." has been successfully ${isEditing ? 'updated' : 'logged'}.`,
      variant: "default",
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
            <div> {/* Placeholder for alignment if needed, or another field */} </div>
        </div>

        {/* Identified Hazards Section */}
        <FormField
          control={form.control}
          name="identifiedHazards"
          render={() => (
            <FormItem>
              <FormLabel>Identified Hazards</FormLabel>
              <Card className="p-4 bg-secondary/20 shadow-inner">
                <CardContent className="p-0 space-y-3">
                  {hazardFields.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md bg-background shadow-sm">
                      <FormField
                        control={form.control}
                        name={`identifiedHazards.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormControl>
                              <Textarea placeholder={`Hazard ${index + 1}`} rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => hazardRemove(index)} className="mt-1 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" /><span className="sr-only">Remove Hazard</span>
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => hazardAppend({ value: "" })} className="mt-2 text-primary border-primary hover:bg-primary/10">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Hazard
                  </Button>
                </CardContent>
              </Card>
              {renderGuidance(currentGuidance?.identifiedHazards)}
              <FormMessage /> {/* For array-level errors */}
            </FormItem>
          )}
        />

        {/* Assessed Risks Section */}
        <FormField
          control={form.control}
          name="assessedRisks"
          render={() => (
            <FormItem>
              <FormLabel>Assessed Risks</FormLabel>
              <Card className="p-4 bg-secondary/20 shadow-inner">
                <CardContent className="p-0 space-y-3">
                  {riskFields.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md bg-background shadow-sm">
                      <FormField
                        control={form.control}
                        name={`assessedRisks.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormControl>
                              <Textarea placeholder={`Risk ${index + 1}`} rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => riskRemove(index)} className="mt-1 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" /><span className="sr-only">Remove Risk</span>
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => riskAppend({ value: "" })} className="mt-2 text-primary border-primary hover:bg-primary/10">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Risk
                  </Button>
                </CardContent>
              </Card>
              {renderGuidance(currentGuidance?.assessedRisks)}
              <FormMessage /> {/* For array-level errors */}
            </FormItem>
          )}
        />

        {/* Control Measures Section */}
        <FormField
          control={form.control}
          name="controlMeasures"
          render={() => (
            <FormItem>
              <FormLabel>Control Measures</FormLabel>
              <Card className="p-4 bg-secondary/20 shadow-inner">
                <CardContent className="p-0 space-y-3">
                  {controlMeasuresFields.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2 p-3 border rounded-md bg-background shadow-sm">
                      <FormField
                        control={form.control}
                        name={`controlMeasures.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormControl>
                              <Textarea placeholder={`Control Measure ${index + 1}`} rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => controlMeasuresRemove(index)} className="mt-1 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-4 w-4" /><span className="sr-only">Remove Control Measure</span>
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => controlMeasuresAppend({ value: "" })} className="mt-2 text-primary border-primary hover:bg-primary/10">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Control Measure
                  </Button>
                </CardContent>
              </Card>
              {renderGuidance(currentGuidance?.controlMeasures)}
              <FormMessage /> {/* For array-level errors */}
            </FormItem>
          )}
        />


        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="residualRiskLevel"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Residual Risk Level</FormLabel>
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

