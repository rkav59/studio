
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
  FormDescription,
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
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, Award, Users } from "lucide-react";
import type { WellnessProgram, WellnessProgramStatus } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';

const wellnessProgramStatuses: WellnessProgramStatus[] = ['Planned', 'Active', 'Completed', 'On Hold'];

const wellnessProgramFormSchema = z.object({
  programName: z.string().min(3, "Program name is required.").max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().refine(val => isValid(parseISO(val)), { message: "Start date is required." }),
  endDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid end date." }),
  status: z.enum(wellnessProgramStatuses, { required_error: "Program status is required." }),
  targetAudience: z.string().max(200).optional(),
  targetParticipants: z.coerce.number().min(0).int().optional(),
  actualParticipants: z.coerce.number().min(0).int().optional(),
  participationNotes: z.string().max(2000).optional(),
}).refine(data => data.actualParticipants === undefined || data.targetParticipants === undefined || data.actualParticipants <= data.targetParticipants, {
    message: "Actual participants cannot exceed target participants.",
    path: ["actualParticipants"],
});

type WellnessProgramFormValues = z.infer<typeof wellnessProgramFormSchema>;

interface WellnessProgramFormProps {
  initialData?: WellnessProgram | null;
  onSave: (data: WellnessProgramFormValues) => void;
  onCancel: () => void;
}

export function WellnessProgramForm({ initialData, onSave, onCancel }: WellnessProgramFormProps) {
  const form = useForm<WellnessProgramFormValues>({
    resolver: zodResolver(wellnessProgramFormSchema),
    defaultValues: {
      programName: initialData?.programName || "",
      description: initialData?.description || "",
      startDate: initialData?.startDate ? format(parseISO(initialData.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      endDate: initialData?.endDate ? format(parseISO(initialData.endDate), 'yyyy-MM-dd') : undefined,
      status: initialData?.status || 'Planned',
      targetAudience: initialData?.targetAudience || "",
      targetParticipants: initialData?.targetParticipants || undefined,
      actualParticipants: initialData?.actualParticipants || undefined,
      participationNotes: initialData?.participationNotes || "",
    },
  });

  const onSubmit = (data: WellnessProgramFormValues) => {
    onSave(data);
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-500" />
            {initialData ? "Edit Wellness Program" : "Add New Wellness Program"}
        </DialogTitle>
        <DialogDescription>
          {initialData ? "Update the wellness program details." : "Define a new employee wellness program."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <ScrollArea className="max-h-[65vh] pr-4 space-y-4">
            <FormField control={form.control} name="programName" render={({ field }) => (
                <FormItem><FormLabel>Program Name</FormLabel><FormControl><Input placeholder="e.g., Healthy Eating Challenge, Mental Wellness Workshops" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Describe the program's goals, activities, and benefits." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick start date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} initialFocus /></PopoverContent>
                    </Popover><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>End Date (Optional)</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick end date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} /></PopoverContent>
                    </Popover><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Program Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>{wellnessProgramStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="targetAudience" render={({ field }) => (
                <FormItem><FormLabel>Target Audience (Optional)</FormLabel><FormControl><Input placeholder="e.g., All Employees, Night Shift Staff, Specific Department" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="targetParticipants" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Users className="h-4 w-4"/>Target Participants (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="actualParticipants" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Users className="h-4 w-4"/>Actual Participants (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 75" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <FormField control={form.control} name="participationNotes" render={({ field }) => (
                <FormItem><FormLabel>Participation Notes (Optional)</FormLabel><FormControl><Textarea placeholder="General notes about participation numbers, engagement, feedback, etc." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </ScrollArea>
          <DialogFooter className="pt-6 border-t mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onCancel}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white">
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Add Program"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
