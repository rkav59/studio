
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
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, ShieldCheck, Package, User, StickyNote, AlertCircle, Clock, ListChecks, CheckSquare, CircleOff, AlertTriangle as AlertTriangleIcon } from "lucide-react"; // Renamed AlertTriangle to avoid conflict
import type { PpeItem, PpeInspectionRecord, PpeInspectionOverallStatus, PpeInspectionChecklistItemInstance, PpeInspectionChecklistItemResult } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ppeInspectionOverallStatuses: PpeInspectionOverallStatus[] = ['Pass', 'Requires Repair', 'To be Replaced', 'Action Pending'];
const ppeChecklistItemResults: PpeInspectionChecklistItemResult[] = ['Pass', 'Fail', 'N/A', 'Pending'];


export const DEFAULT_PPE_CHECKLIST_ITEMS_TEMPLATE: Array<Omit<PpeInspectionChecklistItemInstance, 'id' | 'result' | 'remarks' > & { templateItemId: string }> = [
  { templateItemId: 'ppe-check-visual', text: 'Visual Condition: Free from visible damage, cracks, tears, or deformities?' },
  { templateItemId: 'ppe-check-clean', text: 'Cleanliness: Item is clean and hygienic?' },
  { templateItemId: 'ppe-check-labels', text: 'Labels & Markings: All required labels, warnings, and certification marks legible and present?' },
  { templateItemId: 'ppe-check-fasteners', text: 'Straps & Fasteners: All straps, buckles, and fasteners present and functioning correctly?' },
  { templateItemId: 'ppe-check-expiry', text: 'Expiry Date: Item is within its valid service life / expiry date (if applicable)?' },
];

const ppeInspectionChecklistItemSchema = z.object({
  id: z.string(),
  templateItemId: z.string().optional(),
  text: z.string().min(1, "Checklist item text cannot be empty."),
  result: z.enum(ppeChecklistItemResults),
  remarks: z.string().max(500, "Remarks are too long.").optional(),
});

const ppeInspectionFormSchema = z.object({
  ppeItemId: z.string({ required_error: "Please select a PPE item." }),
  uniquePpeIdentifier: z.string().max(100).optional().describe("Optional serial number or unique ID if applicable."),
  inspectionDate: z.string().refine(val => isValid(parseISO(val)), { message: "Inspection date is required." }),
  inspectorName: z.string().min(2, "Inspector name is required.").max(150),
  overallStatus: z.enum(ppeInspectionOverallStatuses, { required_error: "Please select an overall status." }),
  checklistItems: z.array(ppeInspectionChecklistItemSchema).min(1, "At least one checklist item is required."),
  notes: z.string().max(2000).optional(),
  followUpAction: z.string().max(1000).optional(),
  nextInspectionDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid next inspection date" }),
});

export type PpeInspectionFormValues = z.infer<typeof ppeInspectionFormSchema>;

interface PpeInspectionFormProps {
  ppeItems: PpeItem[];
  initialData?: PpeInspectionRecord | null;
  onSave: (data: PpeInspectionFormValues) => void;
  onCancel: () => void;
}

