
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
// Removed Dialog imports
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle } from "lucide-react";
import type { EmergencyPlan } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


const planTypes = ['Evacuation', 'Fire Response', 'Medical Emergency', 'Spill Response', 'Other'] as const;

const emergencyPlanFormSchema = z.object({
  planName: z.string().min(3, "Plan name must be at least 3 characters.").max(150),
  planType: z.enum(planTypes, { required_error: "Please select a plan type." }),
  scope: z.string().min(3, "Scope/Area is required.").max(200),
  description: z.string().max(1000).optional(),
  keyPersonnelAndRoles: z.string().max(2000).optional(),
  emergencyProcedures: z.string().max(5000).optional(),
  evacuationRoutesDescription: z.string().max(2000).optional(),
  emergencyContacts: z.string().max(2000).optional(),
  equipmentNeeded: z.string().max(2000).optional(),
  lastReviewedDate: z.date().optional().nullable(),
  nextReviewDate: z.date().optional().nullable(),
});

type EmergencyPlanFormValues = z.infer<typeof emergencyPlanFormSchema>;

interface EmergencyPlanFormProps {
  initialData?: EmergencyPlan | null;
  onSave: (data: Omit<EmergencyPlan, 'id' | 'userId'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EmergencyPlanForm({ initialData, onSave, onCancel, isSubmitting }: EmergencyPlanFormProps) {
  const form = useForm<EmergencyPlanFormValues>({
    resolver: zodResolver(emergencyPlanFormSchema),
    defaultValues: {
      planName: initialData?.planName || "",
      planType: initialData?.planType || undefined,
      scope: initialData?.scope || "",
      description: initialData?.description || "",
      keyPersonnelAndRoles: initialData?.keyPersonnelAndRoles || "",
      emergencyProcedures: initialData?.emergencyProcedures || "",
      evacuationRoutesDescription: initialData?.evacuationRoutesDescription || "",
      emergencyContacts: initialData?.emergencyContacts || "",
      equipmentNeeded: initialData?.equipmentNeeded || "",
      lastReviewedDate: initialData?.lastReviewedDate && isValid(parseISO(initialData.lastReviewedDate)) ? parseISO(initialData.lastReviewedDate) : null,
      nextReviewDate: initialData?.nextReviewDate && isValid(parseISO(initialData.nextReviewDate)) ? parseISO(initialData.nextReviewDate) : null,
    },
  });

  const onSubmit = (data: EmergencyPlanFormValues) => {
    const planToSave: Omit<EmergencyPlan, 'id' | 'userId'> = { // Explicitly type to match onSave prop
        ...data,
        lastReviewedDate: data.lastReviewedDate ? data.lastReviewedDate.toISOString() : undefined,
        nextReviewDate: data.nextReviewDate ? data.nextReviewDate.toISOString() : undefined,
    };
    onSave(planToSave);
  };

  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
        <CardHeader>
             <CardDescription>
                {initialData ? "Update the details of this emergency plan." : "Fill in the details to create a new emergency plan."}
            </CardDescription>
        </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-6 space-y-5">
              <FormField
                control={form.control}
                name="planName"
                render={({ field }) => (
                  <FormItem className="mb-5">
                    <FormLabel>Plan Name / Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Office Fire Evacuation Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 mb-5">
                <FormField
                    control={form.control}
                    name="planType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Plan Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select plan type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {planTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Scope / Applicable Area</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Entire Facility, Warehouse B" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem  className="mb-5">
                    <FormLabel>General Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief overview of the plan's purpose." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keyPersonnelAndRoles"
                render={({ field }) => (
                  <FormItem  className="mb-5">
                    <FormLabel>Key Personnel & Roles (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., John Doe - Fire Warden, Jane Smith - First Aider" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyProcedures"
                render={({ field }) => (
                  <FormItem  className="mb-5">
                    <FormLabel>Emergency Procedures (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Step-by-step actions to take during the emergency." rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evacuationRoutesDescription"
                render={({ field }) => (
                  <FormItem  className="mb-5">
                    <FormLabel>Evacuation Routes Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe primary and secondary evacuation routes, assembly points." rows={3} {...field} />
                    </FormControl>
                    <FormDescription>Future updates may allow map uploads.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContacts"
                render={({ field }) => (
                  <FormItem  className="mb-5">
                    <FormLabel>Emergency Contact List (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Emergency Services: 911/112, Site Security: ext 500" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="equipmentNeeded"
                render={({ field }) => (
                  <FormItem  className="mb-5">
                    <FormLabel>Emergency Equipment Needed (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., First aid kits, Fire extinguishers, Spill kits, Flashlights" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 mb-5">
                <FormField
                    control={form.control}
                    name="lastReviewedDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Last Reviewed Date (Optional)</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="nextReviewDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Next Review Date (Optional)</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            </ScrollArea>
            <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Create Plan"}
                </Button>
            </div>
        </form>
      </Form>
    </Card>
  );
}

