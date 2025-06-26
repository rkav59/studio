
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
import { CalendarIcon, Save, XCircle, Thermometer, Users, AlertTriangle, FileText, Tag, MapPin, Clock, Beaker, Package } from "lucide-react";
import type { IndustrialHygieneSample, IndustrialHygieneSampleAgent, SimilarExposureGroup } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardDescription as UiCardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ihSampleAgents: IndustrialHygieneSampleAgent[] = ['Noise', 'Dust (Respirable)', 'Dust (Inhalable)', 'Silica', 'Asbestos', 'VOCs', 'Lead', 'Welding Fumes', 'Specific Chemical', 'Ergonomic Strain', 'Other'];

const ihSampleFormSchema = z.object({
  segId: z.string().optional(),
  employeeName: z.string().max(150).optional(),
  sampleDate: z.string().refine(val => isValid(parseISO(val)), { message: "Sample date is required." }),
  agent: z.enum(ihSampleAgents, { required_error: "Please select an agent." }),
  specificAgentName: z.string().max(100).optional(),
  exposureLevel: z.coerce.number({ invalid_type_error: "Exposure level must be a number." }),
  units: z.string().min(1, "Units are required.").max(20),
  oel: z.coerce.number().optional(),
  oelUnits: z.string().max(20).optional(),
  sampleType: z.enum(['Personal', 'Area', 'Source'], { required_error: "Please select sample type." }),
  durationHours: z.coerce.number().min(0).optional(),
  twa: z.coerce.number().optional(),
  stel: z.coerce.number().optional(),
  location: z.string().min(2, "Location is required.").max(200),
  notes: z.string().max(2000).optional(),
}).refine(data => data.segId || data.employeeName, {
  message: "Either SEG or Employee Name must be provided.",
  path: ["employeeName"], 
}).refine(data => (data.oel === undefined && data.oelUnits === undefined) || (data.oel !== undefined && data.oelUnits !== undefined && data.oelUnits.trim() !== ""), {
    message: "OEL Units must be provided if OEL value is entered.",
    path: ["oelUnits"],
});

type IhSampleFormValues = z.infer<typeof ihSampleFormSchema>;

interface IhSampleFormProps {
  segs: SimilarExposureGroup[];
  initialData?: IndustrialHygieneSample | null;
  onSave: (data: IhSampleFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const NO_SEG_VALUE = "__NONE__";

export function IhSampleForm({ segs, initialData, onSave, onCancel, isSubmitting }: IhSampleFormProps) {
  const form = useForm<IhSampleFormValues>({
    resolver: zodResolver(ihSampleFormSchema),
    defaultValues: {
      segId: initialData?.segId || NO_SEG_VALUE,
      employeeName: initialData?.employeeName || "",
      sampleDate: initialData?.sampleDate ? format(parseISO(initialData.sampleDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      agent: initialData?.agent || undefined,
      specificAgentName: initialData?.specificAgentName || "",
      exposureLevel: initialData?.exposureLevel || 0,
      units: initialData?.units || "",
      oel: initialData?.oel || undefined,
      oelUnits: initialData?.oelUnits || "",
      sampleType: initialData?.sampleType || undefined,
      durationHours: initialData?.durationHours || undefined,
      twa: initialData?.twa || undefined,
      stel: initialData?.stel || undefined,
      location: initialData?.location || "",
      notes: initialData?.notes || "",
    },
  });

  const watchedAgent = form.watch("agent");

  const onSubmit = (data: IhSampleFormValues) => {
    const sampleToSave = {
        ...data,
        segId: data.segId === NO_SEG_VALUE ? undefined : data.segId,
        specificAgentName: (data.agent === 'Specific Chemical' || data.agent === 'Other') ? data.specificAgentName : undefined,
        oelUnits: data.oel !== undefined ? data.oelUnits : undefined,
    };
    onSave(sampleToSave);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="segId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-1"><Users className="h-4 w-4"/>Target SEG (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || NO_SEG_VALUE}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select SEG (if applicable)" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value={NO_SEG_VALUE}>None</SelectItem>
                                {segs.map(seg => <SelectItem key={seg.id} value={seg.id}>{seg.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField control={form.control} name="employeeName" render={({ field }) => (
                    <FormItem><FormLabel>Employee Name (if not SEG)</FormLabel><FormControl><Input placeholder="If personal sample, not SEG" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="sampleDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Sample Date</FormLabel>
                <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick sample date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} initialFocus /></PopoverContent>
                </Popover><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="agent" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><Beaker className="h-4 w-4"/>Agent Monitored</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger></FormControl>
                    <SelectContent>{ihSampleAgents.map(agent => <SelectItem key={agent} value={agent}>{agent}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
            )}/>
            {(watchedAgent === 'Specific Chemical' || watchedAgent === 'Other') && (
                 <FormField control={form.control} name="specificAgentName" render={({ field }) => (
                    <FormItem><FormLabel>Specific Agent Name</FormLabel><FormControl><Input placeholder={`Name of ${watchedAgent.toLowerCase()}`} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="exposureLevel" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Thermometer className="h-4 w-4"/>Exposure Level</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g., 85, 0.5" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="units" render={({ field }) => (
                    <FormItem><FormLabel>Units</FormLabel><FormControl><Input placeholder="e.g., dBA, mg/m³, ppm" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="oel" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-muted-foreground"/>OEL (Optional)</FormLabel><FormControl><Input type="number" step="any" placeholder="Occupational Exposure Limit" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="oelUnits" render={({ field }) => (
                    <FormItem><FormLabel>OEL Units (if OEL set)</FormLabel><FormControl><Input placeholder="Units for OEL" {...field} disabled={!form.watch("oel")}/></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <FormField control={form.control} name="sampleType" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><Tag className="h-4 w-4"/>Sample Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select sample type" /></SelectTrigger></FormControl>
                    <SelectContent>{(['Personal', 'Area', 'Source'] as IndustrialHygieneSample['sampleType'][]).map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField control={form.control} name="durationHours" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Clock className="h-4 w-4"/>Duration (hrs)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 8" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="twa" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Package className="h-4 w-4"/>TWA (Optional)</FormLabel><FormControl><Input type="number" step="any" placeholder="Time-Weighted Avg" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="stel" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Package className="h-4 w-4"/>STEL (Optional)</FormLabel><FormControl><Input type="number" step="any" placeholder="Short-Term Limit" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><MapPin className="h-4 w-4"/>Specific Location of Sample</FormLabel><FormControl><Input placeholder="e.g., Workshop Bay 3, Assembly Line Alpha" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><FileText className="h-4 w-4"/>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any relevant details about the sampling conditions, equipment used, etc." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
        </ScrollArea>
        <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Log Sample"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
