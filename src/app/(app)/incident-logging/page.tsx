"use client";

import { useState } from 'react';
import { IncidentForm } from "@/components/incident-logging/incident-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Incident } from "@/lib/types";
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export default function IncidentLoggingPage() {
  const [loggedIncidents, setLoggedIncidents] = useState<Incident[]>([]);

  const handleIncidentLogged = (incident: Incident) => {
    setLoggedIncidents(prevIncidents => [incident, ...prevIncidents]);
  };

  const getIconForType = (type: Incident['type']) => {
    switch (type) {
      case 'Incident':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'Near Miss':
        return <HelpCircle className="h-5 w-5 text-yellow-500" />;
      case 'Hazard':
        return <CheckCircle className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Log New Occurrence</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Occurrence Details</CardTitle>
          <CardDescription>
            Fill out the form below to log a new incident, near miss, or hazard.
            Provide as much detail as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IncidentForm onIncidentLogged={handleIncidentLogged} />
        </CardContent>
      </Card>

      {loggedIncidents.length > 0 && (
        <>
          <Separator className="my-8" />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Recently Logged Occurrences (Session Only)</CardTitle>
              <CardDescription>This list is for demonstration and will reset on page refresh.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {loggedIncidents.slice(0, 5).map((incident) => (
                  <li key={incident.id} className="p-4 border rounded-md bg-secondary/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {getIconForType(incident.type)}
                            <h3 className="font-semibold">{incident.type} at {incident.location}</h3>
                        </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(incident.timestamp), "PPP p")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground truncate">{incident.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Region: {incident.region}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
