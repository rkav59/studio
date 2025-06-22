
"use client";

import React from 'react'; // Import React
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks, // Inspections (now for Contractor Safety)
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
  useSidebar,
  SidebarSeparator, // Import SidebarSeparator
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { SheiqproLogo } from '../icons/sheiqpro-logo';
import { Button } from '../ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/risk-management', label: 'Risk Management', icon: AlertTriangle },
  { href: '/she-meetings', label: 'SHE Meetings & Programs', icon: CalendarRange },
  { href: '/sheq-audit', label: 'SHEQ Audit', icon: FileCheck2 },
  { href: '/checklist-templates', label: 'Checklist Templates', icon: Library },
  { href: '/training-competence', label: 'Training & Competence', icon: BookUser },
  { href: '/emergency-preparedness', label: 'Emergency Preparedness', icon: Siren },
  { href: '/ppe-management', label: 'PPE Management', icon: HardHat },
  { href: '/contractor-safety', label: 'Contractor Safety', icon: ListChecks },
  { href: '/health-monitoring', label: 'Health Monitoring', icon: HeartPulse },
  { href: '/ai-recommendations', label: 'AI Safety Assist', icon: Sparkles },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <React.Fragment key={item.href}>
          <SidebarMenuItem>
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
          {(item.label === 'Dashboard' || item.label === 'Checklist Templates') && <SidebarSeparator className="my-1" />}
        </React.Fragment>
      ))}
    </SidebarMenu>
  );
}

export function AppLogo() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      onClick={toggleSidebar}
      className={cn(
        "flex items-center gap-2 w-full h-auto py-2",
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-8",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-md justify-start",
        "hover:bg-sidebar-accent/20"
      )}
      title="Toggle Sidebar"
    >
      <SheiqproLogo className="h-8 w-8 text-white group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
      <span className="text-xl font-normal text-white group-data-[collapsible=icon]:hidden font-headline">
        SHEiQpro
      </span>
    </Button>
  );
}
