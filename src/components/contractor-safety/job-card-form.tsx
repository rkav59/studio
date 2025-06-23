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
import { CalendarIcon, Save, XCircle, Trash2, PlusCircle, CheckSquare, Square } from "lucide-react";
import type { JobCard, Contractor, JobCardStatus, JobCardCheck } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const jobCardCheckSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Check text cannot be empty."),
  isChecked: z.boolean().default(false),
});

const jobCardFormSchema = z.object({
  jobCardNumber: z.string().min(1, "Job Card Number is required.").max(50),
  contractorId: z.string({ required_error: "Please select a contractor." }),
  workDate: z.date({ required_error: "Work date is required."}),
  jobDescription: z.string().min(10, "Job description is required.").max(1000),
  location: z.string().min(3, "Location is required.").max(200),
  status: z.enum(['Draft', 'Issued', 'Completed', 'Cancelled']),
  requiredPpe: z.string().min(3, "Required PPE is required.").max(500),
  safetyChecks: z.array(jobCardCheckSchema).optional().default([]),
  supervisorSignOffName: z.string().max(100).optional(),
  clientSignOffName: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export type JobCardFormValues = Omit<JobCard, 'id' | 'userId' | 'workDate'> & {
  workDate: Date;
};


interface JobCardFormProps {
  contractors: Contractor[];
  initialData?: JobCard | null;
  onSave: (data: Omit<JobCard, 'id'| 'userId'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const defaultSafetyChecks: Omit<JobCardCheck, 'id' | 'isChecked'>[] = [
  { text: "Work area inspected and free of hazards." },
  { text: "Correct tools and equipment are available and in good condition." },
  { text: "All personnel have received a briefing on the job." },
  { text: "Emergency procedures and contacts are known." },
  { text: "Required permits (if any) are in place." },
];

export function JobCardForm({ contractors, initialData, onSave, onCancel, isSubmitting }: JobCardFormProps) {
  const isEditing = !!initialData?.id;

  const form = useForm<JobCardFormValues>({
    resolver: zodResolver(jobCardFormSchema),
    defaultValues: {
      jobCardNumber: initialData?.jobCardNumber || `JC-${Date.now().toString().slice(-6)}`,
      contractorId: initialData?.contractorId || (contractors.length > 0 ? contractors[0].id : ""),
      workDate: initialData?.workDate ? parseISO(initialData.workDate) : new Date(),
      jobDescription: initialData?.jobDescription || "",
      location: initialData?.location || "",
      status: initialData?.status || "Draft",
      requiredPpe: initialData?.requiredPpe || "",
      safetyChecks: initialData?.safetyChecks && initialData.safetyChecks.length > 0 ? initialData.safetyChecks : defaultSafetyChecks.map(c => ({...c, id: crypto.randomUUID(), isChecked: false})),
      supervisorSignOffName: initialData?.supervisorSignOffName || "",
      clientSignOffName: initialData?.clientSignOffName || "",
      notes: initialData?.notes || "",
    },
  });
  
  const { fields: safetyCheckFields, append, remove } = useFieldArray({
    control: form.control,
    name: "safetyChecks"
  });


  const onSubmit = (data: JobCardFormValues) => {
    const dataToSave = {
        ...data,
        workDate: data.workDate.toISOString(),
    };
    onSave(dataToSave);
  };

  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 p-4 md:p-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="jobCardNumber" render={({ field }) => (
                  <FormItem><FormLabel>Job Card Number</FormLabel><FormControl><Input placeholder="Auto-generated or enter ID" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>{(['Draft', 'Issued', 'Completed', 'Cancelled'] as JobCardStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )}/>
            </div>
            
            <FormField control={form.control} name="contractorId" render={({ field }) => (
                <FormItem><FormLabel>Contractor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={contractors.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder={contractors.length === 0 ? "No contractors available" : "Select contractor"} /></SelectTrigger></FormControl>
                    <SelectContent>{contractors.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )}/>

             <FormField control={form.control} name="workDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Work Date</FormLabel>
                <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover><FormMessage /></FormItem>
            )}/>
            
            <FormField control={form.control} name="jobDescription" render={({ field }) => (
              <FormItem><FormLabel>Job Description</FormLabel><FormControl><Textarea placeholder="Describe the work to be carried out..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem><FormLabel>Work Location</FormLabel><FormControl><Input placeholder="e.g., Roof of Building B, Canteen Area" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            <Separator/>
            
            <FormField control={form.control} name="requiredPpe" render={({ field }) => (
              <FormItem><FormLabel>Required PPE</FormLabel><FormControl><Textarea placeholder="List all required Personal Protective Equipment..." rows={2} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            <div className="space-y-2">
                <FormLabel>Pre-Work Safety Checks</FormLabel>
                {safetyCheckFields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`safetyChecks.${index}.isChecked`}
                    render={({ field: checkField }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-muted/30">
                        <FormControl>
                          <Checkbox
                            checked={checkField.value}
                            onCheckedChange={checkField.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer w-full">
                          {form.getValues(`safetyChecks.${index}.text`)}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
            </div>

            <Separator/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField control={form.control} name="supervisorSignOffName" render={({ field }) => (
                  <FormItem><FormLabel>Contractor Supervisor Sign-off (Optional)</FormLabel><FormControl><Input placeholder="Supervisor's name for acknowledgement" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="clientSignOffName" render={({ field }) => (
                  <FormItem><FormLabel>Client Sign-off (Optional)</FormLabel><FormControl><Input placeholder="Your name for acknowledgement" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>

             <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional comments or notes for this job card..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            </CardContent>
          </ScrollArea>
          <div className="p-4 md:p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4" /> Cancel</Button>
            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white" disabled={isSubmitting}><Save className="mr-2 h-4 w-4" /> {isEditing ? "Save Changes" : "Create Job Card"}</Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
