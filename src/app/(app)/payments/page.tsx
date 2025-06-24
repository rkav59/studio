
"use client";

import { CreditCard, ShieldCheck } from "lucide-react";
import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomPricingTable } from '@/components/billing/custom-pricing-table';

const USER_PROFILES_COLLECTION = 'userProfiles';

function CurrentPlanCard({ subscriptionId, currentPeriodEnd }: { subscriptionId?: string, currentPeriodEnd?: string }) {
    if (!subscriptionId) {
        return (
            <Card className="max-w-md mx-auto lg:mx-0">
                <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You are currently on the Free plan.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
         <Card className="max-w-md mx-auto lg:mx-0">
            <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2"><ShieldCheck/>Pro Plan Active</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Your subscription is active.</p>
                {currentPeriodEnd && <p className="text-xs text-muted-foreground mt-1">Renews on: {new Date(currentPeriodEnd).toLocaleDateString()}</p>}
                {/* Note: A 'Manage Billing' button would redirect to a Stripe customer portal session, which is a separate API call */}
            </CardContent>
        </Card>
    );
}

export default function PaymentsPage() {
  const { user } = useAuth();
  
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile | null>({
    queryKey: [USER_PROFILES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const profileRef = doc(db, USER_PROFILES_COLLECTION, user.uid);
      const profileSnap = await getDoc(profileRef);
      return profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } as UserProfile : null;
    },
    enabled: !!user?.uid,
  });

  const hasActiveSubscription = !!userProfile?.stripeSubscriptionId;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <CreditCard className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Billing & Payments</h1>
        <p className="text-muted-foreground">Manage your subscription and payment methods.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center lg:text-left">Your Plan</h2>
            {isLoadingProfile ? (
                 <Card className="max-w-md mx-auto lg:mx-0"><CardHeader><Skeleton className="h-6 w-1/2"/></CardHeader><CardContent><Skeleton className="h-4 w-3/4"/></CardContent></Card>
            ) : (
                <CurrentPlanCard subscriptionId={userProfile?.stripeSubscriptionId} currentPeriodEnd={userProfile?.stripeCurrentPeriodEnd} />
            )}
        </div>
        
        <div className="space-y-4">
             <h2 className="text-xl font-semibold text-center lg:text-left">Upgrade</h2>
            { !hasActiveSubscription && <CustomPricingTable /> }
            { hasActiveSubscription && 
                <p className="text-muted-foreground text-center lg:text-left">You already have an active subscription.</p> 
            }
        </div>
      </div>
    </div>
  );
}
