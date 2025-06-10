
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
import { Input } from "@/components/ui/input"; // Not used, but kept for consistency
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, AlertTriangle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateRiskAssessmentSuggestion, type RiskAssessmentSuggestionInput, type RiskAssessmentSuggestionOutput } from "@/ai/flows/generate-risk-assessment-suggestion-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const aiAssistantFormSchema = z.object({
  activityDescription: z.string().min(10, {
    message: "Activity description must be at least 10 characters.",
  }).max(2000, { message: "Activity description must be less than 2000 characters."}),
  identifiedHazards: z.string().min(5, { // Renamed from potentialHazards for clarity
    message: "Identified hazards must be at least 5 characters.",
  }).max(2000, { message: "Identified hazards must be less than 2000 characters."}),
});

type AiAssistantFormValues = z.infer<typeof aiAssistantFormSchema>;

interface RiskAssessmentAiAssistantProps {
  onUseSuggestion: (suggestion: RiskAssessmentSuggestionOutput, activityInput: string, hazardsInput: string) => void;
}

export function RiskAssessmentAiAssistant({ onUseSuggestion }: RiskAssessmentAiAssistantProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<RiskAssessmentSuggestionOutput | null>(null);
  // Store form values temporarily to pass them to onUseSuggestion
  const [lastFormValues, setLastFormValues] = useState<AiAssistantFormValues | null>(null);


  const form = useForm<AiAssistantFormValues>({
    resolver: zodResolver(aiAssistantFormSchema),
    defaultValues: {
      activityDescription: "",
      identifiedHazards: "",
    },
  });

  async function onSubmit(data: AiAssistantFormValues) {
    setIsLoading(true);
    setSuggestion(null);
    setLastFormValues(data); // Store current form data
    try {
      const input: RiskAssessmentSuggestionInput = {
        activityDescription: data.activityDescription,
        identifiedHazards: data.identifiedHazards,
      };
      const result = await generateRiskAssessmentSuggestion(input);
      setSuggestion(result);
      toast({
        title: "AI Suggestion Generated",
        description: "AI has provided a risk assessment suggestion.",
      });
    } catch (error) {
      console.error("Error generating risk assessment suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleApplySuggestion = () => {
    if (suggestion && lastFormValues) {
      onUseSuggestion(suggestion, lastFormValues.activityDescription, lastFormValues.identifiedHazards);
      // Optionally reset AI assistant form or clear suggestion after applying
      // setSuggestion(null); 
      // form.reset();
      toast({
        title: "Suggestions Applied",
        description: "AI suggestions have been pre-filled into the main form.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                AI-Assisted Risk Assessment
            </CardTitle>
            <CardDescription>
                Provide details about the activity and known hazards to get AI-powered suggestions for your risk assessment.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="activityDescription"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Activity/Process Description</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="e.g., Welding operations in a confined space, manual handling of heavy boxes, operating a forklift."
                            rows={3}
                            {...field}
                        />
                        </FormControl>
                        <FormDescription>
                        Clearly describe the task or process being assessed.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="identifiedHazards" // Changed from potentialHazards
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Known/Identified Potential Hazards</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="e.g., Sparks, fumes, awkward postures, heavy lifting, moving vehicle, slippery surfaces."
                            rows={3}
                            {...field}
                        />
                        </FormControl>
                        <FormDescription>
                        List any hazards already identified or commonly associated with this activity.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Get AI Suggestion
                </Button>
                </form>
            </Form>
        </CardContent>
      </Card>


      {suggestion && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Risk Assessment Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <h3 className="font-semibold text-lg mb-1">Suggested Risk Assessment Method:</h3>
                <p className="text-primary font-medium p-2 bg-primary/10 rounded-md">{suggestion.suggestedMethod || "N/A"}</p>
            </div>
            <div>
                <h3 className="font-semibold text-lg mb-1">Potential Risks Identified by AI:</h3>
                <pre className="whitespace-pre-wrap rounded-md bg-secondary p-4 text-sm font-mono leading-relaxed">
                {suggestion.potentialRisks}
                </pre>
            </div>
            <div>
                <h3 className="font-semibold text-lg mb-1">Recommended Control Measures by AI:</h3>
                <pre className="whitespace-pre-wrap rounded-md bg-secondary p-4 text-sm font-mono leading-relaxed">
                {suggestion.recommendedControls}
                </pre>
            </div>
            <Button onClick={handleApplySuggestion} className="mt-4 bg-primary hover:bg-primary/90">
                <Send className="mr-2 h-4 w-4" /> Use These Suggestions in Form
            </Button>
          </CardContent>
          <CardFooter>
            <Alert variant="default" className="border-accent">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent">Important Disclaimer</AlertTitle>
                <AlertDescription>
                These AI-generated suggestions are for guidance only and should be critically reviewed and validated by qualified SHEQ professionals before implementation. Local regulations and site-specific conditions must always take precedence.
                </AlertDescription>
            </Alert>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

    