
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { CalendarIcon, Save, XCircle, PlusCircle, Trash2, FileText, UploadCloud } from "lucide-react";
import type { Contractor, ContractorDocument, ContractorVettingStatus } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';

const contractorDocumentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Document name is required.").max(150),
  documentType: z.enum(['Insurance', 'Certification', 'Method Statement', 'Risk Assessment', 'Other']),
  fileUrlPlaceholder: z.string().max(255).optional().describe("Simulated: Name of the file or a note."),
  expiryDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid expiry date" }),
  uploadedDate: z.string().refine(val => isValid(parseISO(val)), { message: "Invalid upload date" }),
});

const contractorFormSchema = z.object({
  companyName: z.string().min(2, "Company name is required.").max(150),
  contactPerson: z.string().min(2, "Contact person is required.").max(100),
  contactEmail: z.string().email("Invalid email address.").max(100).optional().or(z.literal("")),
  contactPhone: z.string().max(30).optional(),
  tradeOrService: z.string().min(2, "Trade/Service is required.").max(100),
  vettingStatus: z.enum(['Pending', 'Approved', 'Rejected', 'Requires Review']),
  vettingNotes: z.string().max(1000).optional(),
  inductionCompleted: z.boolean().default(false),
  inductionDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid induction date" }),
  documents: z.array(contractorDocumentSchema).optional(),
  performanceNotes: z.string().max(2000).optional(),
});

type ContractorFormValues = z.infer<typeof contractorFormSchema>;

interface ContractorFormProps {
  initialData?: Contractor | null;
  onSave: (data: Omit<Contractor, 'id'>) => void;
  onCancel: () => void;
}

const newDocumentDefault = (): ContractorDocument => ({
    id: crypto.randomUUID(),
    name: "",
    documentType: "Other",
    uploadedDate: new Date().toISOString(),
    expiryDate: undefined,
    fileUrlPlaceholder: ""
});

