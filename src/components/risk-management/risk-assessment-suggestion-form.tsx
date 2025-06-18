
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, ShieldQuestion, CheckSquare, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateRiskAssessmentSuggestion, type RiskAssessmentSuggestionInput, type RiskAssessmentSuggestionOutput } from "@/ai/flows/generate-risk-assessment-suggestion-flow";
import { riskAssessmentMethodsList } from "@/lib/risk-assessment-config";
import { ScrollArea } from "../ui/scroll-area";

const riskAssessmentSuggestionFormSchema = z.object({
  activityDescription: z.string().min(20, {
    message: "Activity description must be at least 20 characters.",
  }).max(2000),
  identifiedHazards: z.string().min(10, {
    message: "Identified hazards summary must be at least 10 characters.",
  }).max(2000),
  preferredMethod: z.string().optional(),
});

type RiskAssessmentSuggestionFormValues = z.infer<typeof riskAssessmentSuggestionFormSchema>;

export function RiskAssessmentSuggestionForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<RiskAssessmentSuggestionOutput | null>(null);

  const form = useForm<RiskAssessmentSuggestionFormValues>({
    resolver: zodResolver(riskAssessmentSuggestionFormSchema),
    defaultValues: {
      activityDescription: "",
      identifiedHazards: "",
      preferredMethod: "",
    },
  });

  async function onSubmit(data: RiskAssessmentSuggestionFormValues) {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const input: RiskAssessmentSuggestionInput = {
        activityDescription: data.activityDescription,
        identifiedHazards: data.identifiedHazards,
        preferredMethod: data.preferredMethod || undefined,
      };
      const result = await generateRiskAssessmentSuggestion(input);
      setSuggestions(result);
      toast({
        title: "Risk Assessment Suggestions Generated",
        description: "AI has provided suggestions. Please review carefully.",
      });
    } catch (error) {
      console.error("Error generating RA suggestions:", error);
      toast({
        title: "Error Generating Suggestions",
        description: "Failed to get RA suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderControlsList = (title: string, controls?: string[]) => {
    if (!controls || controls.length === 0) return null;
    return (
      <div>
        <h4 className="font-medium text-sm text-primary/90">{title}:</h4>
        <ul className="list-disc list-inside pl-4 text-xs space-y-0.5">
          {controls.map((control, index) => (
            <li key={index}>{control}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldQuestion className="h-6 w-6 text-blue-500" />
          AI Risk Assessment Assist
        </CardTitle>
        <CardDescription>
          Provide details about an activity and known hazards to get AI-driven suggestions for potential risks, control measures (hierarchy of controls), and a suitable assessment methodology.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="activityDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity/Process Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Welding stainless steel components in a confined space', 'Routine maintenance of conveyor belt system'"
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
                  <FormLabel>Summary of Identified Potential Hazards</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Fumes, UV radiation, electric shock, awkward posture, limited ventilation', 'Entanglement, stored energy, unexpected startup'"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>List key hazards already identified for this activity.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Risk Assessment Method (Optional)</FormLabel>
                   <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="">None / Let AI suggest</option>
                      {riskAssessmentMethodsList.map(method => (
                          <option key={method.name} value={method.name}>{method.name}</option>
                      ))}
                   </select>
                  <FormDescription>If you have a method in mind, select it. Otherwise, AI will suggest one.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-600 text-white">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Get AI Suggestions
            </Button>
          </CardContent>
        </form>
      </Form>

      {suggestions && (
        <>
          <CardHeader className="border-t pt-6">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Generated Risk Assessment Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-md bg-secondary/30">
              <h3 className="font-semibold text-primary mb-1">Suggested Method:</h3>
              <p className="text-sm font-medium">{suggestions.suggestedMethod}</p>
              <p className="text-xs text-muted-foreground">{riskAssessmentMethodsList.find(m => m.name === suggestions.suggestedMethod)?.description}</p>
            </div>

            <div className="p-3 border rounded-md bg-secondary/30">
              <h3 className="font-semibold text-primary mb-1">Potential Risks Identified:</h3>
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{suggestions.potentialRisks}</pre>
            </div>
            
            <div className="p-3 border rounded-md bg-secondary/30 space-y-2">
              <h3 className="font-semibold text-primary mb-1">Recommended Control Measures (Hierarchy of Controls):</h3>
              {renderControlsList("Elimination", suggestions.recommendedControls.elimination)}
              {renderControlsList("Substitution", suggestions.recommendedControls.substitution)}
              {renderControlsList("Engineering Controls", suggestions.recommendedControls.engineering)}
              {renderControlsList("Administrative Controls", suggestions.recommendedControls.administrative)}
              {renderControlsList("Personal Protective Equipment (PPE)", suggestions.recommendedControls.ppe)}
              {Object.values(suggestions.recommendedControls).every(arr => !arr || arr.length === 0) && (
                <p className="text-sm text-muted-foreground italic">No specific controls suggested for some categories, or further detail needed.</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Disclaimer: These are AI-generated suggestions and are not a substitute for professional judgment and a comprehensive, site-specific risk assessment conducted by competent persons.
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
