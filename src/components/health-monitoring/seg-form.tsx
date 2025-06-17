
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
import { Save, XCircle, Users } from "lucide-react";
import type { SimilarExposureGroup } from "@/lib/types";

const segFormSchema = z.object({
  name: z.string().min(2, "SEG name must be at least 2 characters.").max(150),
  description: z.string().max(500, "Description is too long.").optional(),
  riskProfileNotes: z.string().max(2000, "Risk profile notes are too long.").optional(),
});

type SegFormValues = z.infer<typeof segFormSchema>;

interface SegFormProps {
  initialData?: SimilarExposureGroup | null;
  onSave: (data: SegFormValues) => void;
  onCancel: () => void;
}

export function SegForm({ initialData, onSave, onCancel }: SegFormProps) {
  const form = useForm<SegFormValues>({
    resolver: zodResolver(segFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      riskProfileNotes: initialData?.riskProfileNotes || "",
    },
  });

  const onSubmit = (data: SegFormValues) => {
    onSave(data);
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {initialData ? "Edit Similar Exposure Group" : "Add New Similar Exposure Group"}
        </DialogTitle>
        <DialogDescription>
          {initialData ? "Update the SEG details." : "Define a new SEG for grouping employees with similar health exposures."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <ScrollArea className="max-h-[60vh] pr-4 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEG Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Welders - Workshop A, Office Admin Staff" {...field} />
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
                    <Textarea placeholder="Briefly describe the group and their common tasks or environment." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riskProfileNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Profile Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe typical exposures (e.g., noise, dust, chemicals), potential health risks, or required controls for this SEG." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </ScrollArea>
          <DialogFooter className="pt-6 border-t mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onCancel}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" /> {initialData ? "Save Changes" : "Add SEG"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
