
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Save, Trash2, XCircle } from "lucide-react";
import type { ChecklistTemplate, ChecklistItemTemplate } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";

const checklistItemTemplateSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Item text cannot be empty.").max(500, "Item text is too long."),
});

const templateFormSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters.").max(100, "Template name is too long."),
  items: z.array(checklistItemTemplateSchema).min(1, "A template must have at least one checklist item."),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TemplateFormProps {
  initialData?: Partial<ChecklistTemplate> | null;
  onSave: (data: TemplateFormValues) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function TemplateForm({ initialData, onSave, onCancel, isEditing }: TemplateFormProps) {
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      items: initialData?.items?.map(item => ({ ...item })) || [{ id: crypto.randomUUID(), text: "" }],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = (data: TemplateFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Checklist Template" : "Create New Checklist Template"}</CardTitle>
            <CardDescription>
              {isEditing ? "Modify the template name and its checklist items below." : "Define a name and add items for your new reusable checklist template."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly Workshop Inspection" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Checklist Items</FormLabel>
              <ScrollArea className="h-[300px] pr-3 border rounded-md">
                <div className="space-y-3 p-3">
                {fields.map((item, index) => (
                  <Card key={item.id} className="p-3 bg-secondary/30 shadow-sm">
                    <div className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.text`}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormLabel className="sr-only">Item {index + 1} Text</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`Enter text for item ${index + 1}`}
                                {...field}
                                rows={2}
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:bg-destructive/10 mt-1 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Item</span>
                      </Button>
                    </div>
                  </Card>
                ))}
                </div>
              </ScrollArea>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ id: crypto.randomUUID(), text: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
               <FormField name="items" control={form.control} render={() => <FormMessage />} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 pt-4 border-t">
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" /> {isEditing ? "Save Changes" : "Create Template"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
