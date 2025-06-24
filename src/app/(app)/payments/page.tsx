

"use client";

import { CreditCard, ShieldCheck, Clock } from "lucide-react";
import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomPricingTable } from '@/components/billing/custom-pricing-table';
import { formatDistanceToNow } from "date-fns";

const USER_PROFILES_COLLECTION = 'userProfiles';

function CurrentPlanCard({ subscriptionId, currentPeriodEnd, trialEndDate }: { subscriptionId?: string, currentPeriodEnd?: string, trialEndDate?: string }) {
    if (subscriptionId) {
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
    
    if (trialEndDate) {
        const trialEndDateObj = new Date(trialEndDate);
        const isTrialExpired = new Date() > trialEndDateObj;

        if (isTrialExpired) {
            return (
                <Card className="max-w-md mx-auto lg:mx-0 border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2"><Clock/>Trial Expired</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Your 14-day free trial has ended. Please upgrade to Pro to continue using all features.</p>
                    </CardContent>
                </Card>
            );
        } else {
             return (
                <Card className="max-w-md mx-auto lg:mx-0 border-primary/50">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2"><ShieldCheck/>Free Trial Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">You are currently on the 14-day Pro trial.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Your trial ends in {formatDistanceToNow(trialEndDateObj, { addSuffix: true })}.
                        </p>
                    </CardContent>
                </Card>
            );
        }
    }

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
                <CurrentPlanCard 
                    subscriptionId={userProfile?.stripeSubscriptionId} 
                    currentPeriodEnd={userProfile?.stripeCurrentPeriodEnd}
                    trialEndDate={userProfile?.trialEndDate}
                />
            )}
        </div>
        
        <div className="space-y-4">
             <h2 className="text-xl font-semibold text-center lg:text-left">Upgrade to Pro</h2>
            { !hasActiveSubscription && <CustomPricingTable /> }
            { hasActiveSubscription && 
                <Card className="max-w-md mx-auto lg:mx-0">
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-center lg:text-left">Thank you for being a Pro member!</p>
                    </CardContent>
                </Card>
            }
        </div>
      </div>
    </div>
  );
}
