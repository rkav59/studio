
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
import { CalendarIcon, Save, XCircle, PackagePlus } from "lucide-react";
import type { PpeItem, PpeIssuanceRecord, PpeJobRoleMatrixEntry } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMemo, useEffect } from "react";

const ppeIssuanceFormSchema = z.object({
  ppeItemId: z.string({ required_error: "Please select a PPE item." }).min(1, "Please select a PPE item."),
  employeeName: z.string().min(2, "Employee name is required.").max(150),
  jobRole: z.string().optional(),
  issuedDate: z.string().refine(val => isValid(parseISO(val)), { message: "Issued date is required." }),
  quantityIssued: z.coerce.number().min(1, "Quantity must be at least 1.").int(),
  expectedReturnDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid expected return date" }),
  actualReturnDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid actual return date" }),
  conditionOnReturn: z.enum(['Good', 'Damaged', 'Lost']).optional(),
  notes: z.string().max(1000).optional(),
}).refine(data => {
    if (!data.actualReturnDate || !data.issuedDate) {
        return true; // No dates to compare or one is missing
    }
    const issueDate = parseISO(data.issuedDate);
    const returnDate = parseISO(data.actualReturnDate);
    // Let individual field validators handle invalid date strings
    if (!isValid(issueDate) || !isValid(returnDate)) {
        return true;
    }
    return returnDate >= issueDate;
}, {
    message: "Return date cannot be before issued date.",
    path: ["actualReturnDate"],
});


export type PpeIssuanceFormValues = z.infer<typeof ppeIssuanceFormSchema>;

interface PpeIssuanceFormProps {
  ppeItems: PpeItem[];
  ppeJobRoleMatrix: PpeJobRoleMatrixEntry[];
  initialData?: PpeIssuanceRecord | null;
  onSave: (data: PpeIssuanceFormValues) => void;
  isSubmitting?: boolean;
}

const NO_ROLE_VALUE = "__NONE__";

export function PpeIssuanceForm({ ppeItems, ppeJobRoleMatrix, initialData, onSave, isSubmitting }: PpeIssuanceFormProps) {
  const isEditing = !!initialData;
  const form = useForm<PpeIssuanceFormValues>({
    resolver: zodResolver(ppeIssuanceFormSchema),
    defaultValues: {
      ppeItemId: initialData?.ppeItemId || undefined,
      employeeName: initialData?.employeeName || "",
      jobRole: initialData?.jobRole || NO_ROLE_VALUE,
      issuedDate: initialData?.issuedDate ? format(parseISO(initialData.issuedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      quantityIssued: initialData?.quantityIssued || 1,
      expectedReturnDate: initialData?.expectedReturnDate ? format(parseISO(initialData.expectedReturnDate), 'yyyy-MM-dd') : undefined,
      actualReturnDate: initialData?.actualReturnDate ? format(parseISO(initialData.actualReturnDate), 'yyyy-MM-dd') : undefined,
      conditionOnReturn: initialData?.conditionOnReturn || undefined,
      notes: initialData?.notes || "",
    },
  });
  
  const watchedJobRole = form.watch("jobRole");

  const availablePpeItems = useMemo(() => {
    const baseAvailableItems = ppeItems.filter(item => 
        (item.status || 'Available') === 'Available' || item.id === initialData?.ppeItemId
    );

    if (watchedJobRole && watchedJobRole !== NO_ROLE_VALUE) {
        const roleMatrixEntry = ppeJobRoleMatrix.find(role => role.jobRole === watchedJobRole);
        if (roleMatrixEntry) {
            const requiredIds = roleMatrixEntry.requiredPpeItemIds;
            return baseAvailableItems.filter(item => requiredIds.includes(item.id));
        }
    }
    
    return baseAvailableItems;
  }, [ppeItems, initialData?.ppeItemId, watchedJobRole, ppeJobRoleMatrix]);

  useEffect(() => {
    // When job role changes, check if the currently selected PPE item is still valid.
    // If not, reset it. This prevents an invalid state.
    const currentPpeId = form.getValues("ppeItemId");
    if (currentPpeId && !availablePpeItems.some(item => item.id === currentPpeId)) {
        form.setValue("ppeItemId", undefined as any);
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
                      <FormItem><FormLabel>Quantity Issued</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="issuedDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Issued Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick issued date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} /></PopoverContent>
                    </Popover><FormMessage /></FormItem>
                )}/>
              </div>

              <Separator className="my-4" />
              <h3 className="text-md font-medium text-muted-foreground">Return Details (Optional)</h3>

              <FormField control={form.control} name="expectedReturnDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Expected Return Date</FormLabel>
                <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick expected return date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} /></PopoverContent>
                </Popover><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="actualReturnDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Actual Return Date</FormLabel>
                <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick actual return date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} /></PopoverContent>
                </Popover><FormMessage /></FormItem>
              )}/>
              {form.watch("actualReturnDate") && (
                   <FormField control={form.control} name="conditionOnReturn" render={({ field }) => (
                      <FormItem><FormLabel>Condition on Return</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger></FormControl>
                          <SelectContent>
                              <SelectItem value="Good">Good</SelectItem>
                              <SelectItem value="Damaged">Damaged</SelectItem>
                              <SelectItem value="Lost">Lost</SelectItem>
                          </SelectContent>
                          </Select><FormMessage /></FormItem>
                  )}/>
              )}
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any additional notes for this issuance..." rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
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
