
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, InfoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RiskAssessment, RiskAssessmentMethod } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { riskAssessmentMethodsList, methodSpecificGuidance } from "@/lib/risk-assessment-config";

const riskAssessmentFormSchema = z.object({
  activity: z.string().min(10, {
    message: "Activity description must be at least 10 characters.",
  }).max(1000, "Activity description must be less than 1000 characters."),
  identifiedHazards: z.string().min(10, {
    message: "Identified hazards must be at least 10 characters.",
  }).max(2000, "Identified hazards must be less than 2000 characters."),
  assessedRisks: z.string().min(10, {
    message: "Assessed risks must be at least 10 characters.",
  }).max(2000, "Assessed risks must be less than 2000 characters."),
  controlMeasures: z.string().min(10, {
    message: "Control measures must be at least 10 characters.",
  }).max(2000, "Control measures must be less than 2000 characters."),
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
      activity: initialData?.activity || "",
      identifiedHazards: initialData?.identifiedHazards || "",
      assessedRisks: initialData?.assessedRisks || "",
      controlMeasures: initialData?.controlMeasures || "",
      residualRiskLevel: initialData?.residualRiskLevel || undefined,
      methodUsed: initialData?.methodUsed || undefined,
      assessmentDate: initialData?.assessmentDate ? new Date(initialData.assessmentDate) : new Date(),
      assessor: initialData?.assessor || "",
    },
  });
  
  const selectedMethod = form.watch("methodUsed") as RiskAssessmentMethod | undefined;
  const currentGuidance = selectedMethod ? methodSpecificGuidance[selectedMethod] : null;

  useEffect(() => {
    form.reset({
      activity: initialData?.activity || "",
      identifiedHazards: initialData?.identifiedHazards || "",
      assessedRisks: initialData?.assessedRisks || "",
      controlMeasures: initialData?.controlMeasures || "",
      residualRiskLevel: initialData?.residualRiskLevel || undefined,
      methodUsed: initialData?.methodUsed || undefined,
      assessmentDate: initialData?.assessmentDate ? new Date(initialData.assessmentDate) : new Date(),
      assessor: initialData?.assessor || "",
    });
  }, [initialData, form]);


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
                    {riskAssessmentMethodsList.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormDescription>Selecting a method will show specific guidance below.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <div> {/* Placeholder for alignment if needed, or another field */} </div>
        </div>


        <FormField
          control={form.control}
          name="identifiedHazards"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identified Hazards</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List all identified hazards associated with the activity (e.g., Moving parts, electrical energy, manual handling, repetitive motion, poor ergonomics, chemical exposure)."
                  rows={4}
                  {...field}
                />
              </FormControl>
              {renderGuidance(currentGuidance?.identifiedHazards)}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assessedRisks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessed Risks</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the risks resulting from the identified hazards (e.g., Entanglement in machinery, electric shock, musculoskeletal injury, eye strain, respiratory irritation)."
                  rows={4}
                  {...field}
                />
              </FormControl>
               {renderGuidance(currentGuidance?.assessedRisks)}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="controlMeasures"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Control Measures</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List existing and proposed control measures (e.g., Machine guarding, lockout/tagout procedures, ergonomic assessments, provision of PPE, regular breaks, ventilation systems)."
                  rows={4}
                  {...field}
                />
              </FormControl>
              {renderGuidance(currentGuidance?.controlMeasures)}
              <FormMessage />
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
                          "w-full md:w-1/2 lg:w-1/3 pl-3 text-left font-normal", // Adjusted width
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
        
        <div className="flex space-x-2 pt-4 border-t">
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
