
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UiCardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, Workflow } from "lucide-react";
import type { PermitToWork, Contractor, PtwStatus } from "@/lib/types";
import { format, parseISO, isValid, set } from 'date-fns';
import { Separator } from "@/components/ui/separator";

const ptwFormSchema = z.object({
  ptwNumber: z.string().min(1, "PTW Number is required.").max(50),
  contractorId: z.string({ required_error: "Please select a contractor." }),
  workDescription: z.string().min(10, "Work description is required.").max(1000),
  location: z.string().min(3, "Location is required.").max(200),
  startDate: z.date({ required_error: "Start date & time are required."}),
  endDate: z.date({ required_error: "End date & time are required."}),
  status: z.enum(['Requested', 'Approved', 'Active', 'Closed', 'Cancelled', 'Expired']),
  scopeOfWork: z.string().min(10, "Scope of work is required.").max(2000),
  precautions: z.string().min(5, "Precautions are required.").max(2000),
  authorizedBy: z.string().max(100).optional(),
  authorizationDate: z.date().optional().nullable(),
  closedBy: z.string().max(100).optional(),
  closureDate: z.date().optional().nullable(),
  supervisorOnSite: z.string().max(100).optional(),
}).refine(data => data.endDate > data.startDate, {
    message: "End date must be after start date.",
    path: ["endDate"],
});

type PtwFormValues = z.infer<typeof ptwFormSchema>;

interface PermitToWorkFormProps {
  contractors: Contractor[];
  initialData?: PermitToWork | null;
  onSave: (data: Omit<PermitToWork, 'id' | 'userId'>) => void; // Matching what edit/new pages will pass
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PermitToWorkForm({ contractors, initialData, onSave, onCancel, isSubmitting }: PermitToWorkFormProps) {
  const form = useForm<PtwFormValues>({
    resolver: zodResolver(ptwFormSchema),
    defaultValues: {
      ptwNumber: initialData?.ptwNumber || `PTW-${Date.now().toString().slice(-6)}`,
      contractorId: initialData?.contractorId || (contractors.length > 0 ? contractors[0].id : ""),
      workDescription: initialData?.workDescription || "",
      location: initialData?.location || "",
      startDate: initialData?.startDate ? parseISO(initialData.startDate) : set(new Date(), { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 }),
      endDate: initialData?.endDate ? parseISO(initialData.endDate) : set(new Date(), { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 }),
      status: initialData?.status || "Requested",
      scopeOfWork: initialData?.scopeOfWork || "",
      precautions: initialData?.precautions || "",
      authorizedBy: initialData?.authorizedBy || "",
      authorizationDate: initialData?.authorizationDate ? parseISO(initialData.authorizationDate) : null,
      closedBy: initialData?.closedBy || "",
      closureDate: initialData?.closureDate ? parseISO(initialData.closureDate) : null,
      supervisorOnSite: initialData?.supervisorOnSite || "",
    },
  });

  const onSubmit = (data: PtwFormValues) => {
    const ptwToSave = {
      ...data,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      authorizationDate: data.authorizationDate ? data.authorizationDate.toISOString() : undefined,
      closureDate: data.closureDate ? data.closureDate.toISOString() : undefined,
    };
    onSave(ptwToSave);
  };
  
  const DateTimePicker = ({ field, label }: { field: any, label: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
            {field.value ? format(field.value, "PPP HH:mm") : <span>{label}</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
        <div className="p-3 border-t border-border">
          <FormLabel className="text-sm">Time</FormLabel>
          <Input
            type="time"
            className="mt-1"
            defaultValue={field.value ? format(field.value, "HH:mm") : ""}
            onChange={(e) => {
              const time = e.target.value;
              const [hours, minutes] = time.split(':').map(Number);
              const newDate = field.value ? new Date(field.value) : new Date();
              newDate.setHours(hours, minutes, 0, 0);
              field.onChange(newDate);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <UiCardDescription>
          {initialData ? "Update the details of this PTW below." : "Fill in the details for the new PTW."}
        </UiCardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 p-4 md:p-6">
            {/* PTW Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="ptwNumber" render={({ field }) => (
                    <FormItem><FormLabel>PTW Number</FormLabel><FormControl><Input placeholder="Auto-generated or enter ID" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="contractorId" render={({ field }) => (
                    <FormItem><FormLabel>Contractor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={contractors.length === 0}>
                        <FormControl><SelectTrigger><SelectValue placeholder={contractors.length === 0 ? "No contractors available" : "Select contractor"} /></SelectTrigger></FormControl>
                        <SelectContent>{contractors.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
              </div>
               <FormField control={form.control} name="workDescription" render={({ field }) => (
                <FormItem><FormLabel>Brief Work Description</FormLabel><FormControl><Input placeholder="e.g., Hot work - welding on pipe rack" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Specific Location of Work</FormLabel><FormControl><Input placeholder="e.g., Unit 5, Area B, Level 2" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>

            <Separator className="my-6" />
            {/* Validity & Status */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Validity & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Start Date & Time</FormLabel><DateTimePicker field={field} label="Select start date/time" /><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>End Date & Time</FormLabel><DateTimePicker field={field} label="Select end date/time" /><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>PTW Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>{(['Requested', 'Approved', 'Active', 'Closed', 'Cancelled', 'Expired'] as PtwStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
            </div>

            <Separator className="my-6" />
            {/* Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Scope & Precautions</h3>
                 <FormField control={form.control} name="scopeOfWork" render={({ field }) => (
                    <FormItem><FormLabel>Detailed Scope of Work</FormLabel><FormControl><Textarea placeholder="Describe the full scope of the work to be performed..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="precautions" render={({ field }) => (
                    <FormItem><FormLabel>Safety Precautions Required</FormLabel><FormControl><Textarea placeholder="List all necessary safety precautions, isolations, PPE, etc." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="supervisorOnSite" render={({ field }) => (
                    <FormItem><FormLabel>Contractor Supervisor On-Site (Optional)</FormLabel><FormControl><Input placeholder="Name of supervisor" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            
            <Separator className="my-6" />
            {/* Authorization & Closure (Optional at creation) */}
            <div className="space-y-4">
                 <h3 className="text-lg font-medium">Authorization & Closure (Optional)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="authorizedBy" render={({ field }) => (
                        <FormItem><FormLabel>Authorized By</FormLabel><FormControl><Input placeholder="Name of authorizer" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="authorizationDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Authorization Date & Time</FormLabel><DateTimePicker field={field} label="Select authorization date/time" /><FormMessage /></FormItem>
                    )}/>
                 </div>
                 {(form.watch("status") === 'Closed' || form.watch("status") === 'Cancelled') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <FormField control={form.control} name="closedBy" render={({ field }) => (
                            <FormItem><FormLabel>Closed/Cancelled By</FormLabel><FormControl><Input placeholder="Name of person closing" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="closureDate" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Closure/Cancellation Date & Time</FormLabel><DateTimePicker field={field} label="Select closure date/time" /><FormMessage /></FormItem>
                        )}/>
                    </div>
                 )}
            </div>
            </CardContent>
          </ScrollArea>
          <div className="p-4 md:p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Create PTW"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

    