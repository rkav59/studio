
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, AlertTriangle, Send, SearchCheck, InfoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateRiskAssessmentSuggestion, type RiskAssessmentSuggestionInput, type RiskAssessmentSuggestionOutput } from "@/ai/flows/generate-risk-assessment-suggestion-flow";
import { identifyHazards, type IdentifyHazardsInput, type IdentifyHazardsOutput } from "@/ai/flows/identify-hazards-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { RiskAssessmentMethod } from "@/lib/types";
import { riskAssessmentMethodsList, methodSpecificGuidance } from "@/lib/risk-assessment-config";


const aiAssistantFormSchema = z.object({
  activityDescription: z.string().min(10, {
    message: "Activity description must be at least 10 characters.",
  }).max(2000, { message: "Activity description must be less than 2000 characters."}),
  identifiedHazards: z.string().min(5, { 
    message: "Identified hazards must be at least 5 characters.",
  }).max(2000, { message: "Identified hazards must be less than 2000 characters."}).or(z.literal("")), // Allow empty string initially
});

type AiAssistantFormValues = z.infer<typeof aiAssistantFormSchema>;

interface RiskAssessmentAiAssistantProps {
  onUseSuggestion: (suggestion: RiskAssessmentSuggestionOutput, activityInput: string, hazardsInput: string) => void;
}

export function RiskAssessmentAiAssistant({ onUseSuggestion }: RiskAssessmentAiAssistantProps) {
  const { toast } = useToast();
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [isHazardLoading, setIsHazardLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<RiskAssessmentSuggestionOutput | null>(null);
  const [lastFormValues, setLastFormValues] = useState<AiAssistantFormValues | null>(null);


  const form = useForm<AiAssistantFormValues>({
    resolver: zodResolver(aiAssistantFormSchema),
    defaultValues: {
      activityDescription: "",
      identifiedHazards: "",
    },
  });

  async function onGetSuggestionSubmit(data: AiAssistantFormValues) {
    if (!data.identifiedHazards) {
        toast({
            title: "Missing Hazards",
            description: "Please identify hazards first, either manually or using AI assist.",
            variant: "destructive",
        });
        return;
    }
    setIsSuggestionLoading(true);
    setSuggestion(null);
    setLastFormValues(data); 
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
      setIsSuggestionLoading(false);
    }
  }

  const handleIdentifyHazards = async () => {
    const activityDescription = form.getValues("activityDescription");
    if (!activityDescription) {
      form.setError("activityDescription", { type: "manual", message: "Activity description is required to identify hazards." });
      toast({
        title: "Missing Activity Description",
        description: "Please enter an activity description first.",
        variant: "destructive",
      });
      return;
    }
    setIsHazardLoading(true);
    try {
        const input: IdentifyHazardsInput = { activityDescription };
        const result: IdentifyHazardsOutput = await identifyHazards(input);
        form.setValue("identifiedHazards", result.identifiedHazards, { shouldValidate: true });
        toast({
            title: "Hazards Identified",
            description: "AI has suggested potential hazards for the activity.",
        });
    } catch (error) {
        console.error("Error identifying hazards:", error);
        toast({
            title: "Error",
            description: "Failed to identify hazards with AI. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsHazardLoading(false);
    }
  };


  const handleApplySuggestion = () => {
    if (suggestion && lastFormValues) {
      onUseSuggestion(suggestion, lastFormValues.activityDescription, lastFormValues.identifiedHazards);
      toast({
        title: "Suggestions Applied",
        description: "AI suggestions have been pre-filled into the main form.",
      });
    }
  };

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
                <form onSubmit={form.handleSubmit(onGetSuggestionSubmit)} className="space-y-8">
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
                        Clearly describe the task or process being assessed. This will be used for hazard identification and risk suggestion.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="identifiedHazards"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Known/Identified Potential Hazards</FormLabel>
                        <div className="flex items-start gap-2">
                            <FormControl className="flex-grow">
                            <Textarea
                                placeholder="e.g., Sparks, fumes, awkward postures, heavy lifting, moving vehicle, slippery surfaces. Or click 'Identify Hazards with AI'."
                                rows={3}
                                {...field}
                            />
                            </FormControl>
                            <Button type="button" variant="outline" size="sm" onClick={handleIdentifyHazards} disabled={isHazardLoading || !form.watch("activityDescription")} className="shrink-0 mt-1">
                                {isHazardLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCheck className="mr-2 h-4 w-4" />}
                                Identify Hazards with AI
                            </Button>
                        </div>
                        <FormDescription>
                        List any hazards already identified or commonly associated with this activity. AI can help populate this.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                <Button type="submit" disabled={isSuggestionLoading || !form.watch("identifiedHazards")} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isSuggestionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Get Full AI Suggestion (Risks, Controls, Method)
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
              AI Full Risk Assessment Suggestion
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
                {riskAssessmentMethodsList.includes(suggestion.suggestedMethod as RiskAssessmentMethod) &&
                 methodSpecificGuidance[suggestion.suggestedMethod as RiskAssessmentMethod]?.assessedRisks &&
                  renderGuidance(methodSpecificGuidance[suggestion.suggestedMethod as RiskAssessmentMethod]?.assessedRisks)
                }
            </div>
            <div>
                <h3 className="font-semibold text-lg mb-1">Recommended Control Measures by AI:</h3>
                <pre className="whitespace-pre-wrap rounded-md bg-secondary p-4 text-sm font-mono leading-relaxed">
                {suggestion.recommendedControls}
                </pre>
                 {riskAssessmentMethodsList.includes(suggestion.suggestedMethod as RiskAssessmentMethod) &&
                  methodSpecificGuidance[suggestion.suggestedMethod as RiskAssessmentMethod]?.controlMeasures &&
                  renderGuidance(methodSpecificGuidance[suggestion.suggestedMethod as RiskAssessmentMethod]?.controlMeasures)
                }
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
