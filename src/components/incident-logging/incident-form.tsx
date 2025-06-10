"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

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
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Incident } from "@/lib/types";

const incidentFormSchema = z.object({
  type: z.enum(["Incident", "Near Miss", "Hazard"], {
    required_error: "Please select an incident type.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  location: z.string().min(3, {
    message: "Location must be at least 3 characters.",
  }),
  timestamp: z.date({
    required_error: "A date and time of incident is required.",
  }),
  region: z.string().min(2, {
    message: "Region must be at least 2 characters.",
  }),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;

interface IncidentFormProps {
  onIncidentLogged: (incident: Incident) => void;
}

export function IncidentForm({ onIncidentLogged }: IncidentFormProps) {
  const { toast } = useToast();
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      type: undefined,
      description: "",
      location: "",
      timestamp: new Date(),
      region: "",
    },
  });

  async function onSubmit(data: IncidentFormValues) {
    // In a real app, this would be a server action to save to a database
    const newIncident: Incident = {
      id: new Date().toISOString(), // Simple ID generation
      ...data,
      timestamp: data.timestamp.toISOString(),
    };
    onIncidentLogged(newIncident); 
    
    toast({
      title: "Incident Logged",
      description: `${data.type} at ${data.location} has been successfully logged.`,
      variant: "default",
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type of Occurrence</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occurrence type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Incident">Incident</SelectItem>
                  <SelectItem value="Near Miss">Near Miss</SelectItem>
                  <SelectItem value="Hazard">Hazard</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed description of the occurrence..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Warehouse Section A, Machine XYZ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="timestamp"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date and Time of Occurrence</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP HH:mm")
                      ) : (
                        <span>Pick a date and time</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                  {/* Basic time input for simplicity, could be improved with a time picker component */}
                  <Input 
                    type="time" 
                    className="mt-2"
                    defaultValue={field.value ? format(field.value, "HH:mm") : ""}
                    onChange={(e) => {
                        const time = e.target.value;
                        const [hours, minutes] = time.split(':').map(Number);
                        const newDate = new Date(field.value || new Date());
                        newDate.setHours(hours);
                        newDate.setMinutes(minutes);
                        field.onChange(newDate);
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region/Site</FormLabel>
              <FormControl>
                <Input placeholder="e.g., North America, Site Alpha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Log Incident
        </Button>
      </form>
    </Form>
  );
}
