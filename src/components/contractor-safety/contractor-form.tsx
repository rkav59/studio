
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardDescription as UiCardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, PlusCircle, Trash2, FileText, UploadCloud, Sparkles, Loader2 } from "lucide-react";
import type { Contractor, ContractorDocument, ContractorVettingStatus, PermitToWork, PtwSupervisionRecord, JobCard } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { vetContractor, type VetContractorInput } from "@/ai/flows/vet-contractor-flow";
import { useToast } from "@/hooks/use-toast";


// Refined Zod schema for ContractorDocument for form validation
const contractorDocumentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Document name is required.").max(150),
  documentType: z.enum(['Insurance', 'Certification', 'Method Statement', 'Risk Assessment', 'Other']),
  fileUrl: z.string().optional(),
  filePath: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
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
  vettingNotes: z.string().max(5000).optional(), // Increased max length
  inductionCompleted: z.boolean().default(false),
  inductionDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid induction date" }),
  documents: z.array(contractorDocumentSchema).optional(),
  performanceNotes: z.string().max(2000).optional(),
});

export type ContractorFormValues = z.infer<typeof contractorFormSchema>;

export type ContractorFormDataWithFiles = ContractorFormValues & {
  documentFiles?: Map<string, File>;
  documentsToRemove?: string[];
};

interface ContractorFormProps {
  initialData?: Contractor | null;
  onSave: (data: ContractorFormDataWithFiles) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  uploadProgress?: Map<string, number>;
}

const newDocumentDefault = (): ContractorDocument => ({
    id: crypto.randomUUID(),
    name: "",
    documentType: "Other",
    uploadedDate: new Date().toISOString(),
    expiryDate: undefined,
});

