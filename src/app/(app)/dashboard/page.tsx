
"use client"; 

import { useState, useEffect, useMemo } from 'react';
import { OverviewCards, kpiInfoMap } from "@/components/dashboard/overview-cards";
import { KpiTrendChart } from "@/components/dashboard/kpi-trend-chart";
import { SuggestIndicatorForm } from "@/components/dashboard/suggest-indicator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, Settings, Loader2 as PageLoader } from "lucide-react"; // Renamed Loader2
import { cn } from "@/lib/utils";
import { format } from "date-fns"; 
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // Added doc, getDoc
import type { KpiThreshold, KpiVisibilitySettings } from '@/lib/types';
import { useRouter } from 'next/navigation';


const mockLocations = ["All Locations", "Warehouse A", "Office Block", "Factory Floor", "Loading Bay"];
const mockCategories = ["All Categories", "Incident", "Near Miss", "Hazard"];

const KPI_THRESHOLDS_COLLECTION = 'kpiThresholds';
const KPI_VISIBILITY_COLLECTION = 'kpiVisibilitySettings'; // New collection name

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); 

  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(mockLocations[0]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(mockCategories[0]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const [kpiThresholds, setKpiThresholds] = useState<KpiThreshold[]>([]);
  const [kpiVisibility, setKpiVisibility] = useState<Record<string, boolean>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  

  // Fetch thresholds and visibility settings
  useEffect(() => {
    if (!user?.uid) return;
    const fetchAllSettings = async () => {
      setIsLoadingSettings(true);
      try {
        // Fetch Thresholds
        const thresholdQuery = query(collection(db, KPI_THRESHOLDS_COLLECTION), where("userId", "==", user.uid));
        const thresholdSnapshot = await getDocs(thresholdQuery);
        const fetchedThresholds: KpiThreshold[] = [];
        thresholdSnapshot.forEach((docSnap) => {
          fetchedThresholds.push({ id: docSnap.id, ...docSnap.data() } as KpiThreshold);
        });
        setKpiThresholds(fetchedThresholds);

        // Fetch Visibility Settings
        const visibilityDocRef = doc(db, KPI_VISIBILITY_COLLECTION, user.uid);
        const visibilitySnap = await getDoc(visibilityDocRef);
        if (visibilitySnap.exists()) {
          setKpiVisibility(visibilitySnap.data().visibility || {});
        } else {
          // Default to all visible if no settings found
          const defaultVisibility: Record<string, boolean> = {};
          Object.keys(kpiInfoMap).forEach(key => defaultVisibility[key] = true);
          setKpiVisibility(defaultVisibility);
        }

      } catch (error) {
        console.error("Error fetching KPI settings for dashboard:", error);
        toast({ title: "Error", description: "Could not load KPI settings.", variant: "destructive" });
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchAllSettings();
  }, [user?.uid, toast]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/kpi-settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Configure KPI Settings
        </Button>
      </div>
      
      <OverviewCards 
        kpiThresholds={kpiThresholds} 
        kpiVisibility={kpiVisibility}
        isLoadingSettings={isLoadingSettings} 
      />

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

    
