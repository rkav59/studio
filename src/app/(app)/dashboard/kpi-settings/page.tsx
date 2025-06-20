
"use client";

import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, Loader2 as FormLoader, ArrowLeft } from "lucide-react"; // Renamed Loader2
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { KpiThreshold } from '@/lib/types';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { kpiInfoMap } from "@/components/dashboard/overview-cards"; // Import kpiInfoMap
import { useRouter } from 'next/navigation';

const KPI_THRESHOLDS_COLLECTION = 'kpiThresholds';

// Zod schema for a single threshold item
const kpiThresholdItemSchema = z.object({
  kpiKey: z.string(),
  title: z.string(),
  value: z.coerce.number({invalid_type_error: "Value must be a number."}).optional(),
  targetDirection: z.enum(['above', 'below'], {errorMap: () => ({ message: "Please select target direction." })}).optional(),
});

// Zod schema for the array of thresholds
const kpiThresholdsFormSchema = z.object({
  thresholds: z.array(kpiThresholdItemSchema),
});

type KpiThresholdsFormValues = z.infer<typeof kpiThresholdsFormSchema>;

export default function KpiSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isThresholdLoading, setIsThresholdLoading] = useState(true);
  const [isThresholdSaving, setIsThresholdSaving] = useState(false);
  
  // Prepare initial values for the threshold form based on kpiInfoMap
  const defaultThresholdFormValues: KpiThresholdsFormValues = {
    thresholds: Object.keys(kpiInfoMap).map(key => ({
      kpiKey: key,
      title: kpiInfoMap[key].title || key,
      value: undefined,
      targetDirection: kpiInfoMap[key].defaultTargetDirection, // Use default from kpiInfoMap
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
  }, [user?.uid, thresholdForm, toast, defaultThresholdFormValues.thresholds]);

  const onSaveThresholds = async (data: KpiThresholdsFormValues) => {
    if (!user?.uid) return;
    setIsThresholdSaving(true);
    try {
      const promises = data.thresholds
        .filter(item => item.value !== undefined && item.targetDirection !== undefined)
        .map(async (item) => {
          const thresholdDocRef = doc(db, KPI_THRESHOLDS_COLLECTION, `${user.uid}_${item.kpiKey}`);
          const thresholdData: Omit<KpiThreshold, 'id'> = {
            userId: user.uid,
            kpiKey: item.kpiKey,
            value: item.value!,
            targetDirection: item.targetDirection!,
            lastUpdated: new Date().toISOString(),
          };
          await setDoc(thresholdDocRef, thresholdData, { merge: true });
        });
      await Promise.all(promises);
      toast({ title: "Success", description: "KPI thresholds saved." });
    } catch (error) {
      console.error("Error saving KPI thresholds:", error);
      toast({ title: "Error", description: "Could not save KPI thresholds.", variant: "destructive" });
    } finally {
      setIsThresholdSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">KPI Threshold Settings</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/>Configure Thresholds</CardTitle>
          <CardDescription>Set your desired thresholds for dashboard KPIs. Lower values are generally better for rates/counts, higher for completion/attendance percentages.</CardDescription>
        </CardHeader>
        <CardContent>
          {isThresholdLoading ? (
            <div className="flex items-center justify-center p-4">
              <FormLoader className="h-6 w-6 animate-spin text-primary" />
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
                  {isThresholdSaving && <FormLoader className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4"/> Save Thresholds
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
