
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, XCircle, ArrowLeft } from "lucide-react";
import type { InductionQuestion } from "@/lib/types";

const questionFormSchema = z.object({
  text: z.string().min(10, "Question text must be at least 10 characters.").max(500),
  options: z.tuple([
    z.object({ id: z.literal('option1'), text: z.string().min(1, "Option 1 is required.") }),
    z.object({ id: z.literal('option2'), text: z.string().min(1, "Option 2 is required.") }),
    z.object({ id: z.literal('option3'), text: z.string().min(1, "Option 3 is required.") }),
  ]),
  correctAnswerId: z.enum(['option1', 'option2', 'option3'], { required_error: "You must select a correct answer." }),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface InductionQuestionFormProps {
  initialData?: InductionQuestion | null;
  onSave: (data: QuestionFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function InductionQuestionForm({ initialData, onSave, onCancel, isSubmitting }: InductionQuestionFormProps) {
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: initialData ? {
        text: initialData.text,
        options: initialData.options,
        correctAnswerId: initialData.correctAnswerId,
    } : {
      text: "",
      options: [
        { id: 'option1', text: '' },
        { id: 'option2', text: '' },
        { id: 'option3', text: '' },
      ],
      correctAnswerId: undefined,
    },
  });

  const onSubmit = (data: QuestionFormValues) => {
    onSave(data);
  };
  
  const isEditing = !!initialData;

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={onCancel} aria-label="Back to Settings"><ArrowLeft className="h-4 w-4" /></Button>
             <h1 className="text-2xl font-semibold tracking-tight">{isEditing ? 'Edit Induction Question' : 'Add New Induction Question'}</h1>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardDescription>
                Enter the question text, provide three distinct options, and select the correct answer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="text" render={({ field }) => (
                <FormItem><FormLabel>Question Text</FormLabel><FormControl><Textarea placeholder="e.g., What is the first action to take upon hearing a continuous fire alarm?" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="space-y-3">
                 <FormField control={form.control} name="options.0.text" render={({ field }) => (
                    <FormItem><FormLabel>Option 1</FormLabel><FormControl><Input placeholder="Enter text for the first option" {...field} /></FormControl><FormMessage /></FormItem>
                 )}/>
                 <FormField control={form.control} name="options.1.text" render={({ field }) => (
                    <FormItem><FormLabel>Option 2</FormLabel><FormControl><Input placeholder="Enter text for the second option" {...field} /></FormControl><FormMessage /></FormItem>
                 )}/>
                 <FormField control={form.control} name="options.2.text" render={({ field }) => (
                    <FormItem><FormLabel>Option 3</FormLabel><FormControl><Input placeholder="Enter text for the third option" {...field} /></FormControl><FormMessage /></FormItem>
                 )}/>
              </div>

              <FormField control={form.control} name="correctAnswerId" render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Select the Correct Answer</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="option1" /></FormControl><FormLabel className="font-normal">Option 1</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="option2" /></FormControl><FormLabel className="font-normal">Option 2</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="option3" /></FormControl><FormLabel className="font-normal">Option 3</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}/>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4"/>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}><Save className="mr-2 h-4 w-4"/>{isEditing ? 'Save Changes' : 'Add Question'}</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
