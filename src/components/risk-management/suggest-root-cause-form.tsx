
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
import { Loader2, Brain, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { suggestRootCause, type SuggestRootCauseInput, type SuggestRootCauseOutput } from "@/ai/flows/suggest-root-cause-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const suggestRootCauseFormSchema = z.object({
  incidentDescription: z.string().min(10, {
    message: "Incident/Risk description must be at least 10 characters.",
  }).max(1000, { message: "Description must be less than 1000 characters."}),
  summaryOfFindings: z.string().min(10, {
    message: "Summary of findings/details must be at least 10 characters.",
  }).max(3000, { message: "Summary must be less than 3000 characters."}),
});

type SuggestRootCauseFormValues = z.infer<typeof suggestRootCauseFormSchema>;

interface SuggestRootCauseFormProps {
  onSuggestionsGenerated?: (suggestions: string) => void; // Made optional for now, but will be used by parent page
}

export function SuggestRootCauseForm({ onSuggestionsGenerated }: SuggestRootCauseFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [rootCauseSuggestions, setRootCauseSuggestions] = useState<string | null>(null);

  const form = useForm<SuggestRootCauseFormValues>({
    resolver: zodResolver(suggestRootCauseFormSchema),
    defaultValues: {
      incidentDescription: "",
      summaryOfFindings: "",
    },
  });

  async function onSubmit(data: SuggestRootCauseFormValues) {
    setIsLoading(true);
    setRootCauseSuggestions(null);
    try {
      const input: SuggestRootCauseInput = {
        incidentDescription: data.incidentDescription,
        summaryOfFindings: data.summaryOfFindings,
      };
      const result: SuggestRootCauseOutput = await suggestRootCause(input);
      setRootCauseSuggestions(result.suggestedRootCauses);
      if (onSuggestionsGenerated) {
        onSuggestionsGenerated(result.suggestedRootCauses);
      }
      toast({
        title: "Root Cause Suggestions Generated",
        description: "AI has provided potential root causes based on your input.",
      });
    } catch (error) {
      console.error("Error generating root cause suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate root cause suggestions. Please try again.",
        variant: "destructive",
      });
      if (onSuggestionsGenerated) {
        onSuggestionsGenerated(""); // Clear suggestions in parent on error
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        {/* Title and Description will be handled by parent page if needed */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="incidentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident/Risk Title or Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Repeated Pump Failure - Unit 5, High number of trip hazards in Warehouse B" {...field} />
                  </FormControl>
                  <FormDescription>
                    Provide a concise title or description of the event/risk.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summaryOfFindings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary of Findings / Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what happened, any immediate causes identified, relevant conditions, equipment involved, personnel actions, etc."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context and details from your initial investigation or risk assessment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading} className="w-full bg-purple-500 hover:bg-purple-600 text-white">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Suggest Potential Root Causes
            </Button>
          </form>
        </Form>

        {rootCauseSuggestions && (
          <div className="mt-6 space-y-3">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Suggested Root Causes:
            </h3>
            <Alert variant="default" className="bg-muted/50">
                <AlertDescription>
                    <pre className="whitespace-pre-wrap rounded-md p-3 text-sm font-mono leading-relaxed">
                    {rootCauseSuggestions}
                    </pre>
                </AlertDescription>
            </Alert>
            <p className="text-xs text-muted-foreground">
              Note: These are AI-generated suggestions and should be critically reviewed and validated as part of a formal root cause analysis process.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
