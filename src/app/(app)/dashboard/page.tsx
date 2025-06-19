
"use client"; // Add this line to make it a client component

import { useState } from 'react';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { KpiTrendChart } from "@/components/dashboard/kpi-trend-chart";
import { SuggestIndicatorForm } from "@/components/dashboard/suggest-indicator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Label } from '@/components/ui/label';


const mockLocations = ["All Locations", "Warehouse A", "Office Block", "Factory Floor", "Loading Bay"];
const mockCategories = ["All Categories", "Incident", "Near Miss", "Hazard"];

export default function DashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(mockLocations[0]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(mockCategories[0]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // In a real app, you would filter data based on these states
  // For now, they just update the UI

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        {/* Potentially add date range picker or other controls here */}
      </div>
      
      <OverviewCards />

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
               {/* <Button className="w-full sm:w-auto" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Apply Filters
              </Button> */}
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

