
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
  assessmentMethods: RiskAssessmentMethod[];
  initialData?: Partial<RiskAssessment> | null;
  onCancel: () => void;
}

const methodSpecificGuidance: Partial<Record<RiskAssessmentMethod, {
  identifiedHazards?: string;
  assessedRisks?: string;
  controlMeasures?: string;
}>> = {
  "Job Safety Analysis (JSA)": {
    identifiedHazards: "For JSA: Break down the job into discrete steps. For each step, identify potential hazards (e.g., struck by, caught between, slip/trip, exposure).",
    assessedRisks: "For JSA: For each identified hazard within a job step, describe the potential negative outcomes or consequences if that hazard is realized.",
    controlMeasures: "For JSA: For each hazard, list specific actions, procedures, or PPE to eliminate or reduce the risk. Be precise for each step."
  },
  "Hazard Identification (HAZID)": {
    identifiedHazards: "For HAZID: Conduct a broad identification of hazards across the entire process, system, or area. Consider energy sources, hazardous materials, environmental conditions, and human factors.",
    assessedRisks: "For HAZID: Describe potential unwanted scenarios and their consequences that could result from the identified hazards. Think about worst-case possibilities.",
    controlMeasures: "For HAZID: List existing or proposed high-level controls. Detailed controls might be developed in a further assessment."
  },
  "Hazard and Operability Study (HAZOP)": {
    identifiedHazards: "For HAZOP: Systematically review process parameters (e.g., Flow, Temperature, Pressure) using guidewords (No, More, Less, As Well As, Part Of, Reverse, Other Than). Document deviations, causes, and consequences.",
    assessedRisks: "For HAZOP: Focus on how deviations from design intent could lead to undesirable outcomes, including safety, environmental, or operational impacts.",
    controlMeasures: "For HAZOP: Document existing safeguards for each deviation and make recommendations for new or improved safeguards where necessary."
  },
  "Failure Mode and Effects Analysis (FMEA)": {
    identifiedHazards: "For FMEA (as Failure Modes): Identify potential failure modes for each component, system, or process step. What could go wrong?",
    assessedRisks: "For FMEA (as Effects & Severity): Analyze the potential effects of each failure mode. Consider severity (S), likelihood of occurrence (O), and detectability (D) to calculate a Risk Priority Number (RPN = S x O x D).",
    controlMeasures: "For FMEA: Recommend actions to reduce high RPNs, typically by improving design, processes, or detection methods for critical failure modes."
  },
  "Fault Tree Analysis (FTA)": {
    identifiedHazards: "For FTA (as Top Event): Define a specific undesired top event (e.g., system explosion, major spill). This is the primary hazard you are analyzing.",
    assessedRisks: "For FTA: Deductively identify all sequences of lower-level equipment failures or human errors (basic events, intermediate events) that could lead to the top event. Construct a logical tree. Quantify probabilities if data is available.",
    controlMeasures: "For FTA: Identify critical paths and basic events in the fault tree where controls, redundancy, or changes can be implemented to reduce the probability of the top event occurring."
  },
  "Bowtie Analysis": {
    identifiedHazards: "For Bowtie (as the 'Knot'): Identify a specific critical event or hazard that you want to manage (this is the center of the bowtie).",
    assessedRisks: "For Bowtie: On the left side, list all credible threats that could lead to the hazard/knot. On the right side, list all potential consequences if the hazard/knot occurs and controls fail.",
    controlMeasures: "For Bowtie: On the left side, list preventive controls (barriers) for each threat. On the right side, list mitigative/recovery controls for each consequence."
  },
  "What-If Analysis": {
    identifiedHazards: "For What-If: Brainstorm a series of 'What if...?' questions related to potential equipment failures, human errors, procedural deviations, or external events.",
    assessedRisks: "For What-If: For each 'What if' question, determine the potential consequences and estimate the likelihood. Consider if existing safeguards are adequate.",
    controlMeasures: "For What-If: Document existing safeguards and, if consequences are significant and safeguards inadequate, recommend additional control measures."
  },
  "Preliminary Hazard Analysis (PHA)": {
    identifiedHazards: "For PHA: Conduct an early-stage identification of potential hazards in a new system, product, or process, often based on system design or conceptual information.",
    assessedRisks: "For PHA: Provide an initial, often qualitative, assessment of the severity and likelihood of the identified hazards to prioritize further analysis or design changes.",
    controlMeasures: "For PHA: Suggest broad control measures, design criteria, or operational considerations to mitigate the identified hazards. These are often high-level at this stage."
  }
};


export function RiskAssessmentForm({ onSaveAssessment, assessmentMethods, initialData, onCancel }: RiskAssessmentFormProps) {
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
                    {assessmentMethods.map(method => (
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
