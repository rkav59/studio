
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardPlus,
  ListChecks,
  BarChartHorizontalBig,
  Sparkles,
  ShieldCheck,
  ClipboardCheck, // Risk Assessment
  FileCheck2, // SHEQ Audit
  BookUser, // Training & Competence
  Siren, // Emergency Preparedness
  FileSearch, // Incident Investigation
  HardHat, // PPE Management
  ClipboardList, // Contractor Safety (Replaced ClipboardUser)
  Stethoscope, // Medical Screening
  HeartPulse, // Health Monitoring
  Library, // For Checklist Templates
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/incident-logging', label: 'Incident Logging', icon: ClipboardPlus },
  { href: '/inspections', label: 'Inspections', icon: ListChecks },
  { href: '/risk-assessment', label: 'Risk Assessment', icon: ClipboardCheck },
  { href: '/sheq-audit', label: 'SHEQ Audit', icon: FileCheck2 },
  { href: '/checklist-templates', label: 'Checklist Templates', icon: Library }, // New Nav Item
  { href: '/training-competence', label: 'Training & Competence', icon: BookUser },
  { href: '/emergency-preparedness', label: 'Emergency Preparedness', icon: Siren },
  { href: '/incident-investigation', label: 'Incident Investigation', icon: FileSearch },
  { href: '/ppe-management', label: 'PPE Management', icon: HardHat },
  { href: '/contractor-safety', label: 'Contractor Safety', icon: ClipboardList },
  { href: '/medical-screening', label: 'Medical Screening', icon: Stethoscope },
  { href: '/health-monitoring', label: 'Health Monitoring', icon: HeartPulse },
  { href: '/data-visualization', label: 'Data Visualization', icon: BarChartHorizontalBig },
  { href: '/ai-recommendations', label: 'AI Safety Assist', icon: Sparkles },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.label}
            >
              <a> {/* <a> tag is required when asChild and legacyBehavior are used with Link */}
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 group-data-[collapsible=icon]:justify-center">
      <ShieldCheck className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
      <span className="text-xl font-semibold text-foreground group-data-[collapsible=icon]:hidden font-headline">
        SHEild
      </span>
    </Link>
  );
}
