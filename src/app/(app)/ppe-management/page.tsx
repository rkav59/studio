
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function PpeManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">PPE Management</h1>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Various types of PPE" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="safety equipment"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h2 className="text-2xl font-semibold text-white font-headline">Equip for Safety</h2>
                <p className="text-sm text-neutral-300">Manage Personal Protective Equipment inventory and compliance.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module helps track the issuance, inspection, and inventory of Personal Protective Equipment (PPE). 
                Conduct PPE compliance audits and ensure employees are properly equipped and protected.
            </p>
            <div className="mt-6 p-6 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-lg">PPE Tracking & Compliance</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Upcoming features:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>PPE inventory management: stock levels, types, and specifications.</li>
                    <li>Issuance and return tracking per employee or job role.</li>
                    <li>PPE inspection schedules, checklists, and logged records.</li>
                    <li>Compliance audit forms for PPE usage and condition.</li>
                    <li>Automated alerts for PPE reorder, replacement, or expiry dates.</li>
                    <li>Reporting on PPE consumption, costs, and compliance rates.</li>
                    <li>PPE matrix based on job roles and risk assessments.</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
