
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
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { identifyHazards, type IdentifyHazardsInput, type IdentifyHazardsOutput } from "@/ai/flows/identify-hazards-flow";
import { ScrollArea } from "@/components/ui/scroll-area";

const hazardIdFormSchema = z.object({
  activityDescription: z.string().min(20, {
    message: "Activity description must be at least 20 characters.",
  }).max(2000, { message: "Activity description must be less than 2000 characters."}),
});

type HazardIdFormValues = z.infer<typeof hazardIdFormSchema>;

export function HazardIdentificationForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [identifiedHazards, setIdentifiedHazards] = useState<string | null>(null);

  const form = useForm<HazardIdFormValues>({
    resolver: zodResolver(hazardIdFormSchema),
    defaultValues: {
      activityDescription: "",
    },
  });

  async function onSubmit(data: HazardIdFormValues) {
    setIsLoading(true);
    setIdentifiedHazards(null);
    try {
      const input: IdentifyHazardsInput = {
        activityDescription: data.activityDescription,
      };
      const result: IdentifyHazardsOutput = await identifyHazards(input);
      setIdentifiedHazards(result.identifiedHazards);
      toast({
        title: "Hazards Identified",
        description: "AI has suggested potential hazards based on your input.",
      });
    } catch (error) {
      console.error("Error identifying hazards:", error);
      toast({
        title: "Error Identifying Hazards",
        description: "Failed to get hazard suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-orange-500" />
          AI-Assisted Hazard Identification
        </CardTitle>
        <CardDescription>
          Describe an activity or process, and our AI will suggest potential hazards to consider.
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
                      placeholder="e.g., 'Changing a flat tire on the roadside', 'Operating a bench grinder in the workshop', 'Manual handling of 25kg cement bags'"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear and concise description of the task or process.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Identify Potential Hazards
            </Button>
          </CardContent>
        </form>
      </Form>

      {identifiedHazards && (
        <>
          <CardHeader className="border-t pt-6">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Suggested Potential Hazards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[200px] w-full rounded-md border bg-muted/30 p-3">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {identifiedHazards}
              </pre>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Note: These are AI-generated suggestions. Always conduct a thorough, site-specific hazard identification and risk assessment.
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
