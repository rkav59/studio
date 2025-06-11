
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
import type { TrainingCourse } from "@/lib/types";
import { Save, XCircle } from "lucide-react";

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
}

export function CourseForm({ initialData, onSave, onCancel }: CourseFormProps) {
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
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{initialData ? "Edit Course" : "Add New Course"}</DialogTitle>
        <DialogDescription>
          {initialData ? "Update the details of this training course." : "Enter the details for the new training course."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onCancel}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
