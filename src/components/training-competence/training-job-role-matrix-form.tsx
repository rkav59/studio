
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { TrainingCourse, TrainingJobRoleMatrixEntry } from "@/lib/types";
import { Save, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

const trainingJobRoleMatrixFormSchema = z.object({
  jobRole: z.string().min(2, "Job role name is required.").max(150),
  requiredCourseIds: z.array(z.string()).min(1, "At least one course must be selected."),
});

export type TrainingJobRoleMatrixFormValues = z.infer<typeof trainingJobRoleMatrixFormSchema>;

interface TrainingJobRoleMatrixFormProps {
  courses: TrainingCourse[];
  initialData?: TrainingJobRoleMatrixEntry | null;
  onSave: (data: TrainingJobRoleMatrixFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TrainingJobRoleMatrixForm({ courses, initialData, onSave, onCancel, isSubmitting }: TrainingJobRoleMatrixFormProps) {
  const isEditing = !!initialData;

  const form = useForm<TrainingJobRoleMatrixFormValues>({
    resolver: zodResolver(trainingJobRoleMatrixFormSchema),
    defaultValues: {
      jobRole: initialData?.jobRole || "",
      requiredCourseIds: initialData?.requiredCourseIds || [],
    },
  });

  const onSubmit = (data: TrainingJobRoleMatrixFormValues) => {
    onSave(data);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardDescription>
          {isEditing ? "Update the required training for this job role." : "Specify the job role and select the standard courses required."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="jobRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Electrician, Welder, Site Operative" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="requiredCourseIds"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base">Required Courses</FormLabel>
                    <FormDescription>Select all courses required for this job role.</FormDescription>
                  </div>
                  <Card className="max-h-60">
                    <ScrollArea className="h-full">
                      <CardContent className="p-3 space-y-1">
                        {courses.map((course) => (
                          <FormField
                            key={course.id}
                            control={form.control}
                            name="requiredCourseIds"
                            render={({ field }) => (
                              <FormItem
                                key={course.id}
                                className="flex flex-row items-center space-x-3 space-y-0 rounded-md p-2 hover:bg-muted/50 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(course.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), course.id])
                                        : field.onChange(field.value?.filter((value) => value !== course.id));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer flex-grow">
                                  {course.name} <span className="text-xs text-muted-foreground">({course.category || "Uncategorized"})</span>
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                        {courses.length === 0 && <p className="text-sm text-muted-foreground p-2 text-center">No courses available in the catalog.</p>}
                      </CardContent>
                    </ScrollArea>
                  </Card>
                  <FormMessage />
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
