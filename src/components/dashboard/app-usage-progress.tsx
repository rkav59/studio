"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  FileCheck2,
  BookUser,
  ListChecks,
  HardHat,
  Siren,
  HeartPulse,
  CalendarRange,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppUsageProgressProps {
  usageData: {
    incidentCount: number;
    riskAssessmentCount: number;
    auditCount: number;
    trainingRecordCount: number;
    contractorCount: number;
    ppeItemCount: number;
    emergencyPlanCount: number;
    healthRecordCount: number;
    meetingCount: number;
  }
}

interface Feature {
  name: string;
  description: string;
  link: string;
  icon: React.ElementType;
  isUsed: boolean;
}

export function AppUsageProgress({ usageData }: AppUsageProgressProps) {
  const router = useRouter();

  const features: Feature[] = [
    { name: "Risk Management", description: "Log incidents and conduct risk assessments.", link: "/risk-management", icon: AlertTriangle, isUsed: usageData.incidentCount > 0 && usageData.riskAssessmentCount > 0 },
    { name: "SHEQ Audits", description: "Schedule and conduct internal or external audits.", link: "/sheq-audit", icon: FileCheck2, isUsed: usageData.auditCount > 0 },
    { name: "Training & Competence", description: "Manage courses and track employee training records.", link: "/training-competence", icon: BookUser, isUsed: usageData.trainingRecordCount > 0 },
    { name: "Contractor Safety", description: "Vet contractors and manage their safety on-site.", link: "/contractor-safety", icon: ListChecks, isUsed: usageData.contractorCount > 0 },
    { name: "PPE Management", description: "Track your inventory of personal protective equipment.", link: "/ppe-management", icon: HardHat, isUsed: usageData.ppeItemCount > 0 },
    { name: "Emergency Preparedness", description: "Create emergency plans and log practice drills.", link: "/emergency-preparedness", icon: Siren, isUsed: usageData.emergencyPlanCount > 0 },
    { name: "Health Monitoring", description: "Log IH samples and track employee health screenings.", link: "/health-monitoring", icon: HeartPulse, isUsed: usageData.healthRecordCount > 0 },
    { name: "SHE Meetings", description: "Log meetings and track follow-up action items.", link: "/she-meetings", icon: CalendarRange, isUsed: usageData.meetingCount > 0 },
  ];

  const usedFeaturesCount = features.filter(f => f.isUsed).length;
  const progressPercentage = Math.round((usedFeaturesCount / features.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Utilization</CardTitle>
        <CardDescription>
          Your SHEQ program becomes more powerful as you add data. Here's a look at which modules you're using.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-bold text-primary">{progressPercentage}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div key={feature.name} className={cn("p-4 rounded-lg flex flex-col justify-between border", feature.isUsed ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-secondary/50")}>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <feature.icon className="h-5 w-5" />
                    {feature.name}
                  </h4>
                  {feature.isUsed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
              {!feature.isUsed && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-3 text-primary self-start"
                  onClick={() => router.push(feature.link)}
                >
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
