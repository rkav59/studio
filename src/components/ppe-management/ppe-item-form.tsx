
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PpeItem } from "@/lib/types";
import { Save, XCircle, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";

const ppeItemFormSchema = z.object({
  name: z.string().min(2, "Name is required.").max(150),
  type: z.string().min(2, "Type is required.").max(100),
  category: z.string().min(2, "Category is required.").max(100),
  specifications: z.string().max(1000).optional(),
  currentStock: z.coerce.number().min(0, "Stock cannot be negative.").int(),
  reorderLevel: z.coerce.number().min(0, "Reorder level cannot be negative.").int(),
  supplier: z.string().max(100).optional(),
  lastStocktakeDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid stocktake date" }),
});

type PpeItemFormValues = z.infer<typeof ppeItemFormSchema>;

interface PpeItemFormProps {
  initialData?: PpeItem | null;
  onSave: (data: Omit<PpeItem, 'id'>) => void;
  onCancel: () => void;
}

export function PpeItemForm({ initialData, onSave, onCancel }: PpeItemFormProps) {
  const form = useForm<PpeItemFormValues>({
    resolver: zodResolver(ppeItemFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "",
      category: initialData?.category || "",
      specifications: initialData?.specifications || "",
      currentStock: initialData?.currentStock || 0,
      reorderLevel: initialData?.reorderLevel || 0,
      supplier: initialData?.supplier || "",
      lastStocktakeDate: initialData?.lastStocktakeDate ? format(parseISO(initialData.lastStocktakeDate), 'yyyy-MM-dd') : undefined,
    },
  });

  const onSubmit = (data: PpeItemFormValues) => {
    const itemToSave = {
      ...data,
      lastStocktakeDate: data.lastStocktakeDate ? parseISO(data.lastStocktakeDate).toISOString() : undefined,
    };
    onSave(itemToSave);
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{initialData ? "Edit PPE Item" : "Add New PPE Item"}</DialogTitle>
        <DialogDescription>
          {initialData ? "Update details for this PPE item." : "Enter details for a new PPE item in your inventory."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <ScrollArea className="max-h-[70vh] pr-6 space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>PPE Name</FormLabel><FormControl><Input placeholder="e.g., Safety Helmet Class A" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="e.g., Hard Hat, Safety Glasses" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Head Protection" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="specifications" render={({ field }) => (
              <FormItem><FormLabel>Specifications (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., EN397, ANSI Z89.1, Size L, Color Blue" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="currentStock" render={({ field }) => (
                    <FormItem><FormLabel>Current Stock Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="reorderLevel" render={({ field }) => (
                    <FormItem><FormLabel>Reorder Level</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <FormField control={form.control} name="supplier" render={({ field }) => (
              <FormItem><FormLabel>Supplier (Optional)</FormLabel><FormControl><Input placeholder="Supplier name or contact" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="lastStocktakeDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Last Stocktake Date (Optional)</FormLabel>
                <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick stocktake date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")} /></PopoverContent>
                </Popover><FormMessage /></FormItem>
            )}/>
          </ScrollArea>
          <DialogFooter className="pt-6 border-t">
            <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}><XCircle className="mr-2 h-4 w-4" />Cancel</Button></DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90"><Save className="mr-2 h-4 w-4" />{initialData ? "Save Changes" : "Add PPE Item"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
