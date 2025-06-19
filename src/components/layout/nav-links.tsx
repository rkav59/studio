
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  ListChecks, // Inspections (now for Contractor Safety)
  BarChartHorizontalBig, // Data Visualization
  Sparkles, // AI Safety Assist
  FileCheck2, // SHEQ Audit
  BookUser, // Training & Competence
  Siren, // Emergency Preparedness
  HardHat, // PPE Management
  HeartPulse, // Health Monitoring (now covers Medical Screening)
  Library, // For Checklist Templates
  AlertTriangle, // For Risk Management
  CalendarRange, // For SHE Meetings & Programs
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/risk-management', label: 'Risk Management', icon: AlertTriangle },
  { href: '/sheq-audit', label: 'SHEQ Audit', icon: FileCheck2 },
  { href: '/checklist-templates', label: 'Checklist Templates', icon: Library },
  { href: '/training-competence', label: 'Training & Competence', icon: BookUser },
  { href: '/emergency-preparedness', label: 'Emergency Preparedness', icon: Siren },
  { href: '/ppe-management', label: 'PPE Management', icon: HardHat },
  { href: '/contractor-safety', label: 'Contractor Safety', icon: ListChecks },
  { href: '/health-monitoring', label: 'Health Monitoring', icon: HeartPulse },
  { href: '/she-meetings', label: 'SHE Meetings & Programs', icon: CalendarRange },
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
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-2 w-full", // Use w-full to fill header space
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-8", // Center icon and set height when collapsed
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-md" // Focus styling
      )}
      title="SHEild Dashboard" // Tooltip for accessibility
    >
      <ShieldCheck className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
      <span className="text-xl font-semibold text-foreground group-data-[collapsible=icon]:hidden font-headline">
        SHEild
      </span>
    </Link>
  );
}
    