export function PpeInspectionForm({ ppeItems, initialData, onSave, onCancel }: PpeInspectionFormProps) {
  const isEditing = !!initialData;
  const form = useForm<PpeInspectionFormValues>({
    resolver: zodResolver(ppeInspectionFormSchema),
    defaultValues: {
      ppeItemId: initialData?.ppeItemId || (ppeItems.length > 0 ? ppeItems[0].id : ""),
      uniquePpeIdentifier: initialData?.uniquePpeIdentifier || "",
      inspectionDate: initialData?.inspectionDate ? format(parseISO(initialData.inspectionDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      inspectorName: initialData?.inspectorName || "",
      overallStatus: initialData?.overallStatus || undefined,
      checklistItems: initialData?.checklistItems && initialData.checklistItems.length > 0
        ? initialData.checklistItems.map(item => ({
            id: item.id || crypto.randomUUID(),
            templateItemId: item.templateItemId || '',
            text: item.text,
            result: item.result || 'Pending',
            remarks: item.remarks || '',
          }))
        : DEFAULT_PPE_CHECKLIST_ITEMS_TEMPLATE.map(templateItem => ({
            id: crypto.randomUUID(),
            templateItemId: templateItem.templateItemId,
            text: templateItem.text,
            result: 'Pending' as PpeInspectionChecklistItemResult,
            remarks: '',
          })),
      notes: initialData?.notes || "",
      followUpAction: initialData?.followUpAction || "",
      nextInspectionDate: initialData?.nextInspectionDate ? format(parseISO(initialData.nextInspectionDate), 'yyyy-MM-dd') : undefined,
    },
  });

  const { fields: checklistFields, append: appendChecklistItem, remove: removeChecklistItem } = useFieldArray({
    control: form.control,
    name: "checklistItems",
  });

  const onSubmit = (data: PpeInspectionFormValues) => {
    onSave(data);
  };

  const getChecklistItemStatusIcon = (status: PpeInspectionChecklistItemResult) => {
    switch (status) {
      case 'Pass': return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'Fail': return <AlertTriangleIcon className="h-4 w-4 text-red-500" />; // Use renamed import
      case 'N/A': return <CircleOff className="h-4 w-4 text-muted-foreground" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
     <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            {isEditing ? "Edit PPE Inspection Record" : "Log New PPE Inspection"}
        </CardTitle>
        <CardDescription>
          {isEditing ? "Update details for this PPE inspection." : "Enter details for the PPE inspection conducted. Complete the checklist below."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 p-4 md:p-6">
              <FormField control={form.control} name="ppeItemId" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><Package className="h-4 w-4"/>PPE Item Inspected</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={ppeItems.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder={ppeItems.length === 0 ? "No PPE items in inventory" : "Select PPE item"} /></SelectTrigger></FormControl>
                    <SelectContent>{ppeItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name} (Type: {item.type}, Stock: {item.currentStock})</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="uniquePpeIdentifier" render={({ field }) => (
                <FormItem><FormLabel>Unique PPE ID / Serial No. (Optional)</FormLabel><FormControl><Input placeholder="e.g., SN12345, AssetTag789" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="inspectorName" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><User className="h-4 w-4"/>Inspector Name</FormLabel><FormControl><Input placeholder="Inspector's full name" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="inspectionDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel className="flex items-center gap-1"><CalendarIcon className="h-4 w-4"/>Inspection Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick inspection date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} /></PopoverContent>
                    </Popover><FormMessage /></FormItem>
                )}/>
              </div>
              
              <Separator className="my-4" />
              <h3 className="text-md font-medium text-muted-foreground flex items-center gap-2"><ListChecks className="h-5 w-5"/>Inspection Checklist</h3>
                
              <div className="space-y-4">
                {checklistFields.map((item, index) => (
                  <Card key={item.id} className="p-3 bg-muted/50 space-y-2">
                    <FormLabel className="text-sm font-medium block">{index + 1}. {item.text}</FormLabel>
                    <FormField
                      control={form.control}
                      name={`checklistItems.${index}.result`}
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <div className="flex items-center gap-2">
                                  {getChecklistItemStatusIcon(field.value as PpeInspectionChecklistItemResult)}
                                  <SelectValue placeholder="Select status" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ppeChecklistItemResults.map(status => (
                                <SelectItem key={status} value={status}>
                                   <div className="flex items-center gap-2">
                                    {getChecklistItemStatusIcon(status)}
                                    {status}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`checklistItems.${index}.remarks`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea placeholder="Optional remarks for this item..." rows={1} {...field} className="text-xs bg-background"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>
                ))}
                <FormField name="checklistItems" control={form.control} render={() => <FormMessage />} />
              </div>


              <Separator className="my-4" />
              <h3 className="text-md font-medium text-muted-foreground">Overall Outcome & Notes</h3>
              <FormField control={form.control} name="overallStatus" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><AlertCircle className="h-4 w-4"/>Overall Inspection Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select overall inspection status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ppeInspectionOverallStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-1"><StickyNote className="h-4 w-4"/>General Inspection Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Overall observations, summary of defects if any, etc." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              
              <Separator className="my-4" />
              <h3 className="text-md font-medium text-muted-foreground">Follow-up (Optional)</h3>

               <FormField control={form.control} name="followUpAction" render={({ field }) => (
                <FormItem><FormLabel>Follow-up Action Required</FormLabel><FormControl><Input placeholder="e.g., Send for repair, Order replacement, Monitor use" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="nextInspectionDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel className="flex items-center gap-1"><Clock className="h-4 w-4"/>Next Inspection Date</FormLabel>
                <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick next inspection date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} /></PopoverContent>
                </Popover><FormMessage /></FormItem>
              )}/>

            </CardContent>
          </ScrollArea>
          <div className="p-4 md:p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel}><XCircle className="mr-2 h-4 w-4" />Cancel</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white"><Save className="mr-2 h-4 w-4" />{isEditing ? "Save Changes" : "Log Inspection"}</Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
    
