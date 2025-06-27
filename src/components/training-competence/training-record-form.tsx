
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import { CalendarIcon, Save, XCircle } from "lucide-react";
import type { TrainingCourse, TrainingRecord, TrainingRecordStatus, TrainingJobRoleMatrixEntry } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { useMemo, useEffect } from "react";

const trainingRecordFormSchema = z.object({
  employeeName: z.string().min(2, "Employee name is required.").max(150),
  jobRole: z.string().optional(),
  courseId: z.string({ required_error: "Please select a course." }),
  trainingDate: z.date({ required_error: "Training date is required." }),
  expiryDate: z.date().nullable().optional(),
  trainer: z.string().max(100).optional(),
  status: z.enum(['Planned', 'Completed'], { required_error: "Please select a status." }),
  certificateUrl: z.string().url("Must be a valid URL (e.g., https://example.com/cert.pdf)").max(500).or(z.literal("")).optional(),
  notes: z.string().max(2000).optional(),
});

type TrainingRecordFormValues = z.infer<typeof trainingRecordFormSchema>;

interface TrainingRecordFormProps {
  courses: TrainingCourse[];
  trainingJobRoleMatrix: TrainingJobRoleMatrixEntry[];
  initialData?: TrainingRecord | null;
  onSave: (data: Omit<TrainingRecord, 'id' | 'status' | 'userId'>, currentStatus: TrainingRecordStatus) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const NO_ROLE_VALUE = "__NONE__";

export function TrainingRecordForm({ courses, trainingJobRoleMatrix, initialData, onSave, onCancel, isSubmitting }: TrainingRecordFormProps) {
  const form = useForm<TrainingRecordFormValues>({
    resolver: zodResolver(trainingRecordFormSchema),
    defaultValues: {
      employeeName: initialData?.employeeName || "",
      jobRole: initialData?.jobRole || NO_ROLE_VALUE,
      courseId: initialData?.courseId || "",
      trainingDate: initialData?.trainingDate ? parseISO(initialData.trainingDate) : new Date(),
      expiryDate: initialData?.expiryDate ? parseISO(initialData.expiryDate) : null,
      trainer: initialData?.trainer || "",
      status: (initialData?.status === 'Planned' || initialData?.status === 'Completed') ? initialData.status : 'Planned',
      certificateUrl: initialData?.certificateUrl || "",
      notes: initialData?.notes || "",
    },
  });
  
  const watchedJobRole = useWatch({ control: form.control, name: "jobRole" });

  const availableCoursesForRole = useMemo(() => {
    if (watchedJobRole && watchedJobRole !== NO_ROLE_VALUE) {
      const roleMatrixEntry = trainingJobRoleMatrix.find(r => r.jobRole === watchedJobRole);
      if (roleMatrixEntry) {
        const requiredIds = new Set(roleMatrixEntry.requiredCourseIds);
        return courses.filter(course => requiredIds.has(course.id));
      }
      return []; // If role is selected but no matrix found, show no courses
    }
    return courses; // If no role selected, show all courses
  }, [watchedJobRole, trainingJobRoleMatrix, courses]);

  // Effect to reset courseId if the selected one is no longer in the available list
  useEffect(() => {
    const currentCourseId = form.getValues("courseId");
    if (currentCourseId && !availableCoursesForRole.some(c => c.id === currentCourseId)) {
      form.setValue("courseId", "");
    }
  }, [watchedJobRole, availableCoursesForRole, form]);


  const onSubmit = (data: TrainingRecordFormValues) => {
    const recordToSave = {
        employeeName: data.employeeName,
        jobRole: data.jobRole === NO_ROLE_VALUE ? undefined : data.jobRole,
        courseId: data.courseId,
        trainingDate: data.trainingDate.toISOString(),
        expiryDate: data.expiryDate ? data.expiryDate.toISOString() : null,
        trainer: data.trainer,
        certificateUrl: data.certificateUrl,
        notes: data.notes,
    };
    onSave(recordToSave, data.status as TrainingRecordStatus);
  };

  return (
    // Removed DialogContent wrapper
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        {/* Removed DialogHeader */}
        <ScrollArea className="flex-1 p-6 space-y-5"> {/* Added ScrollArea and padding */}
          <FormField
            control={form.control}
            name="employeeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full name of the employee" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Role (Optional)</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value || NO_ROLE_VALUE}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job role to filter courses" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_ROLE_VALUE}>None (Show All Courses)</SelectItem>
                    {trainingJobRoleMatrix.map(role => (
                      <SelectItem key={role.id} value={role.jobRole}>{role.jobRole}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormDescription>Filters the course list below based on requirements.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={availableCoursesForRole.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={availableCoursesForRole.length === 0 ? "No required/available courses for this role" : "Select a training course"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableCoursesForRole.map(course => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="trainingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Training Date</FormLabel>
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
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick an expiry date</span>}
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

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Record Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Set training status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Set to 'Planned' for upcoming training, or 'Completed' for finished training. 'Expired' or 'Requires Renewal' will be shown automatically based on Expiry Date.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trainer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trainer/Provider (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Name of trainer or training provider" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="certificateUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificate URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/path/to/certificate.pdf" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any additional notes about this training record..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ScrollArea>
        <div className="p-6 border-t flex justify-end gap-2 bg-background"> {/* Replaced DialogFooter */}
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Create Record"}
          </Button>
        </div>
      </form>
    </Form>
    // Removed DialogContent closing tag
  );
}
