
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
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, Box } from "lucide-react";
import type { EmergencyResource, EmergencyResourceType, EmergencyResourceStatus } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from "../ui/scroll-area";

const resourceTypes: EmergencyResourceType[] = ['First Aid Kit', 'Fire Extinguisher', 'Spill Kit', 'AED', 'Evacuation Chair', 'Emergency Lighting', 'Alarm System', 'Communication Device', 'Other'];
const resourceStatuses: EmergencyResourceStatus[] = ['Operational', 'Requires Maintenance', 'Requires Refill', 'Out of Service', 'Expired'];

const resourceFormSchema = z.object({
  name: z.string().min(2, "Resource name is required.").max(150),
  type: z.enum(resourceTypes, { required_error: "Please select resource type."}),
  location: z.string().min(2, "Location is required.").max(200),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1.").int(),
  status: z.enum(resourceStatuses, { required_error: "Please select resource status."}),
  lastCheckedDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid last checked date" }),
  nextCheckDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid next check date" }),
  notes: z.string().max(1000).optional(),
});

type EmergencyResourceFormValues = z.infer<typeof resourceFormSchema>;

interface EmergencyResourceFormProps {
  initialData?: EmergencyResource | null;
  onSave: (data: Omit<EmergencyResource, 'id'>) => void;
  onCancel: () => void;
}

export function EmergencyResourceForm({ initialData, onSave, onCancel }: EmergencyResourceFormProps) {
  const form = useForm<EmergencyResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || undefined,
      location: initialData?.location || "",
      quantity: initialData?.quantity || 1,
      status: initialData?.status || 'Operational',
      lastCheckedDate: initialData?.lastCheckedDate ? format(parseISO(initialData.lastCheckedDate), 'yyyy-MM-dd') : undefined,
      nextCheckDate: initialData?.nextCheckDate ? format(parseISO(initialData.nextCheckDate), 'yyyy-MM-dd') : undefined,
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = (data: EmergencyResourceFormValues) => {
    const resourceToSave = {
      ...data,
      lastCheckedDate: data.lastCheckedDate ? parseISO(data.lastCheckedDate).toISOString() : undefined,
      nextCheckDate: data.nextCheckDate ? parseISO(data.nextCheckDate).toISOString() : undefined,
    };
    onSave(resourceToSave);
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
            <Box className="h-6 w-6 text-accent" />
            {initialData ? "Edit Emergency Resource" : "Add New Emergency Resource"}
        </DialogTitle>
        <DialogDescription>
          {initialData ? "Update the details of this emergency resource." : "Enter details for a new emergency resource."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
            <ScrollArea className="max-h-[70vh] pr-6 space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Resource Name</FormLabel><FormControl><Input placeholder="e.g., Main Office First Aid Kit" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select resource type" /></SelectTrigger></FormControl>
                        <SelectContent>{resourceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Wall Mount, Corridor B, Level 1" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>{resourceStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="lastCheckedDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Last Checked Date (Optional)</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                    </Popover><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="nextCheckDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Next Check Date (Optional)</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                    </Popover><FormMessage /></FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Serial number, specific maintenance notes" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </ScrollArea>
            <DialogFooter className="pt-6 border-t">
                <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}><XCircle className="mr-2 h-4 w-4" /> Cancel</Button></DialogClose>
                <Button type="submit" className="bg-accent hover:bg-accent/90"><Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Add Resource"}</Button>
            </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
