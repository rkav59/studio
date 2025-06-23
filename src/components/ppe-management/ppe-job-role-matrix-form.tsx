
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { PpeItem, PpeJobRoleMatrixEntry, ManualRiskAssessment } from "@/lib/types";
import { Save, XCircle, Users, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";

const ppeJobRoleMatrixFormSchema = z.object({
  jobRole: z.string().min(2, "Job role name is required.").max(150),
  requiredPpeItemIds: z.array(z.string()).min(1, "At least one PPE item must be selected."),
  riskAssessmentId: z.string().optional(),
  riskAssessmentReference: z.string().optional(),
});

export type PpeJobRoleMatrixFormValues = z.infer<typeof ppeJobRoleMatrixFormSchema>;

interface PpeJobRoleMatrixFormProps {
  ppeItems: PpeItem[];
  riskAssessments: ManualRiskAssessment[];
  initialData?: PpeJobRoleMatrixEntry | null;
  onSave: (data: PpeJobRoleMatrixFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const NO_ASSESSMENT_VALUE = "__NONE__"; // Define a constant for the 'None' option

export function PpeJobRoleMatrixForm({ ppeItems, riskAssessments, initialData, onSave, onCancel, isSubmitting }: PpeJobRoleMatrixFormProps) {
  const isEditing = !!initialData;
  const form = useForm<PpeJobRoleMatrixFormValues>({
    resolver: zodResolver(ppeJobRoleMatrixFormSchema),
    defaultValues: {
      jobRole: initialData?.jobRole || "",
      requiredPpeItemIds: initialData?.requiredPpeItemIds || [],
      riskAssessmentId: initialData?.riskAssessmentId || undefined, // Set to undefined if null/undefined
      riskAssessmentReference: initialData?.riskAssessmentReference || "",
    },
  });
  
  const watchedRiskAssessmentId = form.watch("riskAssessmentId");

  useEffect(() => {
    if (watchedRiskAssessmentId && watchedRiskAssessmentId !== NO_ASSESSMENT_VALUE) {
      const selectedAssessment = riskAssessments.find(ra => ra.id === watchedRiskAssessmentId);
      if (selectedAssessment) {
        form.setValue("riskAssessmentReference", selectedAssessment.activityOrProcess);
      } else {
        form.setValue("riskAssessmentReference", undefined);
      }
    } else {
      form.setValue("riskAssessmentReference", undefined);
    }
  }, [watchedRiskAssessmentId, riskAssessments, form]);


  const onSubmit = (data: PpeJobRoleMatrixFormValues) => {
    // Before saving, convert the placeholder value back to undefined
    const dataToSave = {
      ...data,
      riskAssessmentId: data.riskAssessmentId === NO_ASSESSMENT_VALUE ? undefined : data.riskAssessmentId
    };
    onSave(dataToSave);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardDescription>
          {isEditing ? "Update the required PPE for this job role." : "Specify the job role and select the standard PPE items required."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            <FormField control={form.control} name="jobRole" render={({ field }) => (
              <FormItem><FormLabel>Job Role</FormLabel><FormControl><Input placeholder="e.g., Electrician, Welder, Site Operative" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            <FormField
              control={form.control}
              name="requiredPpeItemIds"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base">Required PPE Items</FormLabel>
                    <FormDescription>
                      Select all PPE items typically required for this job role.
                    </FormDescription>
                  </div>
                  <Card className="max-h-60">
                    <ScrollArea className="h-full">
                      <CardContent className="p-3 space-y-1">
                        {ppeItems.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="requiredPpeItemIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-center space-x-3 space-y-0 rounded-md p-2 hover:bg-muted/50 transition-colors"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer flex-grow">
                                    {item.name} <span className="text-xs text-muted-foreground">({item.type} - {item.category})</span>
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                        {ppeItems.length === 0 && <p className="text-sm text-muted-foreground p-2 text-center">No PPE items available in inventory.</p>}
                      </CardContent>
                    </ScrollArea>
                  </Card>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="riskAssessmentId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-1"><LinkIcon className="h-4 w-4"/>Risk Assessment Reference (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || NO_ASSESSMENT_VALUE}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a risk assessment" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value={NO_ASSESSMENT_VALUE}>None</SelectItem>
                            {riskAssessments.map(ra => (
                                <SelectItem key={ra.id} value={ra.id}>{ra.activityOrProcess} ({format(parseISO(ra.assessmentDate), 'PPP')})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>Link to the relevant risk assessment for context.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="riskAssessmentReference"
                render={({ field }) => (
                <FormItem className="hidden">
                    <FormControl>
                    <Input {...field} />
                    </FormControl>
                </FormItem>
                )}
            />

          </CardContent>
          <div className="p-6 border-t flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4" />Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSubmitting}><Save className="mr-2 h-4 w-4" />{isEditing ? "Save Changes" : "Define Requirements"}</Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
