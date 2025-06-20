
"use client"; 

import { useState, useEffect } from 'react';
import { OverviewCards, kpiInfoMap } from "@/components/dashboard/overview-cards";
import { KpiTrendChart } from "@/components/dashboard/kpi-trend-chart";
import { SuggestIndicatorForm } from "@/components/dashboard/suggest-indicator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, Settings, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { KpiThreshold } from '@/lib/types';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const mockLocations = ["All Locations", "Warehouse A", "Office Block", "Factory Floor", "Loading Bay"];
const mockCategories = ["All Categories", "Incident", "Near Miss", "Hazard"];

const KPI_THRESHOLDS_COLLECTION = 'kpiThresholds';

// Zod schema for a single threshold item
const kpiThresholdItemSchema = z.object({
  kpiKey: z.string(),
  title: z.string(),
  value: z.coerce.number().optional(), // Coerce to number, optional
  targetDirection: z.enum(['above', 'below']).optional(),
});

// Zod schema for the array of thresholds
const kpiThresholdsFormSchema = z.object({
  thresholds: z.array(kpiThresholdItemSchema),
});

type KpiThresholdsFormValues = z.infer<typeof kpiThresholdsFormSchema>;


export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(mockLocations[0]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(mockCategories[0]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const [kpiThresholds, setKpiThresholds] = useState<KpiThreshold[]>([]);
  const [isThresholdLoading, setIsThresholdLoading] = useState(true);
  const [isThresholdSaving, setIsThresholdSaving] = useState(false);
  
  // Prepare initial values for the threshold form based on kpiInfoMap
  const defaultThresholdFormValues: KpiThresholdsFormValues = {
    thresholds: Object.keys(kpiInfoMap).map(key => ({
      kpiKey: key,
      title: kpiInfoMap[key].title || key, // Use title from kpiInfoMap or key as fallback
      value: undefined,       // Default to undefined, will be populated by fetched data
      targetDirection: undefined, // Default to undefined
    })),
  };

  const thresholdForm = useForm<KpiThresholdsFormValues>({
    resolver: zodResolver(kpiThresholdsFormSchema),
    defaultValues: defaultThresholdFormValues,
  });

  const { fields: thresholdFields } = useFieldArray({
    control: thresholdForm.control,
    name: "thresholds",
  });

  // Fetch thresholds
  useEffect(() => {
    if (!user?.uid) return;
    const fetchThresholds = async () => {
      setIsThresholdLoading(true);
      try {
        const q = query(collection(db, KPI_THRESHOLDS_COLLECTION), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedThresholds: KpiThreshold[] = [];
        querySnapshot.forEach((docSnap) => {
          fetchedThresholds.push({ id: docSnap.id, ...docSnap.data() } as KpiThreshold);
        });
        setKpiThresholds(fetchedThresholds);

        // Update form default values with fetched thresholds
        const updatedFormValues = defaultThresholdFormValues.thresholds.map(defaultItem => {
          const matchingFetched = fetchedThresholds.find(ft => ft.kpiKey === defaultItem.kpiKey);
          return matchingFetched 
            ? { ...defaultItem, value: matchingFetched.value, targetDirection: matchingFetched.targetDirection }
            : defaultItem;
        });
        thresholdForm.reset({ thresholds: updatedFormValues });

      } catch (error) {
        console.error("Error fetching KPI thresholds:", error);
        toast({ title: "Error", description: "Could not load KPI thresholds.", variant: "destructive" });
      } finally {
        setIsThresholdLoading(false);
      }
    };
    fetchThresholds();
  }, [user?.uid, thresholdForm, toast]); // Added thresholdForm and toast to dependencies

  const onSaveThresholds = async (data: KpiThresholdsFormValues) => {
    if (!user?.uid) return;
    setIsThresholdSaving(true);
    try {
      const promises = data.thresholds
        .filter(item => item.value !== undefined && item.targetDirection !== undefined) // Only save if value and direction are set
        .map(async (item) => {
          const thresholdDocRef = doc(db, KPI_THRESHOLDS_COLLECTION, `${user.uid}_${item.kpiKey}`);
          const thresholdData: Omit<KpiThreshold, 'id'> = {
            userId: user.uid,
            kpiKey: item.kpiKey,
            value: item.value!, // Assert non-undefined because of filter
            targetDirection: item.targetDirection!, // Assert non-undefined
            lastUpdated: new Date().toISOString(),
          };
          await setDoc(thresholdDocRef, thresholdData, { merge: true });
        });
      await Promise.all(promises);
      toast({ title: "Success", description: "KPI thresholds saved." });
      // Refetch thresholds to update OverviewCards display
      const q = query(collection(db, KPI_THRESHOLDS_COLLECTION), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedThresholds: KpiThreshold[] = [];
      querySnapshot.forEach((docSnap) => {
          fetchedThresholds.push({ id: docSnap.id, ...docSnap.data() } as KpiThreshold);
      });
      setKpiThresholds(fetchedThresholds);
    } catch (error) {
      console.error("Error saving KPI thresholds:", error);
      toast({ title: "Error", description: "Could not save KPI thresholds.", variant: "destructive" });
    } finally {
      setIsThresholdSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
      </div>
      
      <OverviewCards kpiThresholds={kpiThresholds} isLoadingThresholds={isThresholdLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Incidents Overview</CardTitle>
            <CardDescription>Filter incidents by location, category, and date range.</CardDescription>
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 items-end">
                <div>
                  <Label htmlFor="location-filter" className="text-xs font-medium text-muted-foreground">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger id="location-filter" className="w-full">
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category-filter" className="text-xs font-medium text-muted-foreground">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category-filter" className="w-full">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                   <Label htmlFor="start-date-filter" className="text-xs font-medium text-muted-foreground">Start Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            id="start-date-filter"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="end-date-filter" className="text-xs font-medium text-muted-foreground">End Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            id="end-date-filter"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={(date) =>
                                startDate ? date < startDate : false
                              }
                            />
                        </PopoverContent>
                    </Popover>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[150px] w-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md">
              (Incident Chart Area - Data will be filtered based on selections above)
            </div>
          </CardContent>
        </Card>
        <KpiTrendChart />
      </div>
      
       {/* KPI Threshold Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/>KPI Threshold Settings</CardTitle>
          <CardDescription>Set your desired thresholds for dashboard KPIs. Lower values are generally better for rates/counts, higher for completion/attendance percentages.</CardDescription>
        </CardHeader>
        <CardContent>
          {isThresholdLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading thresholds...</p>
            </div>
          ) : (
            <Form {...thresholdForm}>
              <form onSubmit={thresholdForm.handleSubmit(onSaveThresholds)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                  {thresholdFields.map((field, index) => (
                    <Card key={field.id} className="p-3 bg-background shadow">
                       <h4 className="text-sm font-medium mb-2 text-primary">{field.title}</h4>
                        <div className="grid grid-cols-2 gap-3 items-end">
                            <FormField
                              control={thresholdForm.control}
                              name={`thresholds.${index}.value`}
                              render={({ field: itemField }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Threshold Value</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="any" placeholder="e.g., 2.0" {...itemField} value={itemField.value ?? ''} />
                                  </FormControl>
                                  <FormMessage className="text-xs"/>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={thresholdForm.control}
                              name={`thresholds.${index}.targetDirection`}
                              render={({ field: itemField }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Target Is</FormLabel>
                                  <Select onValueChange={itemField.onChange} value={itemField.value}>
                                    <FormControl>
                                      <SelectTrigger className="text-xs h-9">
                                        <SelectValue placeholder="Select direction" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="below">Lower is Better</SelectItem>
                                      <SelectItem value="above">Higher is Better</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs"/>
                                </FormItem>
                              )}
                            />
                        </div>
                    </Card>
                  ))}
                </div>
                <Button type="submit" disabled={isThresholdSaving} className="mt-6">
                  {isThresholdSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4"/> Save Thresholds
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> 
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest incidents and inspections.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                <div>
                  <p className="font-medium">Near Miss: Slips, Trips, and Falls</p>
                  <p className="text-sm text-muted-foreground">Warehouse A - 2 hours ago</p>
                </div>
                <span className="text-xs text-muted-foreground">View</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                <div>
                  <p className="font-medium">Inspection: Fire Safety Check</p>
                  <p className="text-sm text-muted-foreground">Office Block - Completed Yesterday</p>
                </div>
                <span className="text-xs text-muted-foreground">Details</span>
              </li>
               <li className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                <div>
                  <p className="font-medium">Hazard Reported: Damaged Guard Rail</p>
                  <p className="text-sm text-muted-foreground">Factory Floor, Line 3 - 3 days ago</p>
                </div>
                <span className="text-xs text-muted-foreground">View</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Safety Campaign: Zero Harm</CardTitle>
                <CardDescription>Focusing on proactive hazard identification this month.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative aspect-video max-h-[300px] overflow-hidden rounded-lg">
                    <Image 
                        src="https://placehold.co/800x450.png" 
                        alt="Safety campaign banner" 
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="safety meeting"
                    />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                    Join us in our commitment to a safer workplace. Report any potential hazards and participate in upcoming safety briefings.
                </p>
            </CardContent>
        </Card>
      </div>

      <SuggestIndicatorForm />

    </div>
  );
}

    