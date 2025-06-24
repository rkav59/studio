

"use client"; // Make this a client component to use hooks

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import AppLayoutInternal from '@/components/layout/app-layout'; // Renamed original
import { Skeleton } from '@/components/ui/skeleton';
// Removed unused imports: useQuery, UserProfile, doc, getDoc, db
import { useToast } from '@/hooks/use-toast';

// This is the protected layout for the main application routes
export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, isAuthenticating, isLoadingProfile } = useAuth(); // Get profile from context
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const isLoading = isAuthenticating || isLoadingProfile; // Combined loading state

  useEffect(() => {
    if (isLoading) {
      return; // Wait for auth and profile to load
    }

    if (!user) {
      router.replace('/sign-in');
      return;
    }

    // Trial expiration logic
    if (userProfile && !userProfile.stripeSubscriptionId && userProfile.trialEndDate) {
        const isTrialExpired = new Date() > new Date(userProfile.trialEndDate);
        // Don't redirect if they are already on the payments or billing-related pages
        if (isTrialExpired && pathname !== '/payments' && pathname !== '/user-profile') { 
            toast({
                title: "Trial Expired",
                description: "Your 14-day trial has ended. Please upgrade to continue accessing all features.",
                variant: "destructive",
                duration: 10000,
            });
            router.replace('/payments');
        }
    }

  }, [user, isLoading, router, userProfile, pathname, toast]);


  if (isLoading || (!user && pathname !== '/welcome')) {
    // Show a loading state or a more sophisticated skeleton for the app layout
    return (
      <div className="flex min-h-screen">
        <Skeleton className="hidden md:block w-16 md:w-64 bg-sidebar" /> {/* Sidebar skeleton */}
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-14 border-b bg-background/80" /> {/* Header skeleton */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Skeleton className="h-32 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  // If on the welcome page, render it without the main app layout for a focused experience
  if (pathname === '/welcome') {
      return <>{children}</>;
  }


  // If authenticated and not on welcome page, render the actual app layout and children
  return <AppLayoutInternal userProfile={userProfile}>{children}</AppLayoutInternal>;
}
