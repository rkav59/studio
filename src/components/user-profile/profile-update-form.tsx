
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
import { Loader2, User as UserIcon, Globe, Save } from "lucide-react"; // Renamed User to UserIcon

const profileUpdateSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").max(50, "Display name too long."),
  country: z.string().min(2, "Country is required.").max(100, "Country name is too long."),
});

type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

interface ProfileUpdateFormProps {
  initialDisplayName: string;
  initialCountry: string;
  onUpdate: (data: ProfileUpdateFormValues) => void;
  isSubmitting: boolean;
}

export function ProfileUpdateForm({ initialDisplayName, initialCountry, onUpdate, isSubmitting }: ProfileUpdateFormProps) {
  const form = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: initialDisplayName,
      country: initialCountry,
    },
    mode: "onChange", // Enable revalidation on change
  });

  // Watch for changes to enable/disable save button
  const watchedDisplayName = form.watch("displayName");
  const watchedCountry = form.watch("country");
  const isChanged = watchedDisplayName !== initialDisplayName || watchedCountry !== initialCountry;


  const onSubmit = (data: ProfileUpdateFormValues) => {
    onUpdate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1 text-sm text-muted-foreground"><UserIcon className="h-4 w-4"/>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your display name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1 text-sm text-muted-foreground"><Globe className="h-4 w-4"/>Country of Operation</FormLabel>
              <FormControl>
                <Input placeholder="e.g., United States" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || !isChanged} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </form>
    </Form>
  );
}
