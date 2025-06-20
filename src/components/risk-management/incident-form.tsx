
"use client";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardDescription as UiCardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, AlertTriangle, MapPin, User, Type, Rows, ShieldAlert, Briefcase, LinkIcon, Activity, BarChart3 } from "lucide-react";
import type { Incident, Severity } from "@/lib/types";
import { format, parseISO, isValid, set } from 'date-fns';
import { Separator } from "../ui/separator";
import { severityLevels } from "@/lib/risk-assessment-config"; // For severity dropdown

const incidentClassifications: Array<Required<Incident>['classification']> = ['First Aid', 'Recordable', 'Lost Time', 'Fatality MVA', 'Non-Fatality MVA', 'Property Damage MVA', 'Environmental', 'Security', 'Other'];
const incidentTypes: Array<Incident['type']> = ['Incident', 'Near Miss', 'Hazard'];
const incidentStatuses: Array<Required<Incident>['status']> = ['Open', 'Under Investigation', 'Actions Pending', 'Closed'];


const incidentFormSchema = z.object({
  type: z.enum(incidentTypes, { required_error: "Incident type is required." }),
  description: z.string().min(10, "Description must be at least 10 characters.").max(2000),
  location: z.string().min(2, "Location is required.").max(200),
  timestamp: z.date({ required_error: "Date and time of incident are required." }),
  region: z.string().min(2, "Region is required.").max(100),
  reportedBy: z.string().min(2, "Reported by is required.").max(100),
  
  classification: z.enum(incidentClassifications).optional(),
  isRecordable: z.boolean().optional().default(false),
  lostWorkDays: z.coerce.number().min(0).optional(),
  isFatality: z.boolean().optional().default(false),
  
  severityLevel: z.enum(Object.keys(severityLevels) as [Severity, ...Severity[]]).optional(),
  rootCauseAnalyzed: z.boolean().optional().default(false),
  status: z.enum(incidentStatuses).optional().default('Open'),
});

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;

interface IncidentFormProps {
  initialData?: Incident | null;
  onSave: (data: IncidentFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function IncidentForm({ initialData, onSave, onCancel, isSubmitting }: IncidentFormProps) {
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      type: initialData?.type || undefined,
      description: initialData?.description || "",
      location: initialData?.location || "",
      timestamp: initialData?.timestamp ? parseISO(initialData.timestamp) : set(new Date(), { seconds: 0, milliseconds: 0 }),
      region: initialData?.region || "",
      reportedBy: initialData?.reportedBy || "",
      classification: initialData?.classification || undefined,
      isRecordable: initialData?.isRecordable || false,
      lostWorkDays: initialData?.lostWorkDays || 0,
      isFatality: initialData?.isFatality || false,
      severityLevel: initialData?.severityLevel || undefined,
      rootCauseAnalyzed: initialData?.rootCauseAnalyzed || false,
      status: initialData?.status || 'Open',
    },
  });

  const onSubmit = (data: IncidentFormValues) => {
    onSave(data);
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
          {initialData ? "Update the details of this incident/event." : "Fill in the details for the new incident, near miss, or hazard observation."}
        </UiCardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 p-4 md:p-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Type className="h-4 w-4"/>Type of Event</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger></FormControl>
                        <SelectContent>{incidentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="timestamp" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date & Time of Occurrence</FormLabel><DateTimePicker field={field} label="Select date & time" /><FormMessage /></FormItem>
                )}/>
            </div>

             <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><Rows className="h-4 w-4"/>Description of Event</FormLabel><FormControl><Textarea placeholder="Provide a detailed description of what happened..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><MapPin className="h-4 w-4"/>Location</FormLabel><FormControl><Input placeholder="e.g., Workshop B, Site Road Alpha" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem><FormLabel>Region/Department</FormLabel><FormControl><Input placeholder="e.g., North Sector, Operations Dept." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="reportedBy" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><User className="h-4 w-4"/>Reported By</FormLabel><FormControl><Input placeholder="Name of person reporting" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            <Separator className="my-6" />
            <h3 className="text-lg font-medium text-muted-foreground">Classification & Impact</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="classification" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Briefcase className="h-4 w-4"/>Classification (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select classification" /></SelectTrigger></FormControl>
                        <SelectContent>{incidentClassifications.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="severityLevel" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><BarChart3 className="h-4 w-4"/>Severity (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select severity level" /></SelectTrigger></FormControl>
                        <SelectContent>
                             {Object.keys(severityLevels).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <FormField control={form.control} name="isRecordable" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3 h-full justify-between"><FormLabel>Recordable (OSHA/Local)?</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="isFatality" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3 h-full justify-between"><FormLabel className="text-red-600">Fatality?</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-red-500 data-[state=checked]:bg-red-600" /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="lostWorkDays" render={({ field }) => (
                    <FormItem><FormLabel>Lost Work Days</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            
            <Separator className="my-6" />
            <h3 className="text-lg font-medium text-muted-foreground">Status & Follow-up</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Activity className="h-4 w-4"/>Current Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select current status" /></SelectTrigger></FormControl>
                        <SelectContent>{incidentStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="rootCauseAnalyzed" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3 h-full justify-between"><FormLabel>Root Cause Analysis Done?</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>

            </CardContent>
          </ScrollArea>
          <div className="p-4 md:p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Log Incident"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
