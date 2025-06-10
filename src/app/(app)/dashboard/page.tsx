
import { OverviewCards, IncidentTypeChart } from "@/components/dashboard/overview-cards";
import { SuggestIndicatorForm } from "@/components/dashboard/suggest-indicator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        {/* Potentially add date range picker or other controls here */}
      </div>
      
      <OverviewCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentTypeChart />
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

      <SuggestIndicatorForm />

    </div>
  );
}
