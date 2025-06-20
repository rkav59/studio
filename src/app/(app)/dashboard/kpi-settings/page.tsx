
"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, Loader2 as FormLoader, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { KpiThreshold, KpiVisibilitySettings } from '@/lib/types';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { kpiInfoMap } from "@/components/dashboard/overview-cards";
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

const KPI_THRESHOLDS_COLLECTION = 'kpiThresholds';
const KPI_VISIBILITY_COLLECTION = 'kpiVisibilitySettings';

const kpiThresholdItemSchema = z.object({
  kpiKey: z.string(),
  title: z.string(),
  value: z.coerce.number({invalid_type_error: "Value must be a number."}).optional(),
  targetDirection: z.enum(['above', 'below'], {errorMap: () => ({ message: "Please select target direction." })}).optional(),
});

const kpiThresholdsFormSchema = z.object({
  thresholds: z.array(kpiThresholdItemSchema),
});

type KpiThresholdsFormValues = z.infer<typeof kpiThresholdsFormSchema>;

const kpiVisibilityItemSchema = z.object({
  kpiKey: z.string(),
  title: z.string(),
  isVisible: z.boolean(),
});

const kpiVisibilityFormSchema = z.object({
  visibilities: z.array(kpiVisibilityItemSchema),
});
type KpiVisibilityFormValues = z.infer<typeof kpiVisibilityFormSchema>;


export default function KpiSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultThresholdFormValues = useMemo<KpiThresholdsFormValues>(() => ({
    thresholds: Object.keys(kpiInfoMap).map(key => ({
      kpiKey: key,
      title: kpiInfoMap[key].title || key,
      value: undefined,
      targetDirection: kpiInfoMap[key].defaultTargetDirection,
    })),
  }), []);

  const defaultVisibilityFormValues = useMemo<KpiVisibilityFormValues>(() => ({
    visibilities: Object.keys(kpiInfoMap).map(key => ({
      kpiKey: key,
      title: kpiInfoMap[key].title || key,
      isVisible: true, // Default to visible
    })),
  }), []);

  const thresholdForm = useForm<KpiThresholdsFormValues>({
    resolver: zodResolver(kpiThresholdsFormSchema),
    defaultValues: defaultThresholdFormValues,
  });

  const visibilityForm = useForm<KpiVisibilityFormValues>({
    resolver: zodResolver(kpiVisibilityFormSchema),
    defaultValues: defaultVisibilityFormValues,
  });

  const { fields: thresholdFields } = useFieldArray({
    control: thresholdForm.control,
    name: "thresholds",
  });

  const { fields: visibilityFields } = useFieldArray({
    control: visibilityForm.control,
    name: "visibilities",
  });

  useEffect(() => {
    if (!user?.uid) return;
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Fetch Thresholds
        const thresholdQuery = query(collection(db, KPI_THRESHOLDS_COLLECTION), where("userId", "==", user.uid));
        const thresholdSnapshot = await getDocs(thresholdQuery);
        const fetchedThresholds: KpiThreshold[] = [];
        thresholdSnapshot.forEach((docSnap) => {
          fetchedThresholds.push({ id: docSnap.id, ...docSnap.data() } as KpiThreshold);
        });
        const updatedThresholdFormValues = defaultThresholdFormValues.thresholds.map(defaultItem => {
          const matchingFetched = fetchedThresholds.find(ft => ft.kpiKey === defaultItem.kpiKey);
          return matchingFetched 
            ? { ...defaultItem, value: matchingFetched.value, targetDirection: matchingFetched.targetDirection }
            : defaultItem;
        });
        thresholdForm.reset({ thresholds: updatedThresholdFormValues });

        // Fetch Visibility Settings
        const visibilityDocRef = doc(db, KPI_VISIBILITY_COLLECTION, user.uid);
        const visibilitySnap = await getDoc(visibilityDocRef);
        if (visibilitySnap.exists()) {
          const data = visibilitySnap.data() as Omit<KpiVisibilitySettings, 'id'>;
          const updatedVisibilityFormValues = defaultVisibilityFormValues.visibilities.map(defaultItem => ({
            ...defaultItem,
            isVisible: data.visibility[defaultItem.kpiKey] !== undefined ? data.visibility[defaultItem.kpiKey] : true,
          }));
          visibilityForm.reset({ visibilities: updatedVisibilityFormValues });
        } else {
          // If no settings found, all KPIs are visible by default (already set in defaultVisibilityFormValues)
          visibilityForm.reset(defaultVisibilityFormValues);
        }

      } catch (error) {
        console.error("Error fetching KPI settings:", error);
        toast({ title: "Error", description: "Could not load KPI settings.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [user?.uid, thresholdForm, visibilityForm, toast, defaultThresholdFormValues.thresholds, defaultVisibilityFormValues.visibilities]);


  const onSaveSettings = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      // Save Thresholds
      const thresholdData = thresholdForm.getValues();
      const thresholdPromises = thresholdData.thresholds
        .filter(item => item.value !== undefined && item.targetDirection !== undefined)
        .map(async (item) => {
          const thresholdDocRef = doc(db, KPI_THRESHOLDS_COLLECTION, `${user.uid}_${item.kpiKey}`);
          const thresholdItemData: Omit<KpiThreshold, 'id'> = {
            userId: user.uid,
            kpiKey: item.kpiKey,
            value: item.value!,
            targetDirection: item.targetDirection!,
            lastUpdated: new Date().toISOString(),
          };
          await setDoc(thresholdDocRef, thresholdItemData, { merge: true });
        });
      
      // Save Visibility Settings
      const visibilityData = visibilityForm.getValues();
      const visibilityMap: Record<string, boolean> = {};
      visibilityData.visibilities.forEach(item => {
        visibilityMap[item.kpiKey] = item.isVisible;
      });
      const visibilityDocRef = doc(db, KPI_VISIBILITY_COLLECTION, user.uid);
      const visibilitySettingsToSave: Omit<KpiVisibilitySettings, 'id'> = {
        userId: user.uid,
        visibility: visibilityMap,
        lastUpdated: new Date().toISOString(),
      };
      const visibilityPromise = setDoc(visibilityDocRef, visibilitySettingsToSave, { merge: true });

      await Promise.all([...thresholdPromises, visibilityPromise]);
      toast({ title: "Success", description: "KPI settings saved." });
    } catch (error) {
      console.error("Error saving KPI settings:", error);
      toast({ title: "Error", description: "Could not save KPI settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">KPI Settings</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <FormLoader className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading settings...</p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/>Configure Thresholds</CardTitle>
              <CardDescription>Set your desired thresholds for dashboard KPIs. Lower values are generally better for rates/counts, higher for completion/attendance percentages.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...thresholdForm}>
                <form id="thresholdsForm" className="space-y-6"> {/* No onSubmit here, handled by master button */}
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
                </form>
              </Form>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5"/>Configure KPI Visibility</CardTitle>
              <CardDescription>Select which KPIs you want to display on your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...visibilityForm}>
                <form id="visibilityForm" className="space-y-4"> {/* No onSubmit here */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {visibilityFields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={visibilityForm.control}
                        name={`visibilities.${index}.isVisible`}
                        render={({ field: itemField }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-background shadow">
                            <FormControl>
                              <Checkbox
                                checked={itemField.value}
                                onCheckedChange={itemField.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer hover:text-primary transition-colors">
                              {visibilityForm.getValues(`visibilities.${index}.title`)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <div className="mt-8 flex justify-end">
            <Button onClick={onSaveSettings} disabled={isSaving} className="min-w-[150px]">
              {isSaving && <FormLoader className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4"/> Save All Settings
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
