
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { CalendarIcon, Save, XCircle, PackagePlus, RotateCcw, HelpCircle } from "lucide-react";
import type { PpeItem, PpeIssuanceRecord, PpeJobRoleMatrixEntry } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMemo, useEffect } from "react";

const ppeIssuanceFormSchema = z.object({
  ppeItemId: z.string({ required_error: "Please select a PPE item." }).min(1, "Please select a PPE item."),
  employeeName: z.string().min(2, "Employee name is required.").max(150),
  jobRole: z.string().optional(),
  issuedDate: z.date({ required_error: "Issued date is required." }),
  quantityIssued: z.coerce.number().min(1, "Quantity must be at least 1.").int(),
  notes: z.string().max(1000).optional(),
  expectedReturnDate: z.date().nullable().optional(),
  actualReturnDate: z.date().nullable().optional(),
  returnNotes: z.string().max(1000).optional(),
}).refine(data => !data.actualReturnDate || !data.expectedReturnDate || data.actualReturnDate >= data.expectedReturnDate, {
    message: "Actual return date cannot be before the expected return date.",
    path: ["actualReturnDate"],
});


export type PpeIssuanceFormValues = z.infer<typeof ppeIssuanceFormSchema>;

interface PpeIssuanceFormProps {
  ppeItems: PpeItem[];
  ppeJobRoleMatrix: PpeJobRoleMatrixEntry[];
  initialData?: PpeIssuanceRecord | null;
  onSave: (data: PpeIssuanceFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const NO_ROLE_VALUE = "__NONE__";

export function PpeIssuanceForm({ ppeItems, ppeJobRoleMatrix, initialData, onSave, onCancel, isSubmitting }: PpeIssuanceFormProps) {
  const isEditing = !!initialData?.id;

  const availableItemsForRole = (role?: string) => {
    const baseAvailableItems = ppeItems.filter(item => 
        (item.status || 'Available') === 'Available' || item.id === initialData?.ppeItemId
    );
    if (role && role !== NO_ROLE_VALUE) {
        const roleMatrixEntry = ppeJobRoleMatrix.find(r => r.jobRole === role);
        if (roleMatrixEntry) {
            const requiredIds = roleMatrixEntry.requiredPpeItemIds;
            return baseAvailableItems.filter(item => requiredIds.includes(item.id));
        }
        return [];
    }
    return baseAvailableItems;
  };
  
  const form = useForm<PpeIssuanceFormValues>({
    resolver: zodResolver(ppeIssuanceFormSchema),
    defaultValues: {
      ppeItemId: initialData?.ppeItemId || (availableItemsForRole(initialData?.jobRole).length > 0 ? availableItemsForRole(initialData?.jobRole)[0].id : ""),
      employeeName: initialData?.employeeName || "",
      jobRole: initialData?.jobRole || NO_ROLE_VALUE,
      issuedDate: initialData?.issuedDate ? parseISO(initialData.issuedDate) : new Date(),
      quantityIssued: initialData?.quantityIssued || 1,
      notes: initialData?.notes || "",
      expectedReturnDate: initialData?.expectedReturnDate ? parseISO(initialData.expectedReturnDate) : null,
      actualReturnDate: initialData?.actualReturnDate ? parseISO(initialData.actualReturnDate) : null,
      returnNotes: initialData?.returnNotes || "",
    },
  });
  
  const watchedJobRole = form.watch("jobRole");

  const availablePpeItems = useMemo(() => {
    return availableItemsForRole(watchedJobRole);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ppeItems, initialData?.ppeItemId, watchedJobRole, ppeJobRoleMatrix]);

  useEffect(() => {
    const currentPpeId = form.getValues("ppeItemId");
    if (!availablePpeItems.some(item => item.id === currentPpeId)) {
        form.setValue("ppeItemId", availablePpeItems.length > 0 ? availablePpeItems[0].id : "");
    }
  }, [watchedJobRole, availablePpeItems, form]);


  const onSubmit = (data: PpeIssuanceFormValues) => {
    const dataToSave = {
        ...data,
        jobRole: data.jobRole === NO_ROLE_VALUE ? undefined : data.jobRole,
    };
    onSave(dataToSave);
  };

  return (
     <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-accent" />
            {isEditing ? "Edit PPE Issuance Record" : "Log New PPE Issuance"}
        </CardTitle>
        <CardDescription>
          {isEditing ? "Update details for this PPE issuance." : "Enter details for issuing PPE to an employee."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 p-4 md:p-6">
              <FormField control={form.control} name="employeeName" render={({ field }) => (
                <FormItem><FormLabel>Employee Name</FormLabel><FormControl><Input placeholder="Employee's full name" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              
              <FormField
                control={form.control}
                name="jobRole"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Job Role (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || NO_ROLE_VALUE}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a job role to filter PPE" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value={NO_ROLE_VALUE}>None (Show All PPE)</SelectItem>
                        {ppeJobRoleMatrix.map(role => (
                        <SelectItem key={role.id} value={role.jobRole}>{role.jobRole}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormDescription>Filters the PPE list below.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />

              <FormField control={form.control} name="ppeItemId" render={({ field }) => (
                <FormItem><FormLabel>PPE Item</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={availablePpeItems.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder={availablePpeItems.length === 0 ? "No available PPE items for this role" : "Select PPE item"} /></SelectTrigger></FormControl>
                    <SelectContent>
                        {availablePpeItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name} (Stock: {item.currentStock})</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )}/>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="quantityIssued" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>Quantity Issued</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="issuedDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Issued Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick issued date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                    </Popover><FormMessage /></FormItem>
                )}/>
              </div>

              <Separator className="my-4" />
              
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional notes for this issuance..." rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>

              <Separator className="my-4" />
              <div>
                <h3 className="text-md font-medium text-muted-foreground mb-2">Return Details (Optional)</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="expectedReturnDate" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>Expected Return Date</FormLabel>
                      <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick expected return date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="actualReturnDate" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>Actual Return Date</FormLabel>
                      <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick actual return date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover><FormMessage /></FormItem>
                    )}/>
                  </div>
                  <FormField control={form.control} name="returnNotes" render={({ field }) => (
                      <FormItem><FormLabel>Return Notes (Optional)</FormLabel>
                      <FormControl>
                          <Textarea placeholder="Condition of returned item, any issues noted..." rows={2} {...field} />
                      </FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
              </div>
            </CardContent>
          </ScrollArea>
          <div className="p-4 md:p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4" />Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}><Save className="mr-2 h-4 w-4" />{isEditing ? "Save Changes" : "Log Issuance"}</Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
