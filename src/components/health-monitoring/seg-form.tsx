
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, XCircle, Users } from "lucide-react";
import type { SimilarExposureGroup } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card imports

const segFormSchema = z.object({
  name: z.string().min(2, "SEG name must be at least 2 characters.").max(150),
  description: z.string().max(500, "Description is too long.").optional(),
  riskProfileNotes: z.string().max(2000, "Risk profile notes are too long.").optional(),
});

type SegFormValues = z.infer<typeof segFormSchema>;

interface SegFormProps {
  initialData?: SimilarExposureGroup | null;
  onSave: (data: SegFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean; // Added for button state
}

export function SegForm({ initialData, onSave, onCancel, isSubmitting }: SegFormProps) {
  const form = useForm<SegFormValues>({
    resolver: zodResolver(segFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      riskProfileNotes: initialData?.riskProfileNotes || "",
    },
  });

  const onSubmit = (data: SegFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-6 space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEG Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Welders - Workshop A, Office Admin Staff" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly describe the group and their common tasks or environment." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riskProfileNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Profile Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe typical exposures (e.g., noise, dust, chemicals), potential health risks, or required controls for this SEG." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </ScrollArea>
        <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Add SEG"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
