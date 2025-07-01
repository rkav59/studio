
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
import { LayoutDashboard, CalendarIcon, Filter, Settings, Loader2 as PageLoader, Activity, Users as UsersIcon, CalendarClock, RefreshCw, Lightbulb } from "lucide-react"; 
import { cn } from "@/lib/utils";
import { format, parseISO, startOfToday, isValid } from "date-fns"; 
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy } from 'firebase/firestore';
import type { KpiThreshold, KpiVisibilitySettings, SheProgram, SheMeeting, UserRole } from '@/lib/types';
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
  const { user, userProfile } = useAuth();
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

  const [tipOfTheDay, setTipOfTheDay] = useState("");

  const tips = [
    "Use the AI Hazard Identification tool in Risk Management to quickly brainstorm potential hazards for a new task.",
    "Regularly review your overdue action items from SHE Meetings to ensure timely closure.",
    "Check the Training Matrix to identify any compliance gaps for critical job roles.",
    "Low on PPE? The PPE Management dashboard highlights items below their reorder level.",
    "Schedule recurring audits to maintain consistent oversight of your safety management system.",
    "Use the 'AI Vetting Suggestion' in Contractor Safety to get a quick performance summary before approving a contractor.",
    "Link SHEQ Audits to your Risk Register entries to provide context and evidence for your risk assessments."
  ];

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * tips.length);
    setTipOfTheDay(tips[randomIndex]);
  }, []);

  const roleDisplayNames: Record<UserRole, string> = {
    admin: 'Administrator',
    she_officer: 'SHE Officer',
    authorizer: 'Authorizer',
    she_rep: 'SHE Representative',
    visitor: 'Visitor'
  };

  const userRoleName = userProfile?.role ? roleDisplayNames[userProfile.role] : 'User';
  

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
      const today = startOfToday(); 

      const q = query(
        collection(db, PROGRAMS_COLLECTION),
        where("userId", "==", user.uid),
        where("status", "in", ["Planned", "Ongoing"]),
        orderBy("startDate", "asc") 
      );
      const snapshot = await getDocs(q);
      
      const mappedPrograms = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          // Ensure dates are consistently ISO strings or null if invalid/missing
          const startDateISO = data.startDate instanceof Timestamp 
                               ? data.startDate.toDate().toISOString() 
                               : (typeof data.startDate === 'string' && isValid(parseISO(data.startDate)) ? data.startDate : null);
          const endDateISO = data.endDate instanceof Timestamp 
                             ? data.endDate.toDate().toISOString() 
                             : (typeof data.endDate === 'string' && isValid(parseISO(data.endDate)) ? data.endDate : null);
          
          return { 
              id: docSnap.id, 
              ...data, 
              startDate: startDateISO, 
              endDate: endDateISO     
          } as SheProgram; 
      });

      // Client-side filtering for "upcoming" based on JS Dates
      return mappedPrograms.filter(program => {
        if (!program.startDate || !isValid(parseISO(program.startDate))) {
          // console.warn(`Program ${program.id} filtered out due to invalid or missing startDate: ${program.startDate}`);
          return false; // Skip if startDate is invalid or missing
        }
        const progStartDate = parseISO(program.startDate);

        if (program.status === 'Planned') {
          return progStartDate >= today;
        }
        if (program.status === 'Ongoing') {
          if (program.endDate) { // If there's an end date
            if (!isValid(parseISO(program.endDate))) {
                // console.warn(`Program ${program.id} filtered out due to invalid endDate: ${program.endDate}`);
                return false; // Skip if endDate is invalid
            }
            return parseISO(program.endDate) >= today; // Must not have ended yet
          }
          return true; // Ongoing with no end date means it's current
        }
        return false; // Should not happen if query restricts status
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch Upcoming SHE Meetings
  const { data: upcomingMeetingsData = [], isLoading: isLoadingMeetings, error: meetingsError } = useQuery<SheMeeting[]>({
    queryKey: [MEETINGS_COLLECTION, 'upcoming', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const todayForQuery = Timestamp.fromDate(startOfToday()); // Firestore Timestamp for query
      const q = query(
        collection(db, MEETINGS_COLLECTION),
        where("userId", "==", user.uid),
        where("meetingDate", ">=", todayForQuery), // Query for meetingDate on or after start of today
        orderBy("meetingDate", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          // Ensure meetingDate is consistently an ISO string or null
          const meetingDateISO = data.meetingDate instanceof Timestamp 
                                 ? data.meetingDate.toDate().toISOString() 
                                 : (typeof data.meetingDate === 'string' && isValid(parseISO(data.meetingDate)) ? data.meetingDate : null);
          
          const actionItems = (data.actionItems || []).map((ai: any) => ({
            ...ai,
            dueDate: ai.dueDate instanceof Timestamp 
                     ? ai.dueDate.toDate().toISOString() 
                     : (typeof ai.dueDate === 'string' && isValid(parseISO(ai.dueDate)) ? ai.dueDate : null),
          }));

          return { 
            id: docSnap.id, 
            ...data, 
            meetingDate: meetingDateISO,
            actionItems
          } as SheMeeting;
      }).filter(meeting => meeting.meetingDate != null && isValid(parseISO(meeting.meetingDate))); // Filter out meetings with invalid/missing dates post-mapping
    },
    enabled: !!user?.uid,
  });

  const upcomingEvents = useMemo(() => {
    const events: UpcomingEvent[] = [];
    upcomingPrograms.forEach(program => {
      if (program.startDate && isValid(parseISO(program.startDate))) {
        events.push({
          id: program.id,
          type: 'Program',
          title: program.programName,
          date: program.startDate, // This is already a validated ISO string or null
          dateDisplay: format(parseISO(program.startDate), "MMM d, yyyy"),
          icon: Activity,
          path: `/she-meetings#program-${program.id}`
        });
      }
    });
    upcomingMeetingsData.forEach(meeting => {
      if (meeting.meetingDate && isValid(parseISO(meeting.meetingDate))) { // meeting.meetingDate is already validated ISO string or null
        events.push({
          id: meeting.id,
          type: 'Meeting',
          title: meeting.title,
          date: meeting.meetingDate, 
          dateDisplay: format(parseISO(meeting.meetingDate), "MMM d, yyyy 'at' p"),
          icon: UsersIcon,
          path: `/she-meetings#meeting-${meeting.id}`
        });
      }
    });
    return events.sort((a, b) => {
        // Dates are already confirmed valid ISO strings by the time they are pushed to events array
        const dateA = parseISO(a.date).getTime();
        const dateB = parseISO(b.date).getTime();
        return dateA - dateB;
    }).slice(0, 5);
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
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8"/> Dashboard
        </h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/kpi-settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Configure KPI Settings
        </Button>
      </div>
      
      <Card className="bg-gradient-to-r from-accent/90 to-accent text-accent-foreground shadow-lg">
        <CardHeader>
          <CardTitle>Welcome back, {user?.displayName || 'User'}!</CardTitle>
          <CardDescription className="text-accent-foreground/80">
            You are logged in as an {userRoleName}. Your access level allows you to manage relevant SHEQ modules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-md border border-accent-foreground/20 bg-accent-foreground/10 p-3">
            <Lightbulb className="h-5 w-5 mt-1 shrink-0" />
            <div>
              <h4 className="font-semibold">Tip of the Day</h4>
              <p className="text-sm text-accent-foreground/90">{tipOfTheDay}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <OverviewCards 
                kpiThresholds={kpiThresholds} 
                kpiVisibility={kpiVisibility}
                isLoadingSettings={isLoadingSettings} 
            />
        </div>
        <div className="space-y-6">
            <KpiTrendChart />
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
                        <ScrollArea className="max-h-[200px]">
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
      </div>
      
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
            <div className="h-[120px] w-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-md">
              (Incident Chart Area - Data will be filtered based on selections above)
            </div>
          </CardContent>
        </Card>
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
      </div>

      <SuggestIndicatorForm />

    </div>
  );
}
