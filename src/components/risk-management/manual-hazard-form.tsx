
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
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, Activity, AlertTriangle, User, MapPin, Lightbulb } from "lucide-react";
import type { ManualHazard } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react"; // Added useEffect and useState

const manualHazardFormSchema = z.object({
  activityDescription: z.string().min(5, "Activity description is required.").max(500),
  hazardDescription: z.string().min(5, "Hazard description is required.").max(1000),
  location: z.string().max(200).optional(),
  potentialConsequences: z.string().max(1000).optional(),
  dateIdentified: z.string().refine(val => isValid(parseISO(val)), { message: "Date identified is required." }),
  identifiedBy: z.string().min(2, "Identified by is required.").max(100),
});

export type ManualHazardFormValues = z.infer<typeof manualHazardFormSchema>;

interface ManualHazardFormProps {
  initialData?: ManualHazard | null;
  onSave: (data: ManualHazardFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ManualHazardForm({ initialData, onSave, onCancel, isSubmitting }: ManualHazardFormProps) {
  const [isAiPrefilled, setIsAiPrefilled] = useState(false);

  const form = useForm<ManualHazardFormValues>({
    resolver: zodResolver(manualHazardFormSchema),
    defaultValues: {
      activityDescription: initialData?.activityDescription || "",
      hazardDescription: initialData?.hazardDescription || "",
      location: initialData?.location || "",
      potentialConsequences: initialData?.potentialConsequences || "",
      dateIdentified: initialData?.dateIdentified ? format(parseISO(initialData.dateIdentified), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      identifiedBy: initialData?.identifiedBy || "",
    },
  });

  useEffect(() => {
    const storedSuggestions = localStorage.getItem('aiHazardSuggestionsForManualHazard');
    if (storedSuggestions) {
      form.setValue('hazardDescription', storedSuggestions);
      setIsAiPrefilled(true);
      localStorage.removeItem('aiHazardSuggestionsForManualHazard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const onSubmit = (data: ManualHazardFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
            <CardContent className="p-6 space-y-6">
                <FormField control={form.control} name="activityDescription" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Activity className="h-4 w-4"/>Activity / Process / Area</FormLabel><FormControl><Input placeholder="e.g., Using angle grinder in Workshop B" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="hazardDescription" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-1"><AlertTriangle className="h-4 w-4"/>Hazard Description</FormLabel>
                        <FormControl><Textarea placeholder="Describe the specific hazard (e.g., Trailing electrical cable, Unguarded rotating parts)" rows={3} {...field} /></FormControl>
                        {isAiPrefilled && (
                            <FormDescription className="text-xs text-blue-600 flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" /> This field was pre-filled with AI suggestions. Please review and edit as necessary.
                            </FormDescription>
                        )}
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="potentialConsequences" render={({ field }) => (
                    <FormItem><FormLabel>Potential Consequences (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Electric shock, entanglement, trip and fall leading to sprain" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><MapPin className="h-4 w-4"/>Specific Location (Optional)</FormLabel><FormControl><Input placeholder="e.g., Near lathe machine, Main walkway" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="dateIdentified" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel className="flex items-center gap-1"><CalendarIcon className="h-4 w-4"/>Date Identified</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} initialFocus /></PopoverContent>
                        </Popover><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="identifiedBy" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center gap-1"><User className="h-4 w-4"/>Identified By</FormLabel><FormControl><Input placeholder="Name of person who identified it" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </CardContent>
        </ScrollArea>
        <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Log Hazard"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
