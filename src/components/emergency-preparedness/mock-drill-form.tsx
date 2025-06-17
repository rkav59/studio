
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, Activity, PlusCircle, Trash2, ClipboardCheck, AlertTriangle, CheckCircle, ListChecksIcon, Sparkles, Loader2 } from "lucide-react";
import type { MockDrill, DrillActionItem, EmergencyPlan, DrillActionStatus } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardHeader as UiCardHeader, CardTitle as UiCardTitle, CardDescription as UiCardDescription } from "../ui/card"; 
import { Separator } from "../ui/separator";
import { generateDrillScenario, type GenerateDrillScenarioInput } from "@/ai/flows/generate-drill-scenario-flow";
import { useToast } from "@/hooks/use-toast";
import React from "react";


const drillTypes: MockDrill['drillType'][] = ['Evacuation', 'Fire', 'Medical', 'Spill', 'Security', 'Tabletop', 'Other'];
const drillStatuses: MockDrill['status'][] = ['Planned', 'Completed', 'Cancelled'];
const actionItemStatuses: DrillActionStatus[] = ['Open', 'In Progress', 'Completed', 'Deferred'];


const drillActionItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Action item description cannot be empty.").max(500),
  assignedTo: z.string().min(1, "Must assign to someone.").max(100),
  dueDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid due date" }),
  status: z.enum(actionItemStatuses, { required_error: "Action status is required." }),
});

const mockDrillFormSchema = z.object({
  drillName: z.string().min(3, "Drill name is required.").max(150),
  drillType: z.enum(drillTypes, { required_error: "Drill type is required." }),
  linkedPlanId: z.string().optional(),
  scheduledDate: z.string().refine(val => isValid(parseISO(val)), { message: "Scheduled date is required." }),
  actualDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid actual date" }),
  scenario: z.string().min(10, "Scenario description is required.").max(2000),
  participants: z.string().max(500).optional(),
  observations: z.string().max(2000).optional(),
  lessonsLearned: z.string().max(2000).optional(),
  actionItems: z.array(drillActionItemSchema).optional(),
  status: z.enum(drillStatuses, { required_error: "Drill status is required." }),
});

type MockDrillFormValues = z.infer<typeof mockDrillFormSchema>;

interface MockDrillFormProps {
  plans: EmergencyPlan[];
  initialData?: MockDrill | null;
  onSave: (data: Omit<MockDrill, 'id'>) => void;
  onCancel: () => void;
}

const newActionItemDefault = (): DrillActionItem => ({
  id: crypto.randomUUID(),
  description: "",
  assignedTo: "",
  dueDate: undefined,
  status: "Open",
});

