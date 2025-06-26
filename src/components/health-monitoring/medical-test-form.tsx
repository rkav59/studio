
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, ShieldCheck, Users, AlignLeft, Activity, Link2, Briefcase, AlertTriangle } from "lucide-react";
import type { MedicalTestRecord, MedicalTestRecordType, SimilarExposureGroup, MedicalScreeningPurpose, MedicalTestPrefillData } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { followUpKeywords } from "@/lib/health-config";
import { Card, CardContent, CardDescription as UiCardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card imports


const medicalTestTypes: MedicalTestRecordType[] = ['Audiometry', 'Spirometry (Lung Function)', 'Vision Test', 'Blood Test', 'Urine Test', 'Biological Monitoring', 'X-Ray', 'Musculoskeletal Assessment', 'Fitness to Work Assessment', 'Other'];
const medicalScreeningPurposes: MedicalScreeningPurpose[] = ['Pre-employment', 'Periodic', 'Exit', 'Post-Incident', 'Exposure-Specific', 'Return-to-Work', 'Other'];

const medicalTestFormSchema = z.object({
  employeeName: z.string().min(2, "Employee name is required.").max(150),
  employeeId: z.string().max(50).optional(),
  testType: z.enum(medicalTestTypes, { required_error: "Please select a test type." }),
  specificTestName: z.string().max(100).optional(),
  testDate: z.string().refine(val => isValid(parseISO(val)), { message: "Test date is required." }),
  screeningPurpose: z.string().optional(),
  linkedExposure: z.string().max(200).optional(),
  resultSummary: z.string().min(5, "Result summary is required.").max(2000),
  referenceRange: z.string().max(200).optional(),
  isFitForWork: z.boolean().optional(),
  certificateExpiryDate: z.string().nullable().optional().refine(val => !val || isValid(parseISO(val as string)), { message: "Invalid certificate expiry date" }),
  followUpRequired: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional(),
  segId: z.string().optional(),
});

export type MedicalTestFormValues = z.infer<typeof medicalTestFormSchema>;

interface MedicalTestFormProps {
  segs: SimilarExposureGroup[];
  initialData?: MedicalTestRecord | MedicalTestPrefillData | null; 
  onSave: (data: MedicalTestFormValues) => void;
  onCancel: () => void;
  isEditing: boolean;
  isSubmitting?: boolean; // Added for button state
}

const NO_SELECTION_VALUE = "__NONE__"; // Placeholder for 'None' option

export function MedicalTestForm({ segs, initialData, onSave, onCancel, isEditing, isSubmitting }: MedicalTestFormProps) {
  const form = useForm<MedicalTestFormValues>({
    resolver: zodResolver(medicalTestFormSchema),
    defaultValues: {
      employeeName: initialData?.employeeName || "",
      employeeId: (initialData as MedicalTestRecord)?.employeeId || "",
      testType: initialData?.testType || undefined,
      specificTestName: (initialData as MedicalTestRecord)?.specificTestName || "",
      testDate: (initialData as MedicalTestRecord)?.testDate ? format(parseISO((initialData as MedicalTestRecord).testDate as string), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      screeningPurpose: (initialData as MedicalTestRecord)?.screeningPurpose || undefined,
      linkedExposure: initialData?.linkedExposure || "",
      resultSummary: (initialData as MedicalTestRecord)?.resultSummary || "",
      referenceRange: (initialData as MedicalTestRecord)?.referenceRange || "",
      isFitForWork: (initialData as MedicalTestRecord)?.isFitForWork === undefined ? undefined : (initialData as MedicalTestRecord).isFitForWork,
      certificateExpiryDate: (initialData as MedicalTestRecord)?.certificateExpiryDate ? format(parseISO((initialData as MedicalTestRecord).certificateExpiryDate as string), 'yyyy-MM-dd') : null,
      followUpRequired: (initialData as MedicalTestRecord)?.followUpRequired === undefined ? false : (initialData as MedicalTestRecord).followUpRequired,
      notes: (initialData as MedicalTestRecord)?.notes || "",
      segId: initialData?.segId || undefined,
    },
  });

  const watchedTestType = form.watch("testType");
  const watchedResultSummary = form.watch("resultSummary");

  useEffect(() => {
    if (watchedResultSummary) {
      const summaryLowerCase = watchedResultSummary.toLowerCase();
      const requiresFollowUp = followUpKeywords.some(keyword => summaryLowerCase.includes(keyword));
      if (requiresFollowUp && !form.getValues("followUpRequired")) {
        form.setValue("followUpRequired", true);
      }
    }
  }, [watchedResultSummary, form]);


  const onSubmit = (data: MedicalTestFormValues) => {
     const testToSave = {
        ...data,
        screeningPurpose: data.screeningPurpose === NO_SELECTION_VALUE ? undefined : data.screeningPurpose as MedicalScreeningPurpose,
        segId: data.segId === NO_SELECTION_VALUE ? undefined : data.segId,
        specificTestName: data.testType === 'Other' ? data.specificTestName : undefined,
        certificateExpiryDate: data.certificateExpiryDate || undefined,
    };
    onSave(testToSave);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="employeeName" render={({ field }) => (
                    <FormItem><FormLabel>Employee Name</FormLabel><FormControl><Input placeholder="Full name of employee" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="employeeId" render={({ field }) => (
                    <FormItem><FormLabel>Employee ID (Optional)</FormLabel><FormControl><Input placeholder="Employee's unique ID" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="testDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Test/Screening Date</FormLabel>
                <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick test date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} initialFocus /></PopoverContent>
                </Popover><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="testType" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><Activity className="h-4 w-4"/>Test Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select test type" /></SelectTrigger></FormControl>
                    <SelectContent>{medicalTestTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
            )}/>
            {watchedTestType === 'Other' && (
                 <FormField control={form.control} name="specificTestName" render={({ field }) => (
                    <FormItem><FormLabel>Specific Test Name</FormLabel><FormControl><Input placeholder="Name of the 'Other' test" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            )}
            <FormField control={form.control} name="screeningPurpose" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><Briefcase className="h-4 w-4"/>Screening Purpose (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || NO_SELECTION_VALUE}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value={NO_SELECTION_VALUE}>None</SelectItem>
                            {medicalScreeningPurposes.map(purpose => <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>)}
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="linkedExposure" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><Link2 className="h-4 w-4"/>Linked Exposure (Optional)</FormLabel><FormControl><Input placeholder="e.g., Noise in Workshop A, Silica Dust" {...field} /></FormControl>
                <FormDescription>Note any specific exposure this screening is related to.</FormDescription>
                <FormMessage /></FormItem>
            )}/>

            <FormField control={form.control} name="resultSummary" render={({ field }) => (
                <FormItem><FormLabel>Result Summary</FormLabel><FormControl><Textarea placeholder="Summarize key findings, values, or observations from the test." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="referenceRange" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><AlignLeft className="h-4 w-4"/>Reference Range (Optional)</FormLabel><FormControl><Input placeholder="e.g., < 5 mg/L, 70-99 mg/dL, Negative" {...field} /></FormControl>
                <FormDescription>Provide the normal/expected range for this test if applicable.</FormDescription>
                <FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="isFitForWork" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3 h-full justify-between">
                        <FormLabel>Fit for Work?</FormLabel>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="followUpRequired" render={({ field }) => (
                     <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3 h-full justify-between">
                        <FormLabel className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-yellow-500"/>Follow-up Required?</FormLabel>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="certificateExpiryDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Certificate/Validity Expiry Date (Optional)</FormLabel>
                <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick expiry date (or leave blank)</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : null)} /></PopoverContent>
                </Popover><FormMessage /></FormItem>
            )}/>
             <FormField
                control={form.control}
                name="segId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-1"><Users className="h-4 w-4"/>Associated SEG (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || NO_SELECTION_VALUE}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select SEG (if applicable)" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value={NO_SELECTION_VALUE}>None</SelectItem>
                            {segs.map(seg => <SelectItem key={seg.id} value={seg.id}>{seg.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormDescription>Link this test to an SEG for group analysis.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Additional Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any other relevant information, recommendations, or context." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </ScrollArea>
          <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {isEditing ? "Save Changes" : "Log Test Record"}
            </Button>
          </div>
        </form>
    </Form>
  );
}
