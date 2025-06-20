
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription as UiCardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, XCircle, PlusCircle, Trash2, Users, FileText, ClipboardList, Link as LinkIcon } from "lucide-react";
import type { SheMeeting, SheProgram, MeetingActionItem, SheMeetingType, MeetingActionItemStatus } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";


const meetingTypes: SheMeetingType[] = ['Safety Committee', 'Management Review', 'Toolbox Talk', 'Program Kick-off', 'Program Review', 'Other'];
const actionItemStatuses: MeetingActionItemStatus[] = ['Open', 'In Progress', 'Completed', 'Deferred'];

const NO_PROGRAM_VALUE = "NO_PROGRAM_SELECTED_BY_USER"; // Defined constant

const meetingActionItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Action item description is required.").max(500),
  assignedTo: z.string().min(1, "Must assign to someone.").max(100),
  dueDate: z.string().optional().refine(val => !val || isValid(parseISO(val)), { message: "Invalid due date" }),
  status: z.enum(actionItemStatuses, { required_error: "Action status is required." }),
});

const sheMeetingFormSchema = z.object({
  title: z.string().min(3, "Meeting title is required.").max(200),
  meetingDate: z.string().refine(val => isValid(parseISO(val)), { message: "Meeting date is required." }),
  meetingType: z.enum(meetingTypes, { required_error: "Meeting type is required." }),
  locationOrPlatform: z.string().min(2, "Location/Platform is required.").max(150),
  attendees: z.string().min(3, "Attendees list is required.").max(2000),
  agenda: z.string().max(3000).optional(),
  minutes: z.string().max(5000).optional(),
  actionItems: z.array(meetingActionItemSchema).optional(),
  linkedProgramId: z.string().optional(),
  linkedProgramName: z.string().optional(), // For display/reference, not directly user-editable
});

type SheMeetingFormValues = z.infer<typeof sheMeetingFormSchema>;

