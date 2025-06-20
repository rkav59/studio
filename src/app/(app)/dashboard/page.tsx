

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
import { CalendarIcon, Filter, Settings, Loader2 as PageLoader, Activity, Users as UsersIcon, CalendarClock, RefreshCw } from "lucide-react"; 
import { cn } from "@/lib/utils";
import { format, parseISO, startOfToday } from "date-fns"; 
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy } from 'firebase/firestore';
import type { KpiThreshold, KpiVisibilitySettings, SheProgram, SheMeeting } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';

const mockLocations = ["All Locations", "Warehouse A", "Office Block", "Factory Floor", "Loading Bay"];
const mockCategories = ["All Categories", "Incident", "Near Miss", "Hazard"];

const KPI_THRESHOLDS_COLLECTION = 'kpiThresholds';
const KPI_VISIBILITY_COLLECTION = 'kpiVisibilitySettings';
const PROGRAMS_COLLECTION = 'shePrograms';
const MEETINGS_COLLECTION = 'sheMeetings';

interface UpcomingEvent {
  id: string;
  type: 'Program' | 'Meeting';
  title: string;
  date: string; // ISO string for sorting
  dateDisplay: string; // Formatted for display
  icon: React.ElementType;
  path?: string;
}


export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); 
  const queryClient = useQueryClient();

  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(mockLocations[0]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(mockCategories[0]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const [kpiThresholds, setKpiThresholds] = useState<KpiThreshold[]>([]);
  const [kpiVisibility, setKpiVisibility] = useState<Record<string, boolean>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isRefreshingEvents, setIsRefreshingEvents] = useState(false);
  

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

  // Fetch Upcoming SHE Programs
  const { data: upcomingPrograms = [], isLoading: isLoadingPrograms, error: programsError } = useQuery<SheProgram[]>({
    queryKey: [PROGRAMS_COLLECTION, 'upcoming', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const today = Timestamp.fromDate(startOfToday());
      const q = query(
        collection(db, PROGRAMS_COLLECTION),
        where("userId", "==", user.uid),
        // We fetch both planned and ongoing. Filtering for 'endDate' if ongoing, or 'startDate' for planned will be done client-side
        // as Firestore doesn't support complex OR on different fields effectively.
        where("status", "in", ["Planned", "Ongoing"]),
        orderBy("startDate", "asc") 
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SheProgram))
        .filter(program => {
            const progStartDate = parseISO(program.startDate);
            if (program.status === 'Planned') {
                return progStartDate >= startOfToday();
            }
            if (program.status === 'Ongoing') {
                // Include ongoing programs unless their end date has passed
                return !program.endDate || parseISO(program.endDate) >= startOfToday();
            }
            return false;
        });
    },
    enabled: !!user?.uid,
  });

  // Fetch Upcoming SHE Meetings
  const { data: upcomingMeetingsData = [], isLoading: isLoadingMeetings, error: meetingsError } = useQuery<SheMeeting[]>({
    queryKey: [MEETINGS_COLLECTION, 'upcoming', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const today = Timestamp.fromDate(startOfToday());
      const q = query(
        collection(db, MEETINGS_COLLECTION),
        where("userId", "==", user.uid),
        where("meetingDate", ">=", today),
        orderBy("meetingDate", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SheMeeting));
    },
    enabled: !!user?.uid,
  });

  const upcomingEvents = useMemo(() => {
    const events: UpcomingEvent[] = [];
    upcomingPrograms.forEach(program => {
      events.push({
        id: program.id,
        type: 'Program',
        title: program.programName,
        date: program.startDate,
        dateDisplay: format(parseISO(program.startDate), "MMM d, yyyy"),
        icon: Activity,
        path: `/she-meetings#program-${program.id}` // Example path
      });
    });
    upcomingMeetingsData.forEach(meeting => {
      events.push({
        id: meeting.id,
        type: 'Meeting',
        title: meeting.title,
        date: meeting.meetingDate,
        dateDisplay: format(parseISO(meeting.meetingDate), "MMM d, yyyy 'at' p"),
        icon: UsersIcon,
        path: `/she-meetings#meeting-${meeting.id}` // Example path
      });
    });
    return events.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()).slice(0, 5); // Show top 5
  }, [upcomingPrograms, upcomingMeetingsData]);

  const isLoadingUpcomingEvents = isLoadingPrograms || isLoadingMeetings;

  const handleRefreshEvents = async () => {
    setIsRefreshingEvents(true);
    try {
      await queryClient.invalidateQueries({ queryKey: [PROGRAMS_COLLECTION, 'upcoming', user?.uid] });
      await queryClient.invalidateQueries({ queryKey: [MEETINGS_COLLECTION, 'upcoming', user?.uid] });
      toast({ title: "Events Refreshed", description: "Upcoming SHE events have been updated."});
    } catch (e) {
      toast({ title: "Error Refreshing", description: "Could not refresh events.", variant: "destructive"});
    } finally {
      setIsRefreshingEvents(false);
    }
  };


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
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex-grow">
                    <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary"/>Upcoming SHE Events</CardTitle>
                    <CardDescription>Key programs and meetings on the horizon.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRefreshEvents} disabled={isRefreshingEvents} title="Refresh Events">
                    {isRefreshingEvents ? <PageLoader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
            </CardHeader>
            <CardContent>
                {isLoadingUpcomingEvents ? (
                    <div className="flex justify-center items-center h-32">
                        <PageLoader className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : upcomingEvents.length > 0 ? (
                    <ScrollArea className="max-h-[280px]">
                        <ul className="space-y-3 pr-3">
                            {upcomingEvents.map(event => (
                                <li key={event.id} className="flex items-start gap-3 p-2.5 rounded-md border bg-secondary/40 hover:shadow-sm transition-shadow">
                                    <event.icon className={`h-5 w-5 mt-0.5 ${event.type === 'Program' ? 'text-primary' : 'text-accent'}`} />
                                    <div>
                                        <p className="font-medium text-sm leading-tight">{event.title}</p>
                                        <p className="text-xs text-muted-foreground">{event.dateDisplay} ({event.type})</p>
                                        {/* Future: Add Link to event.path if needed */}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming events scheduled.</p>
                )}
                {(programsError || meetingsError) && (
                    <p className="text-xs text-red-500 mt-2 text-center">Error loading events. Please try again later.</p>
                )}
            </CardContent>
        </Card>
      </div>

      <SuggestIndicatorForm />

    </div>
  );
}

    

