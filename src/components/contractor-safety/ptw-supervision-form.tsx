
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, Search, User, ListChecks, CheckSquare, AlertTriangle as AlertTriangleIcon, CircleOff, Clock, Activity, FileText } from "lucide-react";
import type { PtwSupervisionRecord, SupervisionChecklistItemInstance, PtwPerformanceRating, SupervisionChecklistItemResult } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from "@/components/ui/separator";

const ptwPerformanceRatings: PtwPerformanceRating[] = ['Excellent', 'Good', 'Fair', 'Poor'];
const checklistItemResults: SupervisionChecklistItemResult[] = ['Satisfactory', 'Needs Improvement', 'Unsatisfactory', 'N/A'];

export const defaultSupervisionChecklistTemplate: Array<Omit<SupervisionChecklistItemInstance, 'id' | 'result' | 'observations'>> = [
  { questionText: "Is the PTW displayed at the work location?" },
  { questionText: "Are all personnel involved in the PTW briefing?" },
  { questionText: "Are specified safety precautions and isolations in place and effective?" },
  { questionText: "Is the correct PPE being used by all personnel as per PTW?" },
  { questionText: "Is the work area being maintained in a clean and orderly condition (good housekeeping)?" },
  { questionText: "Are the tools and equipment in use suitable and in good condition?" },
  { questionText: "Are environmental controls (e.g., spill kits, waste disposal) adequate?" },
  { questionText: "Is there an awareness of the emergency procedures among the work party?" },
  { questionText: "Is the work progressing as per the described scope and method statement?" },
];


const supervisionChecklistItemSchema = z.object({
  id: z.string(),
  questionText: z.string().min(1, "Question text cannot be empty."),
  result: z.enum(checklistItemResults, { required_error: "Result is required." }),
  observations: z.string().max(1000, "Observations are too long.").optional(),
});

const ptwSupervisionFormSchema = z.object({
  supervisionDate: z.string().refine(val => isValid(parseISO(val)), { message: "Supervision date is required." }),
  supervisorName: z.string().min(2, "Supervisor name is required.").max(100),
  checklistItems: z.array(supervisionChecklistItemSchema).min(1, "At least one checklist item is required."),
  overallPerformanceRating: z.enum(ptwPerformanceRatings, { required_error: "Overall rating is required." }),
  summaryNotes: z.string().max(2000).optional(),
  actionItemsRequired: z.string().max(2000).optional(),
});

export type PtwSupervisionFormValues = z.infer<typeof ptwSupervisionFormSchema>;

interface PtwSupervisionFormProps {
  ptwNumber: string;
  initialData?: PtwSupervisionRecord | null;
  onSave: (data: PtwSupervisionFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PtwSupervisionForm({ ptwNumber, initialData, onSave, onCancel, isSubmitting }: PtwSupervisionFormProps) {
  const isEditing = !!initialData?.id;

  const form = useForm<PtwSupervisionFormValues>({
    resolver: zodResolver(ptwSupervisionFormSchema),
    defaultValues: {
      supervisionDate: initialData?.supervisionDate ? format(parseISO(initialData.supervisionDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      supervisorName: initialData?.supervisorName || "",
      checklistItems: initialData?.checklistItems && initialData.checklistItems.length > 0 
        ? initialData.checklistItems 
        : defaultSupervisionChecklistTemplate.map(item => ({...item, id: crypto.randomUUID(), result: 'Satisfactory', observations: '' })),
      overallPerformanceRating: initialData?.overallPerformanceRating || undefined,
      summaryNotes: initialData?.summaryNotes || "",
      actionItemsRequired: initialData?.actionItemsRequired || "",
    },
  });

  const { fields: checklistFields } = useFieldArray({
    control: form.control,
    name: "checklistItems"
  });

  const onSubmit = (data: PtwSupervisionFormValues) => {
    onSave(data);
  };
  
   const getChecklistItemStatusIcon = (status: SupervisionChecklistItemResult) => {
    switch (status) {
      case 'Satisfactory': return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'Needs Improvement': return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'Unsatisfactory': return <AlertTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'N/A': return <CircleOff className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };


  return (
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="supervisorName" render={({ field }) => (
              <FormItem><FormLabel className="flex items-center gap-1"><User className="h-4 w-4"/>Supervisor Name</FormLabel><FormControl><Input placeholder="Supervisor's full name" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="supervisionDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Supervision Date</FormLabel>
              <Popover><PopoverTrigger asChild><FormControl>
                <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button></FormControl></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
              </Popover><FormMessage /></FormItem>
            )}/>
          </div>

          <Separator/>
          
          <div className="space-y-4">
            <FormLabel className="font-semibold text-md flex items-center gap-2"><ListChecks className="h-5 w-5"/>Supervision Checklist</FormLabel>
            <ScrollArea className="max-h-[40vh] p-3 border rounded-md bg-muted/30">
              <div className="space-y-4">
                {checklistFields.map((item, index) => (
                  <Card key={item.id} className="p-3 bg-background shadow-sm space-y-2">
                    <FormLabel className="text-sm font-normal block">{index + 1}. {item.questionText}</FormLabel>
                    <FormField control={form.control} name={`checklistItems.${index}.result`} render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="text-xs h-9">
                            <div className="flex items-center gap-2">
                                {getChecklistItemStatusIcon(field.value as SupervisionChecklistItemResult)}
                                <SelectValue placeholder="Select result"/>
                            </div>
                          </SelectTrigger></FormControl>
                          <SelectContent>
                            {checklistItemResults.map(res => (
                              <SelectItem key={res} value={res} className="text-xs">
                                <div className="flex items-center gap-2">
                                    {getChecklistItemStatusIcon(res)} {res}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name={`checklistItems.${index}.observations`} render={({ field }) => (
                      <FormItem><FormLabel className="sr-only">Observations</FormLabel><FormControl><Textarea placeholder="Observations (if any)..." rows={1} {...field} className="text-xs"/></FormControl><FormMessage /></FormItem>
                    )}/>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <Separator/>

          <FormField control={form.control} name="overallPerformanceRating" render={({ field }) => (
            <FormItem><FormLabel className="flex items-center gap-1"><Activity className="h-4 w-4"/>Overall Performance Rating</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select overall rating" /></SelectTrigger></FormControl>
                <SelectContent>{ptwPerformanceRatings.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="summaryNotes" render={({ field }) => (
            <FormItem><FormLabel className="flex items-center gap-1"><FileText className="h-4 w-4"/>Summary Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Overall summary, positive observations, general comments..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="actionItemsRequired" render={({ field }) => (
            <FormItem><FormLabel className="flex items-center gap-1"><AlertTriangleIcon className="h-4 w-4 text-yellow-500"/>Action Items Required (Optional)</FormLabel><FormControl><Textarea placeholder="List specific immediate actions required from the work party or others..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
          )}/>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4" /> Cancel</Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white" disabled={isSubmitting}><Save className="mr-2 h-4 w-4" /> {isEditing ? "Save Changes" : "Log Record"}</Button>
          </div>
        </form>
      </Form>
    </CardContent>
  );
}

