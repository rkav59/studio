"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Inspection, InspectionChecklistItem } from "@/lib/types";

const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
});

const inspectionFormSchema = z.object({
  name: z.string().min(3, { message: "Inspection name must be at least 3 characters." }),
  location: z.string().min(3, { message: "Location is required." }),
  conductedDate: z.date({ required_error: "Date of inspection is required." }),
  findings: z.string().optional(),
  checklist: z.array(checklistItemSchema),
});

type InspectionFormValues = z.infer<typeof inspectionFormSchema>;

interface InspectionFormProps {
  inspection?: Partial<Inspection>; // For pre-filling if editing or starting a scheduled one
  onInspectionCompleted: (inspection: Inspection) => void;
}

const DEFAULT_CHECKLIST_ITEMS: Omit<InspectionChecklistItem, 'id' | 'completed'>[] = [
  { text: "Are emergency exits clear and accessible?" },
  { text: "Are fire extinguishers in place and charged?" },
  { text: "Is personal protective equipment (PPE) being used correctly?" },
  { text: "Are walkways free of obstructions?" },
  { text: "Are hazardous materials stored correctly?" },
];

export function InspectionForm({ inspection, onInspectionCompleted }: InspectionFormProps) {
  const { toast } = useToast();
  
  const initialChecklist = inspection?.checklist || DEFAULT_CHECKLIST_ITEMS.map((item, index) => ({
    id: `item-${index}-${Date.now()}`,
    text: item.text,
    completed: false,
  }));

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      name: inspection?.name || "",
      location: inspection?.location || "",
      conductedDate: inspection?.scheduledDate ? new Date(inspection.scheduledDate) : new Date(),
      findings: inspection?.findings || "",
      checklist: initialChecklist,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "checklist",
  });

  async function onSubmit(data: InspectionFormValues) {
    const completedInspection: Inspection = {
      id: inspection?.id || new Date().toISOString(),
      name: data.name,
      location: data.location,
      scheduledDate: data.conductedDate.toISOString(), // or a separate 'conductedDate' field
      status: "Completed",
      checklist: data.checklist,
      findings: data.findings,
    };
    onInspectionCompleted(completedInspection);

    toast({
      title: "Inspection Completed",
      description: `Inspection "${data.name}" has been successfully recorded.`,
    });
    // form.reset(); // Might not want to reset if it's part of a larger workflow
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection Name/Type</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Monthly Workshop Safety Check" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Assembly Line 2, Office Block B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="conductedDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Inspection</FormLabel>
              <FormControl>
                 {/* Simplified date input for this form component */}
                <Input 
                    type="date" 
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((item, index) => (
              <FormField
                key={item.id}
                control={form.control}
                name={`checklist.${index}.completed`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none flex-grow">
                      <FormLabel className="font-normal">
                        {form.watch(`checklist.${index}.text`)}
                      </FormLabel>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </FormItem>
                )}
              />
            ))}
             <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: `new-${Date.now()}`, text: "New checklist item", completed: false })}
            >
              Add Checklist Item
            </Button>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="findings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall Findings & Remarks</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Summarize findings, note any non-compliance, or add recommendations..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Mark as Completed
        </Button>
      </form>
    </Form>
  );
}
