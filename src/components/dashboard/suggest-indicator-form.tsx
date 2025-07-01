
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const KPI_SUGGESTIONS_COLLECTION = "kpiSuggestions";

const suggestIndicatorFormSchema = z.object({
  suggestionText: z.string().min(10, {
    message: "Suggestion must be at least 10 characters.",
  }).max(500, {
    message: "Suggestion must not be longer than 500 characters.",
  }),
});

type SuggestIndicatorFormValues = z.infer<typeof suggestIndicatorFormSchema>;

export function SuggestIndicatorForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SuggestIndicatorFormValues>({
    resolver: zodResolver(suggestIndicatorFormSchema),
    defaultValues: {
      suggestionText: "",
    },
  });

  async function onSubmit(data: SuggestIndicatorFormValues) {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to submit a suggestion.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, KPI_SUGGESTIONS_COLLECTION), {
        userId: user.uid,
        suggestionText: data.suggestionText,
        timestamp: serverTimestamp(),
        status: "New", // Initial status
      });
      toast({
        title: "Suggestion Submitted!",
        description: "Thank you for your feedback. We'll review your suggestion.",
      });
      form.reset();
    } catch (error) {
      console.error("Error submitting KPI suggestion:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Suggest Additional Indicators
        </CardTitle>
        <CardDescription>
          Want to track other specific SHEQ indicators on your dashboard? Let us know!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="suggestionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Your Suggestion</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Training Completion Rate (%), Waste Recycled (kg), Near Miss Reporting Frequency..."
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit Suggestion
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Your suggestions help us improve SHEild. Approved indicators may be added in future updates.
        </p>
      </CardFooter>
    </Card>
  );
}