interface SheMeetingFormProps {
  programs: SheProgram[];
  initialData?: SheMeeting | null;
  onSave: (data: Omit<SheMeeting, 'id' | 'userId'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const newActionItemDefault = (): MeetingActionItem => ({
  id: crypto.randomUUID(),
  description: "",
  assignedTo: "",
  dueDate: undefined,
  status: "Open",
});

export function SheMeetingForm({ programs, initialData, onSave, onCancel, isSubmitting }: SheMeetingFormProps) {
  const form = useForm<SheMeetingFormValues>({
    resolver: zodResolver(sheMeetingFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      meetingDate: initialData?.meetingDate ? format(parseISO(initialData.meetingDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      meetingType: initialData?.meetingType || undefined,
      locationOrPlatform: initialData?.locationOrPlatform || "",
      attendees: initialData?.attendees || "",
      agenda: initialData?.agenda || "",
      minutes: initialData?.minutes || "",
      actionItems: initialData?.actionItems?.map(ai => ({...ai, dueDate: ai.dueDate ? format(parseISO(ai.dueDate), 'yyyy-MM-dd') : undefined})) || [],
      linkedProgramId: initialData?.linkedProgramId || NO_PROGRAM_VALUE, // Use defined constant for default if undefined
      linkedProgramName: initialData?.linkedProgramName || undefined,
    },
  });

  const { fields: actionItemFields, append: appendActionItem, remove: removeActionItem } = useFieldArray({
    control: form.control,
    name: "actionItems",
  });

  const watchedLinkedProgramId = form.watch("linkedProgramId");
  const currentMeetingStatus = initialData?.status; // Assuming SheMeeting has a status field if needed for more dynamic form

  useEffect(() => {
    if (watchedLinkedProgramId && watchedLinkedProgramId !== NO_PROGRAM_VALUE) {
      const selectedProgram = programs.find(p => p.id === watchedLinkedProgramId);
      form.setValue("linkedProgramName", selectedProgram?.programName);
    } else {
      form.setValue("linkedProgramName", undefined);
    }
  }, [watchedLinkedProgramId, programs, form]);


  const onSubmit = (data: SheMeetingFormValues) => {
    const meetingToSave: Omit<SheMeeting, 'id' | 'userId'> = {
        ...data,
        meetingDate: parseISO(data.meetingDate).toISOString(),
        actionItems: (data.actionItems || []).map(ai => ({...ai, dueDate: ai.dueDate ? parseISO(ai.dueDate).toISOString() : undefined })),
        linkedProgramId: data.linkedProgramId === NO_PROGRAM_VALUE ? undefined : data.linkedProgramId,
        // linkedProgramName is already set by useEffect
    };
    onSave(meetingToSave);
  };

  const isSchedulingPhase = !initialData || (initialData && (initialData as any).status === 'Planned'); // A simple way to check phase


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
            <CardContent className="p-6 space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Meeting Title</FormLabel><FormControl><Input placeholder="e.g., Monthly Safety Committee Meeting" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="meetingDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Meeting Date</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} initialFocus/></PopoverContent>
                        </Popover><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="meetingType" render={({ field }) => (
                        <FormItem><FormLabel>Meeting Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select meeting type" /></SelectTrigger></FormControl>
                        <SelectContent>{meetingTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="locationOrPlatform" render={({ field }) => (
                    <FormItem><FormLabel>Location / Platform</FormLabel><FormControl><Input placeholder="e.g., Main Conference Room, Microsoft Teams" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="attendees" render={({ field }) => (
                    <FormItem><FormLabel>Attendees</FormLabel><FormControl><Textarea placeholder="List attendees, use comma or new line separation." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="linkedProgramId" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><LinkIcon className="h-4 w-4"/>Linked SHE Program (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || NO_PROGRAM_VALUE}>
                        <FormControl><SelectTrigger><SelectValue placeholder={programs.length > 0 ? "Link to a program" : "No programs available"} /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value={NO_PROGRAM_VALUE}>None</SelectItem>
                            {programs.map(prog => <SelectItem key={prog.id} value={prog.id}>{prog.programName} ({prog.programType})</SelectItem>)}
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>


                <Separator className="my-6"/>
                <h3 className="text-lg font-medium text-muted-foreground">Meeting Content {isSchedulingPhase && <span className="text-sm font-normal text-muted-foreground/80">(Typically filled after meeting)</span>}</h3>

                <FormField control={form.control} name="agenda" render={({ field }) => (
                    <FormItem><FormLabel>Agenda</FormLabel><FormControl><Textarea placeholder="Key topics and agenda items..." rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="minutes" render={({ field }) => (
                    <FormItem><FormLabel>Minutes / Key Discussion Points</FormLabel><FormControl><Textarea placeholder="Summary of discussions, decisions made..." rows={6} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                <Separator className="my-6"/>
                <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-md flex items-center gap-2">
                            <ClipboardList className="h-5 w-5"/>Action Items {isSchedulingPhase && <span className="text-sm font-normal text-muted-foreground/80">(Typically added during/after meeting)</span>}
                        </CardTitle>
                        <UiCardDescription>Track follow-up actions arising from the meeting.</UiCardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {actionItemFields.map((item, index) => (
                            <Card key={item.id} className="p-3 bg-background shadow-sm space-y-3">
                                <div className="flex justify-between items-center"><FormLabel className="text-sm font-medium">Action Item #{index + 1}</FormLabel><Button type="button" variant="ghost" size="icon" onClick={() => removeActionItem(index)} className="text-destructive h-6 w-6"><Trash2 className="h-4 w-4"/></Button></div>
                                <FormField control={form.control} name={`actionItems.${index}.description`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Description</FormLabel><FormControl><Textarea placeholder="Specific action required" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <FormField control={form.control} name={`actionItems.${index}.assignedTo`} render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Assigned To</FormLabel><FormControl><Input placeholder="Name or Team" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`actionItems.${index}.dueDate`} render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel className="text-xs">Due Date (Optional)</FormLabel>
                                        <Popover><PopoverTrigger asChild><FormControl>
                                            <Button variant="outline" size="sm" className={cn("w-full pl-3 text-left font-normal text-xs", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>} <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                            </Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? parseISO(field.value) : undefined} onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd"):"")} /></PopoverContent>
                                        </Popover><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`actionItems.${index}.status`} render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="text-xs"><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                                            <SelectContent>{actionItemStatuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            </Card>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendActionItem(newActionItemDefault())}><PlusCircle className="mr-2 h-4 w-4"/>Add Action Item</Button>
                        <FormField name="actionItems" control={form.control} render={() => <FormMessage />} />
                    </CardContent>
                </Card>
            </CardContent>
        </ScrollArea>
        <div className="p-6 border-t flex-shrink-0 flex justify-end gap-2 bg-background">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Create Meeting Log"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

