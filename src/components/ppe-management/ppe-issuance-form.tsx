
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
import { CalendarIcon, Save, XCircle, PackagePlus, PackageMinus, HelpCircle } from "lucide-react";
import type { PpeItem, PpeIssuanceRecord } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';

const ppeIssuanceFormSchema = z.object({
  ppeItemId: z.string({ required_error: "Please select a PPE item." }),
  employeeName: z.string().min(2, "Employee name is required.").max(150),
  jobRole: z.string().max(100).optional(),
  issuedDate: z.string().refine(val => isValid(parseISO(val)), { message: "Issued date is required." }),
  quantityIssued: z.coerce.number().min(1, "Quantity must be at least 1.").int(),
  expectedReturnDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid expected return date" }),
  actualReturnDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid actual return date" }),
  conditionOnReturn: z.enum(['Good', 'Damaged', 'Lost']).optional(),
  notes: z.string().max(1000).optional(),
}).refine(data => !data.actualReturnDate || (data.actualReturnDate && data.issuedDate <= data.actualReturnDate), {
  message: "Return date cannot be before issued date.",
  path: ["actualReturnDate"],
});

type PpeIssuanceFormValues = z.infer<typeof ppeIssuanceFormSchema>;

interface PpeIssuanceFormProps {
  ppeItems: PpeItem[];
  initialData?: PpeIssuanceRecord | null;
  onSave: (data: Omit<PpeIssuanceRecord, 'id'>) => void;
  onCancel: () => void;
}

export function PpeIssuanceForm({ ppeItems, initialData, onSave, onCancel }: PpeIssuanceFormProps) {
  const form = useForm<PpeIssuanceFormValues>({
    resolver: zodResolver(ppeIssuanceFormSchema),
    defaultValues: {
      ppeItemId: initialData?.ppeItemId || (ppeItems.length > 0 ? ppeItems[0].id : ""),
      employeeName: initialData?.employeeName || "",
      jobRole: initialData?.jobRole || "",
      issuedDate: initialData?.issuedDate ? format(parseISO(initialData.issuedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      quantityIssued: initialData?.quantityIssued || 1,
      expectedReturnDate: initialData?.expectedReturnDate ? format(parseISO(initialData.expectedReturnDate), 'yyyy-MM-dd') : undefined,
      actualReturnDate: initialData?.actualReturnDate ? format(parseISO(initialData.actualReturnDate), 'yyyy-MM-dd') : undefined,
      conditionOnReturn: initialData?.conditionOnReturn || undefined,
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = (data: PpeIssuanceFormValues) => {
    const recordToSave = {
      ...data,
      issuedDate: parseISO(data.issuedDate).toISOString(),
      expectedReturnDate: data.expectedReturnDate ? parseISO(data.expectedReturnDate).toISOString() : undefined,
      actualReturnDate: data.actualReturnDate ? parseISO(data.actualReturnDate).toISOString() : undefined,
    };
    onSave(recordToSave);
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{initialData ? "Edit PPE Issuance Record" : "Log New PPE Issuance"}</DialogTitle>
        <DialogDescription>
          {initialData ? "Update details for this PPE issuance." : "Enter details for issuing PPE to an employee."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <ScrollArea className="max-h-[70vh] pr-6 space-y-6">
            <FormField control={form.control} name="ppeItemId" render={({ field }) => (
              <FormItem><FormLabel>PPE Item</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={ppeItems.length === 0}>
                  <FormControl><SelectTrigger><SelectValue placeholder={ppeItems.length === 0 ? "No PPE items in inventory" : "Select PPE item"} /></SelectTrigger></FormControl>
                  <SelectContent>{ppeItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name} (Stock: {item.currentStock})</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="employeeName" render={({ field }) => (
              <FormItem><FormLabel>Employee Name</FormLabel><FormControl><Input placeholder="Employee's full name" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="jobRole" render={({ field }) => (
                    <FormItem><FormLabel>Job Role (Optional)</FormLabel><FormControl><Input placeholder="e.g., Welder, Electrician" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="quantityIssued" render={({ field }) => (
                    <FormItem><FormLabel>Quantity Issued</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <FormField control={form.control} name="issuedDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Issued Date</FormLabel>
              <Popover><PopoverTrigger asChild><FormControl>
                  <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? format(parseISO(field.value), "PPP") : <span>Pick issued date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button></FormControl></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} /></PopoverContent>
              </Popover><FormMessage /></FormItem>
            )}/>

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

          </ScrollArea>
          <DialogFooter className="pt-6 border-t">
            <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}><XCircle className="mr-2 h-4 w-4" />Cancel</Button></DialogClose>
            <Button type="submit" className="bg-accent hover:bg-accent/90"><Save className="mr-2 h-4 w-4" />{initialData ? "Save Changes" : "Log Issuance"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

