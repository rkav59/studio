
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
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSafetyRecommendation, type SafetyRecommendationInput, type SafetyRecommendationOutput } from "@/ai/flows/generate-safety-recommendation";

const recommendationFormSchema = z.object({
  incidentLogs: z.string().min(20, {
    message: "Incident logs summary must be at least 20 characters.",
  }).max(5000, { message: "Incident logs summary must be less than 5000 characters."}),
  inspectionData: z.string().min(20, {
    message: "Inspection data summary must be at least 20 characters.",
  }).max(5000, { message: "Inspection data summary must be less than 5000 characters."}),
  country: z.string().min(2, {
    message: "Country must be at least 2 characters.",
  }).max(100, { message: "Country must be less than 100 characters."}),
  siteLocation: z.string().min(2, {
    message: "Site/Location must be at least 2 characters.",
  }).max(100, { message: "Site/Location must be less than 100 characters."}),
});

type RecommendationFormValues = z.infer<typeof recommendationFormSchema>;

export function RecommendationGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string | null>(null);

  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(recommendationFormSchema),
    defaultValues: {
      incidentLogs: "",
      inspectionData: "",
      country: "",
      siteLocation: "",
    },
  });

  async function onSubmit(data: RecommendationFormValues) {
    setIsLoading(true);
    setRecommendations(null);
    try {
      const input: SafetyRecommendationInput = {
        incidentLogs: data.incidentLogs,
        inspectionData: data.inspectionData,
        country: data.country,
        siteLocation: data.siteLocation,
      };
      const result: SafetyRecommendationOutput = await generateSafetyRecommendation(input);
      setRecommendations(result.recommendations);
      toast({
        title: "Recommendations Generated",
        description: "AI has provided safety recommendations based on your input.",
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="incidentLogs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incident Logs Summary</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste or summarize relevant incident logs here (e.g., types of incidents, common causes, frequencies)."
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide a concise summary of recent incident trends.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inspectionData"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inspection Data Summary</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Summarize key findings from recent inspections (e.g., common non-conformities, areas needing improvement)."
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Highlight significant observations from safety inspections.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., United States, Germany" {...field} />
                  </FormControl>
                  <FormDescription>
                    Specify the country for region-specific advice.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="siteLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site/Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Manufacturing Plant X, North Sector Mine" {...field} />
                  </FormControl>
                  <FormDescription>
                    Provide the specific site or operational location.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Recommendations
          </Button>
        </form>
      </Form>

      {recommendations && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              AI-Powered Safety Recommendations
            </CardTitle>
            <CardDescription>
              Based on the provided data, here are some suggested safety improvements for {form.getValues("siteLocation")} in {form.getValues("country")}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-md bg-secondary p-4 text-sm font-mono leading-relaxed">
              {recommendations}
            </pre>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Note: These recommendations are AI-generated and should be reviewed by a qualified safety professional before implementation.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
