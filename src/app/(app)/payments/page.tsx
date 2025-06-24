
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

function CurrentPlanCard({ subscriptionId, currentPeriodEnd, trialEndDate, planId }: { subscriptionId?: string, currentPeriodEnd?: string, trialEndDate?: string, planId?: UserProfile['planId'] }) {
    if (subscriptionId) {
        return (
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-green-600 flex items-center gap-2"><ShieldCheck/>
                    {planId === 'pro' && 'Pro Plan Active'}
                    {planId === 'premium' && 'Premium Plan Active'}
                    {(!planId || !['pro', 'premium'].includes(planId)) && 'Paid Plan Active'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your subscription is active.</p>
                    {currentPeriodEnd && <p className="text-xs text-muted-foreground mt-1">Renews on: {new Date(currentPeriodEnd).toLocaleDateString()}</p>}
                    {/* Note: A 'Manage Billing' button would redirect to a Stripe customer portal session, which is a separate API call */}
                </CardContent>
            </Card>
        );
    }
    
    if (planId === 'trial' && trialEndDate) {
        const trialEndDateObj = new Date(trialEndDate);
        const isTrialExpired = new Date() > trialEndDateObj;

        if (isTrialExpired) {
            return (
                <Card className="max-w-md mx-auto border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2"><Clock/>Trial Expired</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Your 14-day free trial has ended. Please upgrade to continue using all features.</p>
                    </CardContent>
                </Card>
            );
        } else {
             return (
                <Card className="max-w-md mx-auto border-primary/50">
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
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Free Plan</CardTitle>
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


  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <CreditCard className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Billing & Payments</h1>
        <p className="text-muted-foreground">Manage your subscription and payment methods.</p>
      </div>
      
      <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Your Current Plan</h2>
            {isLoadingProfile ? (
                 <Card className="max-w-md mx-auto"><CardHeader><Skeleton className="h-6 w-1/2"/></CardHeader><CardContent><Skeleton className="h-4 w-3/4"/></CardContent></Card>
            ) : (
                <CurrentPlanCard 
                    subscriptionId={userProfile?.stripeSubscriptionId} 
                    currentPeriodEnd={userProfile?.stripeCurrentPeriodEnd}
                    trialEndDate={userProfile?.trialEndDate}
                    planId={userProfile?.planId}
                />
            )}
        </div>
      
      <div className="space-y-4 pt-6">
        <h2 className="text-xl font-semibold text-center">Choose Your Plan</h2>
        <CustomPricingTable />
      </div>

    </div>
  );
}
