

"use client";
import { toIso } from "@/lib/supabase/serialization";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuditScheduler } from '@/components/sheq-audit/audit-scheduler';
import { AuditExecutionForm } from '@/components/sheq-audit/audit-execution-form';
import type { SheqAudit, AuditChecklistItem, ChecklistItemTemplate, NonConformance, AnalyzeAuditDataInput, AnalyzeAuditDataOutput, ChecklistTemplate, AuditObservationEntry } from "@/lib/types";
import { defaultChecklistTemplates } from '@/lib/checklist-templates';
import { Separator } from '@/components/ui/separator';
import { format, isValid, parseISO, isBefore } from 'date-fns';
import { ChevronLeft, Eye, ListChecks, CheckSquare, BrainCircuit, Sparkles, Loader2, LinkIcon, Filter, BookCheck, SearchCheck, FileCheck2, Download, Archive, ArchiveRestore, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { analyzeSheqAuditData } from '@/ai/client';
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/supabase/client';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp, orderBy } from '@/lib/supabase/records';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const SHEQ_AUDITS_COLLECTION = 'sheqAudits';
const USER_CHECKLIST_TEMPLATES_COLLECTION = 'userChecklistTemplates';

const auditTypesForFilter: Array<SheqAudit['auditType'] | 'All'> = ['All', 'Safety', 'Health', 'Environment', 'Quality', 'Integrated'];


const getDefaultNonConformance = (): NonConformance => ({
  id: crypto.randomUUID(),
  description: "",
  severity: "Minor",
  relatedChecklistItemId: "",
  relatedIncidentId: "",
  correctiveActionsProposed: "",
  preventiveActionsProposed: "",
  actionAssignedTo: "",
  actionDueDate: "",
  actionStatus: "Open",
  actionCompletionDate: "",
  actionVerificationNotes: "",
});

const getDefaultObservationEntry = (): AuditObservationEntry => ({
  id: crypto.randomUUID(),
  text: "",
});


export default function SheqAuditPage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();

  const [currentAudit, setCurrentAudit] = useState<SheqAudit | null>(null);
  const [viewingAuditDetails, setViewingAuditDetails] = useState<SheqAudit | null>(null);
  
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AnalyzeAuditDataOutput | null>(null);
  const [isAiInsightsModalOpen, setIsAiInsightsModalOpen] = useState(false);
  const [completedAuditFilterType, setCompletedAuditFilterType] = useState<SheqAudit['auditType'] | 'All'>('All');
  const [archivedSearchTerm, setArchivedSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const canScheduleAndManage = useMemo(() => (userProfile && ['admin', 'she_officer'].includes(userProfile.role)), [userProfile]);
  const canExecute = useMemo(() => (userProfile && ['admin', 'she_officer', 'she_rep'].includes(userProfile.role)), [userProfile]);


  // Fetch SHEQ Audits
  const { data: audits = [], isLoading: isLoadingAudits, error: auditsError } = useQuery<SheqAudit[]>({
    queryKey: [SHEQ_AUDITS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, SHEQ_AUDITS_COLLECTION), where("userId", "==", user.uid), orderBy("auditDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          isArchived: data.isArchived || false, // Ensure isArchived exists
          auditDate: toIso(data.auditDate),
          checklist: (data.checklist || []).map((item: any) => ({ 
            ...item,
            id: item.id || crypto.randomUUID(),
            observations: (item.observations || []).map((obs: any) => ({...obs, id: obs.id || crypto.randomUUID()})),
          })),
          nonConformances: (data.nonConformances || []).map((nc: any) => ({
            ...nc,
            id: nc.id || crypto.randomUUID(),
            actionDueDate: nc.actionDueDate && (nc.actionDueDate as Timestamp)?.toDate ? toIso(nc.actionDueDate) : undefined,
            actionCompletionDate: nc.actionCompletionDate && (nc.actionCompletionDate as Timestamp)?.toDate ? toIso(nc.actionCompletionDate) : undefined,
          })),
        } as SheqAudit;
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch User Checklist Templates
  const { data: userChecklistTemplates = [], isLoading: isLoadingUserTemplates, error: userTemplatesError } = useQuery<ChecklistTemplate[]>({
    queryKey: [USER_CHECKLIST_TEMPLATES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, USER_CHECKLIST_TEMPLATES_COLLECTION), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistTemplate));
    },
    enabled: !!user?.uid,
  });

  const allChecklistTemplatesForScheduler = useMemo(() => {
    const systemTemplates = de…18508 tokens truncated…   )}
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
                                    {initialData?.documents?.[index]?.filePath && !documentFiles.has(docItem.id) &&
                                      " (Will keep existing if no new file chosen)"}
                                    {documentFiles.has(docItem.id) && " (New file selected)"}
                                </FormDescription>
                            )}
                             {initialData?.documents?.[index]?.filePath && !documentFiles.has(docItem.id) && (
                                 <FormDescription className="text-xs">
                                   <DocumentLink path={initialData.documents[index].filePath!} className="text-blue-600 hover:underline">
                                     View current uploaded file
                                   </DocumentLink>
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