export function MockDrillForm({ plans, initialData, onSave, onCancel }: MockDrillFormProps) {
  const { toast } = useToast();
  const [isScenarioLoading, setIsScenarioLoading] = React.useState(false);

  const form = useForm<MockDrillFormValues>({
    resolver: zodResolver(mockDrillFormSchema),
    defaultValues: {
      drillName: initialData?.drillName || "",
      drillType: initialData?.drillType || undefined,
      linkedPlanId: initialData?.linkedPlanId || undefined,
      scheduledDate: initialData?.scheduledDate ? format(parseISO(initialData.scheduledDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      actualDate: initialData?.actualDate ? format(parseISO(initialData.actualDate), 'yyyy-MM-dd') : undefined,
      scenario: initialData?.scenario || "",
      participants: initialData?.participants || "",
      observations: initialData?.observations || "",
      lessonsLearned: initialData?.lessonsLearned || "",
      actionItems: initialData?.actionItems || [],
      status: initialData?.status || 'Planned',
    },
  });

  const { fields: actionItemFields, append: appendActionItem, remove: removeActionItem } = useFieldArray({
    control: form.control,
    name: "actionItems",
  });

  const onSubmit = (data: MockDrillFormValues) => {
    const drillToSave = {
      ...data,
      scheduledDate: parseISO(data.scheduledDate).toISOString(),
      actualDate: data.actualDate ? parseISO(data.actualDate).toISOString() : undefined,
      actionItems: data.actionItems || [],
    };
    onSave(drillToSave);
  };

  const handleSuggestScenario = async () => {
    const drillType = form.getValues("drillType");
    const linkedPlanId = form.getValues("linkedPlanId");
    const currentDrillName = form.getValues("drillName");

    if (!drillType) {
      toast({
        title: "Drill Type Required",
        description: "Please select a drill type before generating a scenario.",
        variant: "destructive",
      });
      return;
    }

    setIsScenarioLoading(true);
    let planContext: Partial<GenerateDrillScenarioInput> = {};
    if (linkedPlanId) {
      const plan = plans.find(p => p.id === linkedPlanId);
      if (plan) {
        planContext = {
          planName: plan.planName,
          planType: plan.planType,
          planScope: plan.scope,
        };
      }
    }
    
    const input: GenerateDrillScenarioInput = {
      drillType,
      ...planContext,
      currentDrillName: currentDrillName || undefined,
    };

    try {
      const result = await generateDrillScenario(input);
      form.setValue("scenario", result.suggestedScenario);
      toast({
        title: "Scenario Suggested",
        description: "AI has generated a scenario. Please review and edit as needed.",
      });
    } catch (error) {
      console.error("Error generating scenario:", error);
      toast({
        title: "Error",
        description: "Failed to generate scenario. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScenarioLoading(false);
    }
  };


  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-teal-500" />
            {initialData ? "Edit Mock Drill Record" : "Schedule/Log New Mock Drill"}
        </DialogTitle>
        <DialogDescription>
          {initialData ? "Update the details of this mock drill." : "Enter details for scheduling or logging a mock drill."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
            <ScrollArea className="max-h-[70vh] pr-6 space-y-4">
              <FormField control={form.control} name="drillName" render={({ field }) => (
                <FormItem><FormLabel>Drill Name/Title</FormLabel><FormControl><Input placeholder="e.g., Q3 Fire Evacuation Drill - Main Office" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="drillType" render={({ field }) => (
                    <FormItem><FormLabel>Drill Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select drill type" /></SelectTrigger></FormControl>
                        <SelectContent>{drillTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="linkedPlanId" render={({ field }) => (
                    <FormItem><FormLabel>Linked Emergency Plan (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder={plans.length > 0 ? "Select plan" : "No plans available"} /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {plans.map(plan => <SelectItem key={plan.id} value={plan.id}>{plan.planName}</SelectItem>)}
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="scheduledDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Scheduled Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                    </Popover><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="actualDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Actual Date (if completed)</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                    </Popover><FormMessage /></FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Drill Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>{drillStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
              )}/>
              
              <FormField
                control={form.control}
                name="scenario"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Drill Scenario</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSuggestScenario}
                        disabled={isScenarioLoading || !form.watch("drillType")}
                        className="text-accent border-accent hover:bg-accent/10"
                      >
                        {isScenarioLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Suggest with AI
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea placeholder="Describe the scenario being simulated..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="participants" render={({ field }) => (
                <FormItem><FormLabel>Participants (Optional)</FormLabel><FormControl><Input placeholder="e.g., All Warehouse Staff, ERT Members, Floor Wardens" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="observations" render={({ field }) => (
                <FormItem><FormLabel>Observations during Drill (Optional)</FormLabel><FormControl><Textarea placeholder="Key observations, what went well, areas of confusion..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="lessonsLearned" render={({ field }) => (
                <FormItem><FormLabel>Lessons Learned (Optional)</FormLabel><FormControl><Textarea placeholder="Key takeaways and improvement points from the drill..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>

            {/* Action Items Section */}
            <Card className="bg-muted/30">
                <UiCardHeader>
                    <UiCardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-5 w-5"/>Action Items from Drill</UiCardTitle>
                    <UiCardDescription>Document any follow-up actions identified during or after the drill.</UiCardDescription>
                </UiCardHeader>
                <CardContent className="space-y-3">
                    {actionItemFields.map((item, index) => (
                        <Card key={item.id} className="p-3 bg-background shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <FormLabel className="text-sm font-medium">Action Item #{index + 1}</FormLabel>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeActionItem(index)} className="text-destructive h-6 w-6"><Trash2 className="h-4 w-4"/></Button>
                            </div>
                            <FormField control={form.control} name={`actionItems.${index}.description`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Description</FormLabel><FormControl><Textarea placeholder="Specific action required" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField control={form.control} name={`actionItems.${index}.assignedTo`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Assigned To</FormLabel><FormControl><Input placeholder="Name or Team" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`actionItems.${index}.dueDate`} render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel className="text-xs">Due Date (Optional)</FormLabel>
                                    <Popover><PopoverTrigger asChild><FormControl>
                                        <Button variant="outline" size="sm" className={cn("w-full pl-3 text-left font-normal text-xs", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick due date</span>} <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                        </Button></FormControl></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                                    </Popover><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <FormField control={form.control} name={`actionItems.${index}.status`} render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger className="text-xs"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                    <SelectContent>{actionItemStatuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                                </Select><FormMessage /></FormItem>
                            )}/>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendActionItem(newActionItemDefault())}><PlusCircle className="mr-2 h-4 w-4"/>Add Action Item</Button>
                    <FormField name="actionItems" control={form.control} render={() => <FormMessage />} />
                </CardContent>
            </Card>

            </ScrollArea>
            <DialogFooter className="pt-6 border-t mt-4">
                <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}><XCircle className="mr-2 h-4 w-4" /> Cancel</Button></DialogClose>
                <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white"><Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Save Drill"}</Button>
            </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

