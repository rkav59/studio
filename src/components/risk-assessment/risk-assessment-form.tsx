
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

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
import { CalendarIcon, Workflow } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RiskAssessment, RiskAssessmentMethod } from "@/lib/types";

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
  methodUsed: z.string().optional(), // Will be from RiskAssessmentMethod type
  assessmentDate: z.date({
    required_error: "An assessment date is required.",
  }),
  assessor: z.string().min(2, {
    message: "Assessor name must be at least 2 characters.",
  }),
});

type RiskAssessmentFormValues = z.infer<typeof riskAssessmentFormSchema>;

interface RiskAssessmentFormProps {
  onRiskAssessmentLogged: (assessment: RiskAssessment) => void;
  assessmentMethods: RiskAssessmentMethod[];
}

export function RiskAssessmentForm({ onRiskAssessmentLogged, assessmentMethods }: RiskAssessmentFormProps) {
  const { toast } = useToast();
  const form = useForm<RiskAssessmentFormValues>({
    resolver: zodResolver(riskAssessmentFormSchema),
    defaultValues: {
      activity: "",
      identifiedHazards: "",
      assessedRisks: "",
      controlMeasures: "",
      residualRiskLevel: undefined,
      methodUsed: undefined,
      assessmentDate: new Date(),
      assessor: "",
    },
  });

  async function onSubmit(data: RiskAssessmentFormValues) {
    const newAssessment: RiskAssessment = {
      id: new Date().toISOString(), // Simple ID generation
      ...data,
      assessmentDate: data.assessmentDate.toISOString(),
      methodUsed: data.methodUsed as RiskAssessmentMethod, // Cast as it's optional in schema but methodUsed is RiskAssessmentMethod
    };
    onRiskAssessmentLogged(newAssessment); 
    
    toast({
      title: "Risk Assessment Logged",
      description: `Assessment for "${data.activity.substring(0,30)}..." has been successfully logged.`,
      variant: "default",
    });
    form.reset(); 
  }

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
              <FormDescription>One hazard per line or comma-separated.</FormDescription>
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
               <FormDescription>Detail the potential consequences.</FormDescription>
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
              <FormDescription>Specify controls to mitigate the risks.</FormDescription>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            name="methodUsed"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Assessment Method Used</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                            "w-full pl-3 text-left font-normal",
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
        
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Workflow className="mr-2 h-4 w-4" /> Log Risk Assessment
        </Button>
      </form>
    </Form>
  );
}

