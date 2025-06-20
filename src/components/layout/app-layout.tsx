
// Renamed from AppLayout to AppLayoutInternal to avoid conflict in ProtectedAppLayout
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link'; // Added Link
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { NavLinks, AppLogo } from './nav-links';
import { UserCircle, LogOut } from 'lucide-react';
import { GenerateReportButton } from './generate-report-button';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


interface AppLayoutInternalProps { // Changed name
  children: ReactNode;
}

export default function AppLayoutInternal({ children }: AppLayoutInternalProps) { // Changed name
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/sign-in');
    } catch (error: any) {
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
    }
  };


  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader>
          <AppLogo />
        </SidebarHeader>
        <SidebarContent>
          <NavLinks />
        </SidebarContent>
        <SidebarFooter>
          {user ? (
             <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-2">
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </Button>
          ) : (
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => router.push('/sign-in')}>
              <UserCircle className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Sign In</span>
            </Button>
          )}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-3"> {/* Adjusted gap for better spacing */}
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.displayName || user.email}
                </span>
                <Link href="/user-profile" passHref legacyBehavior>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="User Profile">
                    <UserCircle className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}
            <GenerateReportButton />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