export function ContractorForm({ initialData, onSave, onCancel, isSubmitting, uploadProgress }: ContractorFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documentFiles, setDocumentFiles] = useState<Map<string, File>>(new Map());
  const [documentsToRemove, setDocumentsToRemove] = useState<string[]>([]);
  const [isAiVettingLoading, setIsAiVettingLoading] = useState(false);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, documentId: string) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setDocumentFiles(prev => new Map(prev).set(documentId, file));
      const docIndex = form.getValues("documents").findIndex(d => d.id === documentId);
      if (docIndex !== -1) {
        form.setValue(`documents.${docIndex}.fileName`, file.name);
      }
    }
  };
  
  const handleRemoveDocument = (index: number) => {
    const docToRemove = form.getValues(`documents.${index}`);
    if (docToRemove && docToRemove.filePath) {
        setDocumentsToRemove(prev => [...prev, docToRemove.filePath!]);
    }
    removeDocument(index);
    if (docToRemove) {
      setDocumentFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(docToRemove.id);
        return newMap;
      });
    }
  };

  const onSubmit = (data: ContractorFormValues) => {
    const contractorToSave: ContractorFormDataWithFiles = {
      ...data,
      inductionDate: data.inductionDate ? parseISO(data.inductionDate).toISOString() : undefined,
      documents: data.documents?.map(doc => ({
        ...doc,
        expiryDate: doc.expiryDate ? parseISO(doc.expiryDate).toISOString() : undefined,
        uploadedDate: parseISO(doc.uploadedDate).toISOString(),
      })) || [],
      documentFiles,
      documentsToRemove,
    };
    onSave(contractorToSave);
  };

  const handleGetAiVettingSuggestion = async () => {
    if (!user?.uid || !initialData?.id) {
        toast({ title: "Error", description: "Cannot get suggestion without a saved contractor.", variant: "destructive" });
        return;
    }
    setIsAiVettingLoading(true);

    try {
        // 1. Fetch PTWs for contractor
        const ptwQuery = query(collection(db, 'permitsToWork'), where("userId", "==", user.uid), where("contractorId", "==", initialData.id));
        const ptwSnapshot = await getDocs(ptwQuery);
        const ptws = ptwSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as PermitToWork);
        const ptwSummary = { total: ptws.length, closed: 0, expired: 0, cancelled: 0 };
        ptws.forEach(ptw => {
            if (ptw.status === 'Closed') ptwSummary.closed++;
            if (ptw.status === 'Expired') ptwSummary.expired++;
            if (ptw.status === 'Cancelled') ptwSummary.cancelled++;
        });

        // 2. Fetch Job Cards
        const jobCardQuery = query(collection(db, 'jobCards'), where("userId", "==", user.uid), where("contractorId", "==", initialData.id));
        const jobCardSnapshot = await getDocs(jobCardQuery);
        const jobCards = jobCardSnapshot.docs.map(d => d.data() as JobCard);
        const jobCardSummary = { total: jobCards.length, completed: 0, cancelled: 0 };
        jobCards.forEach(jc => {
            if (jc.status === 'Completed') jobCardSummary.completed++;
            if (jc.status === 'Cancelled') jobCardSummary.cancelled++;
        });
        
        // 3. Fetch Supervision Records
        let supervisionRecords: PtwSupervisionRecord[] = [];
        const ptwIds = ptws.map(p => p.id);
        if(ptwIds.length > 0) {
           // Firestore `in` query is limited to 30 items. For simplicity, we assume this limit is not exceeded.
            const supervisionQuery = query(collection(db, 'ptwSupervisionRecords'), where("userId", "==", user.uid), where("ptwId", "in", ptwIds));
            const supervisionSnapshot = await getDocs(supervisionQuery);
            supervisionRecords = supervisionSnapshot.docs.map(d => d.data() as PtwSupervisionRecord);
        }
        const supervisionSummary = { excellent: 0, good: 0, fair: 0, poor: 0, total: supervisionRecords.length };
        supervisionRecords.forEach(sr => {
            const rating = sr.overallPerformanceRating.toLowerCase() as keyof typeof supervisionSummary;
            if (supervisionSummary.hasOwnProperty(rating)) {
                supervisionSummary[rating]++;
            }
        });
        
        // 4. Call AI Flow
        const aiInput: VetContractorInput = {
            contractorName: initialData.companyName,
            tradeOrService: initialData.tradeOrService,
            ptwSummary,
            jobCardSummary,
            supervisionSummary,
        };
        
        const result = await vetContractor(aiInput);
        
        // 5. Format and set form values
        const formattedNotes = `## AI Vetting Assistance Summary

**Overall Assessment:**
${result.overallAssessment}

**Positive Points:**
${result.positivePoints.length > 0 ? result.positivePoints.map(p => `- ${p}`).join('\n') : '- None'}

**Areas for Concern:**
${result.areasForConcern.length > 0 ? result.areasForConcern.map(c => `- ${c}`).join('\n') : '- None'}

**Reasoning for Suggestion:**
${result.recommendationReasoning}

---
*This summary was generated by AI based on historical data on ${format(new Date(), 'PPP')}. Please review and use your professional judgment.*
`;

        form.setValue('vettingNotes', formattedNotes);
        form.setValue('vettingStatus', result.suggestedVettingStatus);
        
        toast({ title: "AI Suggestion Generated", description: `Suggested Status: ${result.suggestedVettingStatus}. Notes updated.` });

    } catch (error) {
        console.error("Failed to get AI vetting suggestion:", error);
        toast({ title: "Error", description: "Could not generate AI suggestion. Please try again.", variant: "destructive" });
    } finally {
        setIsAiVettingLoading(false);
    }
  };


  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <UiCardDescription>
          {initialData ? "Update the contractor's details below." : "Enter details for the new contractor."}
        </UiCardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 p-4 md:p-6">
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
                 <FormField
                    control={form.control}
                    name="vettingNotes"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between items-center">
                                <FormLabel>Vetting Notes (Optional)</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGetAiVettingSuggestion}
                                    disabled={!initialData?.id || isAiVettingLoading}
                                    className="text-accent border-accent hover:bg-accent/10 h-8"
                                >
                                    {isAiVettingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    AI Vetting Suggestion
                                </Button>
                            </div>
                            <FormControl>
                                <Textarea placeholder="Notes regarding vetting process or outcome..." rows={4} {...field} />
                            </FormControl>
                             <FormDescription>Click the AI button to analyze historical performance and generate a summary here.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
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

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Management</h3>
                {documentFields.map((docItem, index) => (
                    <Card key={docItem.id} className="p-3 bg-muted/50 space-y-3">
                        <div className="flex justify-between items-center">
                            <FormLabel className="text-sm font-medium">Document #{index + 1}</FormLabel>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDocument(index)} className="text-destructive h-6 w-6"><Trash2 className="h-4 w-4"/></Button>
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
                        <FormItem>
                            <FormLabel htmlFor={`file-upload-${docItem.id}`} className="text-xs flex items-center gap-1"><UploadCloud className="h-3 w-3"/>Upload File (Optional)</FormLabel>
                            <Input id={`file-upload-${docItem.id}`} type="file" onChange={(e) => handleFileChange(e, docItem.id)} className="text-xs" />
                            { (form.getValues(`documents.${index}.fileName`) || (initialData?.documents && initialData.documents[index]?.fileName)) && (
                                <FormDescription className="text-xs text-primary/80">
                                    Current file: {form.getValues(`documents.${index}.fileName`) || initialData?.documents?.[index]?.fileName}
                                    {initialData?.documents?.[index]?.fileUrl && !documentFiles.has(docItem.id) && 
                                      " (Will keep existing if no new file chosen)"}
                                    {documentFiles.has(docItem.id) && " (New file selected)"}
                                </FormDescription>
                            )}
                             {initialData?.documents?.[index]?.fileUrl && !documentFiles.has(docItem.id) && (
                                 <FormDescription className="text-xs">
                                   <a href={initialData.documents[index].fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                     View current uploaded file
                                   </a>
                                 </FormDescription>
                             )}
                            {uploadProgress?.has(docItem.id) && uploadProgress.get(docItem.id)! < 100 && (
                                <div className="mt-2 space-y-1">
                                    <Progress value={uploadProgress.get(docItem.id)} className="h-2" />
                                    <p className="text-xs text-muted-foreground">Uploading: {Math.round(uploadProgress.get(docItem.id)!)}%</p>
                                </div>
                            )}
                        </FormItem>
                        <FormField control={form.control} name={`documents.${index}.uploadedDate`} render={({ field }) => ( <FormItem className="hidden"><FormControl><Input type="hidden" {...field} /></FormControl></FormItem> )}/>
                    </Card>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendDocument(newDocumentDefault())}><PlusCircle className="mr-2 h-4 w-4"/>Add Document Entry</Button>
                 <FormField name="documents" control={form.control} render={() => <FormMessage />} />
            </div>

            <Separator className="my-6" />

             <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance Notes (Optional)</h3>
                 <FormField control={form.control} name="performanceNotes" render={({ field }) => (
                    <FormItem><FormLabel className="sr-only">Performance Notes</FormLabel><FormControl><Textarea placeholder="Observations on safety performance, quality of work, etc." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            </CardContent>
          </ScrollArea>
          <div className="p-4 md:p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Add Contractor"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
