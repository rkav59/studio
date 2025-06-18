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
// Removed Dialog imports
import type { TrainingCourse } from "@/lib/types";
import { Save, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"; // Added ScrollArea

const courseFormSchema = z.object({
  name: z.string().min(3, "Course name must be at least 3 characters.").max(150, "Course name is too long."),
  description: z.string().max(1000, "Description is too long.").optional(),
  category: z.string().max(100, "Category name is too long.").optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  initialData?: TrainingCourse | null;
  onSave: (data: CourseFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean; // Added for button state
}

export function CourseForm({ initialData, onSave, onCancel, isSubmitting }: CourseFormProps) {
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
    },
  });

  const onSubmit = (data: CourseFormValues) => {
    onSave(data);
  };

  return (
    // Removed DialogContent wrapper
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
        {/* Removed DialogHeader */}
        <ScrollArea className="flex-1 p-6 space-y-6"> {/* Added ScrollArea and padding */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Advanced First Aid, Forklift Operation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Briefly describe the course content or objectives." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Safety Critical, Technical Skills, Compliance" {...field} />
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
          <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </form>
    </Form>
    // Removed DialogContent closing tag
  );
}
