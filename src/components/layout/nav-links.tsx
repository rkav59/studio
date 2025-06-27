
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks,
  Sparkles,
  FileCheck2,
  BookUser,
  Siren,
  HardHat,
  HeartPulse,
  Library,
  AlertTriangle,
  CalendarRange,
  CreditCard,
  Users,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { SheiqproLogo } from '../icons/sheiqpro-logo';
import { Button } from '../ui/button';
import type { UserProfile } from '@/lib/types';

const navGroups = [
  {
    title: 'Core & Planning',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/risk-management', label: 'Risk Management', icon: AlertTriangle },
      { href: '/she-meetings', label: 'SHE Meetings & Programs', icon: CalendarRange },
      { href: '/sheq-audit', label: 'SHEQ Audit', icon: FileCheck2 },
    ],
  },
  {
    title: 'Operational Management',
    items: [
      { href: '/training-competence', label: 'Training & Competence', icon: BookUser },
      { href: '/emergency-preparedness', label: 'Emergency Preparedness', icon: Siren },
      { href: '/ppe-management', label: 'PPE Management', icon: HardHat },
      { href: '/contractor-safety', label: 'Contractor Safety', icon: ListChecks },
      { href: '/health-monitoring', label: 'Health Monitoring', icon: HeartPulse },
    ],
  },
  {
    title: 'Tools & Admin',
    items: [
      { href: '/checklist-templates', label: 'Checklist Templates', icon: Library },
      { href: '/ai-recommendations', label: 'AI Safety Assist', icon: Sparkles },
      { href: '/user-management', label: 'User Management', icon: Users, requiredRole: 'admin' },
    ],
  },
];


interface NavLinksProps {
  userProfile: UserProfile | null;
}

export function NavLinks({ userProfile }: NavLinksProps) {
  const pathname = usePathname();
  const userRole = userProfile?.role;

  return (
    <SidebarMenu>
      {navGroups.map((group, groupIndex) => (
        <React.Fragment key={group.title}>
          {group.items.map((item) => {
            // If a role is required and the user doesn't have it, don't render the item
            if (item.requiredRole && item.requiredRole !== userRole) {
              return null;
            }

            return (
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
            );
          })}
          {groupIndex < navGroups.length - 1 && <SidebarSeparator className="my-1" />}
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
