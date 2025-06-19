
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
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, Activity, Users } from "lucide-react";
import type { SheProgram, SheProgramType, SheProgramStatus } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { CardContent } from "@/components/ui/card";

const programTypes: SheProgramType[] = ['Safety Campaign', 'Health Initiative', 'Environmental Drive', 'Training Program', 'Awareness Program', 'Other'];
const programStatuses: SheProgramStatus[] = ['Planned', 'Ongoing', 'Completed', 'On Hold', 'Cancelled'];

const sheProgramFormSchema = z.object({
  programName: z.string().min(3, "Program name is required.").max(200),
  objective: z.string().min(10, "Objective is required.").max(1000),
  programType: z.enum(programTypes, { required_error: "Program type is required." }),
  targetAudience: z.string().max(200).optional(),
  startDate: z.string().refine(val => isValid(parseISO(val)), { message: "Start date is required." }),
  endDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid end date." }),
  status: z.enum(programStatuses, { required_error: "Program status is required." }),
  keyActivities: z.string().max(3000).optional(),
  kpis: z.string().max(1000).optional(),
  budget: z.string().max(100).optional(),
  leadPerson: z.string().max(100).optional(),
}).refine(data => !data.endDate || (data.endDate && data.startDate <= data.endDate), {
    message: "End date must be after start date.",
    path: ["endDate"],
});

type SheProgramFormValues = z.infer<typeof sheProgramFormSchema>;

interface SheProgramFormProps {
  initialData?: SheProgram | null;
  onSave: (data: Omit<SheProgram, 'id' | 'userId'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SheProgramForm({ initialData, onSave, onCancel, isSubmitting }: SheProgramFormProps) {
  const form = useForm<SheProgramFormValues>({
    resolver: zodResolver(sheProgramFormSchema),
    defaultValues: {
      programName: initialData?.programName || "",
      objective: initialData?.objective || "",
      programType: initialData?.programType || undefined,
      targetAudience: initialData?.targetAudience || "",
      startDate: initialData?.startDate ? format(parseISO(initialData.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      endDate: initialData?.endDate ? format(parseISO(initialData.endDate), 'yyyy-MM-dd') : undefined,
      status: initialData?.status || 'Planned',
      keyActivities: initialData?.keyActivities || "",
      kpis: initialData?.kpis || "",
      budget: initialData?.budget || "",
      leadPerson: initialData?.leadPerson || "",
    },
  });

  const onSubmit = (data: SheProgramFormValues) => {
    const programToSave: Omit<SheProgram, 'id' | 'userId'> = {
        ...data,
        startDate: parseISO(data.startDate).toISOString(),
        endDate: data.endDate ? parseISO(data.endDate).toISOString() : undefined,
    };
    onSave(programToSave);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
            <CardContent className="p-6 space-y-4">
                <FormField control={form.control} name="programName" render={({ field }) => (
                    <FormItem><FormLabel>Program Name</FormLabel><FormControl><Input placeholder="e.g., Q4 Manual Handling Awareness Drive" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="objective" render={({ field }) => (
                    <FormItem><FormLabel>Program Objective</FormLabel><FormControl><Textarea placeholder="Clearly state the main goal of this program." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="programType" render={({ field }) => (
                        <FormItem><FormLabel>Program Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select program type" /></SelectTrigger></FormControl>
                        <SelectContent>{programTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select program status" /></SelectTrigger></FormControl>
                        <SelectContent>{programStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} initialFocus/></PopoverContent>
                        </Popover><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>End Date (Optional)</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                        </Popover><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="targetAudience" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Users className="h-4 w-4"/>Target Audience (Optional)</FormLabel><FormControl><Input placeholder="e.g., All employees, Workshop staff, Contractors" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="keyActivities" render={({ field }) => (
                    <FormItem><FormLabel>Key Activities / Initiatives (Optional)</FormLabel><FormControl><Textarea placeholder="List main activities, training sessions, campaigns involved." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="kpis" render={({ field }) => (
                    <FormItem><FormLabel>Key Performance Indicators (KPIs) (Optional)</FormLabel><FormControl><Textarea placeholder="How will success be measured? e.g., Reduction in X, Increase in Y reports." rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="leadPerson" render={({ field }) => (
                        <FormItem><FormLabel>Lead Person/Coordinator (Optional)</FormLabel><FormControl><Input placeholder="Name or Role" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="budget" render={({ field }) => (
                        <FormItem><FormLabel>Budget Allocation (Optional)</FormLabel><FormControl><Input placeholder="e.g., $5000, Departmental Budget" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </CardContent>
        </ScrollArea>
        <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Create Program"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
