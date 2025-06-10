
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, AlertTriangle, Save, CheckCircle, XCircle, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SheqAudit, AuditChecklistItem, NonConformance } from "@/lib/types";

const auditChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Checklist item text cannot be empty.").max(1000, "Text too long"),
  status: z.enum(['Compliant', 'Non-Compliant', 'Not Applicable', 'Pending']),
  evidenceOrRemarks: z.string().max(1000, "Remarks too long.").optional(),
});

const nonConformanceSchema = z.object({
  id: z.string(),
  description: z.string().min(5, "Non-conformance description is required.").max(1000, "Description too long."),
  severity: z.enum(['Minor', 'Major', 'Critical']),
  relatedChecklistItemId: z.string().optional(),
  correctiveActions: z.string().optional().max(2000, "Corrective actions text too long"),
});

const auditExecutionFormSchema = z.object({
  checklist: z.array(auditChecklistItemSchema),
  nonConformances: z.array(nonConformanceSchema),
  overallFindings: z.string().max(5000, "Overall findings too long.").optional(),
  recommendations: z.string().max(5000, "Recommendations too long.").optional(),
});

type AuditExecutionFormValues = z.infer<typeof auditExecutionFormSchema>;

interface AuditExecutionFormProps {
  audit: SheqAudit;
  onSaveAudit: (auditData: SheqAudit) => void;
}

export function AuditExecutionForm({ audit, onSaveAudit }: AuditExecutionFormProps) {
  const { toast } = useToast();
  
  const form = useForm<AuditExecutionFormValues>({
    resolver: zodResolver(auditExecutionFormSchema),
    defaultValues: {
      checklist: audit.checklist || [],
      nonConformances: audit.nonConformances || [],
      overallFindings: audit.overallFindings || "",
      recommendations: audit.recommendations || "",
    },
  });

  const { fields: checklistFields, update: updateChecklistItem, append: appendChecklistItem, remove: removeChecklistItem } = useFieldArray({
    control: form.control,
    name: "checklist",
  });

  const { fields: ncFields, append: appendNc, remove: removeNc } = useFieldArray({
    control: form.control,
    name: "nonConformances",
  });

  async function onSubmit(data: AuditExecutionFormValues) {
    const updatedAudit: SheqAudit = {
      ...audit,
      checklist: data.checklist,
      nonConformances: data.nonConformances,
      overallFindings: data.overallFindings,
      recommendations: data.recommendations,
      status: "Completed", 
    };
    onSaveAudit(updatedAudit);
    toast({
      title: "Audit Data Saved",
      description: `Audit findings for "${audit.auditName}" have been recorded.`,
    });
  }
  
  const handleAddNewChecklistItem = () => {
    appendChecklistItem({
      id: crypto.randomUUID(),
      text: "New checklist item (edit me)",
      status: 'Pending',
      evidenceOrRemarks: ''
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card>
          <CardHeader>
            <CardTitle>Audit Checklist</CardTitle>
            <CardDescription>Go through each item, edit as needed, update status, and add remarks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklistFields.map((item, index) => (
              <Card key={item.id} className="p-4 bg-secondary/40">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-grow mr-2">
                        <FormField
                            control={form.control}
                            name={`checklist.${index}.text`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="font-medium">Item {index + 1}</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="Checklist item description..." 
                                        {...field} 
                                        rows={2}
                                        className="bg-background"
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeChecklistItem(index)}
                        className="text-destructive hover:bg-destructive/10 mt-1"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Item</span>
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`checklist.${index}.status`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Compliant">Compliant</SelectItem>
                            <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                            <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`checklist.${index}.evidenceOrRemarks`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evidence/Remarks</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Note observations, evidence, or remarks..." rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNewChecklistItem}
                className="mt-4"
            >
                <PlusCircle className="mr-2 h-4 w-4"/> Add Checklist Item
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Non-Conformances (NCs)</CardTitle>
            <CardDescription>Log any deviations or non-conformances identified during the audit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ncFields.map((ncItem, index) => (
              <Card key={ncItem.id} className="p-4 relative bg-destructive/10 border-destructive/50">
                 <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeNc(index)} 
                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove NC</span>
                  </Button>
                <FormField
                  control={form.control}
                  name={`nonConformances.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="mb-2">
                      <FormLabel>NC Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the non-conformance observed..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name={`nonConformances.${index}.severity`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Minor">Minor</SelectItem>
                            <SelectItem value="Major">Major</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name={`nonConformances.${index}.relatedChecklistItemId`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Related Checklist Item (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Link to checklist item" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {form.watch("checklist").map((chkItem, chkIndex) => (
                                <SelectItem key={chkItem.id} value={chkItem.id}>
                                    Item {chkIndex + 1}: {chkItem.text.substring(0,50)}{chkItem.text.length > 50 ? '...' : ''}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name={`nonConformances.${index}.correctiveActions`}
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Immediate Actions Taken / Initial CAPA (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe any immediate actions taken or initial thoughts for CAPA..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendNc({ id: crypto.randomUUID(), description: "", severity: "Minor", relatedChecklistItemId: "", correctiveActions: "" })}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <AlertTriangle className="mr-2 h-4 w-4" /> Add Non-Conformance
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <Card>
            <CardHeader>
                <CardTitle>Overall Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                control={form.control}
                name="overallFindings"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Overall Audit Findings</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Summarize the key findings of the audit..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="recommendations"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Recommendations</FormLabel>
                    <FormControl>
                        <Textarea placeholder="List any recommendations for improvement..." rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
        </Card>
        
        <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" /> Save and Complete Audit
            </Button>
        </div>
      </form>
    </Form>
  );
}
