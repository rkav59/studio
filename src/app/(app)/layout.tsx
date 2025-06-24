

"use client"; // Make this a client component to use hooks

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import AppLayoutInternal from '@/components/layout/app-layout'; // Renamed original
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const USER_PROFILES_COLLECTION = 'userProfiles';


// This is the protected layout for the main application routes
export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticating } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile | null>({
    queryKey: ['userProfileLayout', user?.uid],
    queryFn: async () => {
        if (!user?.uid) return null;
        const profileRef = doc(db, USER_PROFILES_COLLECTION, user.uid);
        const profileSnap = await getDoc(profileRef);
        return profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } as UserProfile : null;
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // Cache profile data for 5 minutes
  });


  useEffect(() => {
    if (isAuthenticating || isLoadingProfile) {
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

  }, [user, isAuthenticating, router, userProfile, isLoadingProfile, pathname, toast]);


  if (isAuthenticating || isLoadingProfile || (!user && pathname !== '/welcome')) {
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
  return <AppLayoutInternal>{children}</AppLayoutInternal>;
}