export function ContractorForm({ initialData, onSave, onCancel }: ContractorFormProps) {
  const form = useForm<ContractorFormValues>({
    resolver: zodResolver(contractorFormSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      contactPerson: initialData?.contactPerson || "",
      contactEmail: initialData?.contactEmail || "",
      contactPhone: initialData?.contactPhone || "",
      tradeOrService: initialData?.tradeOrService || "",
      vettingStatus: initialData?.vettingStatus || "Pending",
      vettingNotes: initialData?.vettingNotes || "",
      inductionCompleted: initialData?.inductionCompleted || false,
      inductionDate: initialData?.inductionDate ? format(parseISO(initialData.inductionDate), 'yyyy-MM-dd') : undefined,
      documents: initialData?.documents?.map(doc => ({
        ...doc,
        expiryDate: doc.expiryDate ? format(parseISO(doc.expiryDate), 'yyyy-MM-dd') : undefined,
        uploadedDate: doc.uploadedDate ? format(parseISO(doc.uploadedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      })) || [],
      performanceNotes: initialData?.performanceNotes || "",
    },
  });

  const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  const onSubmit = (data: ContractorFormValues) => {
    const contractorToSave = {
      ...data,
      inductionDate: data.inductionDate ? parseISO(data.inductionDate).toISOString() : undefined,
      documents: data.documents?.map(doc => ({
        ...doc,
        expiryDate: doc.expiryDate ? parseISO(doc.expiryDate).toISOString() : undefined,
        uploadedDate: parseISO(doc.uploadedDate).toISOString(),
      })) || [],
    };
    onSave(contractorToSave);
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{initialData ? "Edit Contractor" : "Add New Contractor"}</DialogTitle>
        <DialogDescription>
          {initialData ? "Update the contractor's details." : "Enter details for the new contractor."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <ScrollArea className="max-h-[70vh] pr-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="Contractor Company Ltd." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="tradeOrService" render={({ field }) => (
                  <FormItem><FormLabel>Trade/Service Provided</FormLabel><FormControl><Input placeholder="e.g., Electrical, Plumbing, Scaffolding" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="contactEmail" render={({ field }) => (
                  <FormItem><FormLabel>Contact Email (Optional)</FormLabel><FormControl><Input type="email" placeholder="jane.doe@contractor.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="contactPhone" render={({ field }) => (
                  <FormItem><FormLabel>Contact Phone (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+1-555-123-4567" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Vetting & Induction */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Vetting & Induction</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="vettingStatus" render={({ field }) => (
                        <FormItem><FormLabel>Vetting Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                            <SelectContent>
                            {(['Pending', 'Approved', 'Rejected', 'Requires Review'] as ContractorVettingStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="inductionCompleted" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3 h-full justify-between">
                            <FormLabel>Safety Induction Completed?</FormLabel>
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="vettingNotes" render={({ field }) => (
                    <FormItem><FormLabel>Vetting Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Notes regarding vetting process or outcome..." rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                {form.watch("inductionCompleted") && (
                    <FormField control={form.control} name="inductionDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Induction Date (if completed)</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(parseISO(field.value), "PPP") : <span>Pick induction date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} /></PopoverContent>
                        </Popover><FormMessage /></FormItem>
                    )}/>
                )}
            </div>
            
            <Separator className="my-6" />

            {/* Document Management (Simulated) */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Management (Simulated)</h3>
                <FormDescription>Track key documents. Actual file uploads require backend integration.</FormDescription>
                {documentFields.map((docItem, index) => (
                    <Card key={docItem.id} className="p-3 bg-muted/50 space-y-3">
                        <div className="flex justify-between items-center">
                            <FormLabel className="text-sm font-medium">Document #{index + 1}</FormLabel>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(index)} className="text-destructive h-6 w-6"><Trash2 className="h-4 w-4"/></Button>
                        </div>
                        <FormField control={form.control} name={`documents.${index}.name`} render={({ field }) => (
                             <FormItem><FormLabel className="text-xs">Document Name/Title</FormLabel><FormControl><Input placeholder="e.g., Public Liability Insurance" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField control={form.control} name={`documents.${index}.documentType`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                    <SelectContent>{(['Insurance', 'Certification', 'Method Statement', 'Risk Assessment', 'Other'] as ContractorDocument['documentType'][]).map(dt => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}</SelectContent>
                                </Select><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name={`documents.${index}.expiryDate`} render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel className="text-xs">Expiry Date (Optional)</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl>
                                    <Button variant="outline" size="sm" className={cn("w-full pl-3 text-left font-normal text-xs", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick expiry</span>} <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                    </Button></FormControl></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                                </Popover><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name={`documents.${index}.fileUrlPlaceholder`} render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs flex items-center gap-1"><UploadCloud className="h-3 w-3"/>File Reference (Simulated)</FormLabel>
                                <FormControl><Input placeholder="e.g., insurance_policy.pdf, cert_xyz.jpg" {...field} /></FormControl>
                                <FormDescription className="text-xs">Enter filename or note. Actual upload needs backend.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name={`documents.${index}.uploadedDate`} render={({ field }) => ( <FormItem className="hidden"><FormControl><Input type="hidden" {...field} /></FormControl></FormItem> )}/>
                    </Card>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendDocument(newDocumentDefault())}><PlusCircle className="mr-2 h-4 w-4"/>Add Document Entry</Button>
                 <FormField name="documents" control={form.control} render={() => <FormMessage />} />
            </div>

            <Separator className="my-6" />

             {/* Performance Notes */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance Notes (Optional)</h3>
                 <FormField control={form.control} name="performanceNotes" render={({ field }) => (
                    <FormItem><FormLabel className="sr-only">Performance Notes</FormLabel><FormControl><Textarea placeholder="Observations on safety performance, quality of work, etc." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>


          </ScrollArea>
          <DialogFooter className="pt-6 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onCancel}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Add Contractor"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
