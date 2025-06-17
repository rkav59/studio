
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
import type { PpeItem, PpeJobRoleMatrixEntry } from "@/lib/types";
import { Save, XCircle, Users, Link as LinkIcon } from "lucide-react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

const ppeJobRoleMatrixFormSchema = z.object({
  jobRole: z.string().min(2, "Job role name is required.").max(150),
  requiredPpeItemIds: z.array(z.string()).min(1, "At least one PPE item must be selected."),
  riskAssessmentReference: z.string().max(200).optional(),
});

export type PpeJobRoleMatrixFormValues = z.infer<typeof ppeJobRoleMatrixFormSchema>;

interface PpeJobRoleMatrixFormProps {
  ppeItems: PpeItem[];
  initialData?: PpeJobRoleMatrixEntry | null;
  onSave: (data: Omit<PpeJobRoleMatrixEntry, 'id'>) => void;
  onCancel: () => void;
}

export function PpeJobRoleMatrixForm({ ppeItems, initialData, onSave, onCancel }: PpeJobRoleMatrixFormProps) {
  const isEditing = !!initialData;
  const form = useForm<PpeJobRoleMatrixFormValues>({
    resolver: zodResolver(ppeJobRoleMatrixFormSchema),
    defaultValues: {
      jobRole: initialData?.jobRole || "",
      requiredPpeItemIds: initialData?.requiredPpeItemIds || [],
      riskAssessmentReference: initialData?.riskAssessmentReference || "",
    },
  });

  const onSubmit = (data: PpeJobRoleMatrixFormValues) => {
    onSave(data);
  };

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            {isEditing ? "Edit Job Role PPE Requirements" : "Define PPE for New Job Role"}
        </DialogTitle>
        <DialogDescription>
          {isEditing ? "Update the required PPE for this job role." : "Specify the job role and select the standard PPE items required."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <ScrollArea className="max-h-[65vh] pr-6 space-y-6">
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

            <FormField control={form.control} name="riskAssessmentReference" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><LinkIcon className="h-4 w-4"/>Risk Assessment Reference (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g., RA-005, Electrical Work RA" {...field} /></FormControl>
                <FormDescription>Link to the relevant risk assessment document or ID, if applicable.</FormDescription>
                <FormMessage />
              </FormItem>
            )}/>
          </ScrollArea>
          <DialogFooter className="pt-6 border-t mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onCancel}><XCircle className="mr-2 h-4 w-4" />Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Save className="mr-2 h-4 w-4" />{isEditing ? "Save Changes" : "Define Requirements"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
