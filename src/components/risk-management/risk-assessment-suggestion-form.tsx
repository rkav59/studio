
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, ShieldQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateRiskAssessmentSuggestion, type RiskAssessmentSuggestionInput, type RiskAssessmentSuggestionOutput } from "@/ai/flows/generate-risk-assessment-suggestion-flow";
import { riskAssessmentMethodsList } from "@/lib/risk-assessment-config";

const suggestionFormSchema = z.object({
  activityDescription: z.string().min(10, {
    message: "Activity description must be at least 10 characters.",
  }).max(2000, { message: "Activity description must be less than 2000 characters."}),
  identifiedHazards: z.string().min(10, {
    message: "Identified hazards must be at least 10 characters.",
  }).max(2000, { message: "Identified hazards must be less than 2000 characters."}),
  preferredMethod: z.string().optional(),
});

type SuggestionFormValues = z.infer<typeof suggestionFormSchema>;

interface RiskAssessmentSuggestionFormProps {
  onSuggestionsGenerated: (suggestions: RiskAssessmentSuggestionOutput) => void;
}

export function RiskAssessmentSuggestionForm({ onSuggestionsGenerated }: RiskAssessmentSuggestionFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<RiskAssessmentSuggestionOutput | null>(null);

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: {
      activityDescription: "",
      identifiedHazards: "",
      preferredMethod: "",
    },
  });

  async function onSubmit(data: SuggestionFormValues) {
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
      onSuggestionsGenerated(result); // Pass to parent
      toast({
        title: "Suggestions Generated",
        description: "AI has provided risk assessment suggestions based on your input.",
      });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        {/* Title moved to parent page */}
        <CardDescription>
          Describe the activity and identified hazards to get AI-powered suggestions for potential risks, control measures (categorized by hierarchy), and a suitable assessment methodology.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="activityDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity/Process Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Welding operations in a confined space, Manual handling of heavy components, Working at height on scaffolding"
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
                      placeholder="e.g., Fumes, sparks, restricted movement, awkward posture, potential for falling objects, unstable ground"
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
              name="preferredMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Assessment Method (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a preferred method or leave blank for AI recommendation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Let AI Suggest</SelectItem>
                      {riskAssessmentMethodsList.map(method => (
                        <SelectItem key={method.name} value={method.name}>{method.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    AI will consider your preference but may suggest a more suitable method.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Get AI Suggestions
            </Button>
          </form>
        </Form>

        {suggestions && (
          <div className="mt-6 space-y-4">
            <h3 className="text-md font-semibold">AI-Powered Suggestions:</h3>
            
            <Card>
              <CardHeader><CardTitle className="text-base">Potential Risks Identified</CardTitle></CardHeader>
              <CardContent><pre className="whitespace-pre-wrap text-sm p-2 bg-muted/50 rounded-md">{suggestions.potentialRisks}</pre></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Recommended Control Measures (Hierarchy of Controls)</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(suggestions.recommendedControls).map(([category, measures]) => {
                  if (measures && measures.length > 0) {
                    return (
                      <div key={category}>
                        <p className="font-semibold capitalize">{category}:</p>
                        <ul className="list-disc list-inside pl-4 text-muted-foreground">
                          {(measures as string[]).map((measure, idx) => <li key={idx}>{measure}</li>)}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })}
                {Object.values(suggestions.recommendedControls).every(val => !val || val.length === 0) && (
                  <p className="text-muted-foreground italic">No specific control measures suggested in these categories based on input.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle className="text-base">Suggested Risk Assessment Method</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-semibold text-primary">{suggestions.suggestedMethod}</p></CardContent>
            </Card>
             <p className="text-xs text-muted-foreground pt-2">
              Note: These suggestions are AI-generated and should be critically reviewed and validated by qualified personnel.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

