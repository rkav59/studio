
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/hooks/use-toast";
import { createCheckoutSession } from "@/app/(app)/payments/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Zap } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link"; // Added for Enterprise plan

const USER_PROFILES_COLLECTION = 'userProfiles';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

interface PlanDetails {
    id: 'free' | 'pro' | 'premium' | 'enterprise';
    title: string;
    price: string;
    priceId?: string;
    priceDescription: string;
    features: string[];
    userLimit: string;
    isFeatured?: boolean;
}

const plans: PlanDetails[] = [
    {
        id: 'free',
        title: 'Free',
        price: '$0',
        priceDescription: 'For solo testing or evaluation.',
        features: [
            'Basic Incident Logging',
            '5 Risk Assessments/month',
            'Limited AI Assist',
            'Community Support'
        ],
        userLimit: '1 User'
    },
    {
        id: 'pro',
        title: 'Pro',
        price: '$49',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        priceDescription: '/month, for small teams.',
        features: [
            'All Free features',
            'Full AI-Powered Safety Assist',
            'Unlimited Risk Assessments',
            'Advanced Reporting',
            'Email Support'
        ],
        userLimit: 'Up to 10 Users',
        isFeatured: true,
    },
    {
        id: 'premium',
        title: 'Premium',
        price: '$99',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
        priceDescription: '/month, for growing businesses.',
        features: [
            'All Pro features',
            'SHEQ Audit Module',
            'Contractor Safety Module',
            'Dedicated Phone Support',
            'Basic Audit Trail'
        ],
        userLimit: 'Up to 30 Users'
    },
    {
        id: 'enterprise',
        title: 'Enterprise',
        price: '$249',
        priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
        priceDescription: '/month, for large organizations.',
        features: [
            'All Premium features',
            'Enterprise SSO',
            'Dedicated Account Manager',
            'Advanced User Roles',
            'Custom Integrations'
        ],
        userLimit: '100+ Users'
    }
];

export function CustomPricingTable() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const { data: userProfile } = useQuery<UserProfile | null>({
        queryKey: [USER_PROFILES_COLLECTION, user?.uid],
        queryFn: async () => {
            if (!user?.uid) return null;
            const profileRef = doc(db, USER_PROFILES_COLLECTION, user.uid);
            const profileSnap = await getDoc(profileRef);
            return profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } as UserProfile : null;
        },
        enabled: !!user?.uid,
    });

    const handleUpgradeClick = async (priceId?: string, planName?: string) => {
        if (!priceId) {
            toast({ title: "Plan Unavailable", description: `The ${planName} plan is not available for online purchase at this time. Please contact us.`, variant: "destructive"});
            return;
        }
        if (!user) {
            toast({ title: "Authentication Required", description: "Please sign in to upgrade.", variant: "destructive" });
            return;
        }

        setIsLoading(priceId);

        try {
            const { sessionId } = await createCheckoutSession({
                userId: user.uid,
                userEmail: user.email!,
                priceId: priceId
            });

            const stripe = await stripePromise;
            if (!stripe) {
                 throw new Error("Stripe.js has not loaded yet.");
            }

            const { error } = await stripe.redirectToCheckout({ sessionId });
            
            if (error) {
                console.error("Stripe redirect error:", error);
                toast({ title: "Error", description: error.message, variant: "destructive" });
            }

        } catch (error: any) {
            console.error("Failed to create checkout session:", error);
            toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsLoading(null);
        }
    };

    const currentPlanId = userProfile?.planId;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map(plan => (
                <Card key={plan.id} className={`flex flex-col ${plan.isFeatured ? 'border-primary border-2 shadow-lg' : ''}`}>
                    <CardHeader className="text-center">
                        {plan.isFeatured && (
                            <div className="flex justify-center mb-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground">
                                    <Zap className="h-4 w-4 mr-1.5" /> Most Popular
                                </span>
                            </div>
                        )}
                        <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                        <CardDescription>{plan.priceDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                        <div className="text-center">
                            <p className="text-4xl font-extrabold">{plan.price}<span className="text-lg font-normal text-muted-foreground">{plan.price.startsWith('$') ? '/mo' : ''}</span></p>
                            <p className="text-sm font-semibold text-primary mt-1">{plan.userLimit}</p>
                        </div>
                        <ul className="space-y-3 text-sm">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                         {plan.id === 'free' ? (
                            <Button disabled className="w-full">Free Plan</Button>
                        ) : currentPlanId === plan.id ? (
                            <Button disabled className="w-full">Current Plan</Button>
                        ) : (
                            <Button 
                                onClick={() => handleUpgradeClick(plan.priceId, plan.title)} 
                                disabled={isLoading === plan.priceId}
                                className={`w-full ${plan.isFeatured ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                            >
                                {isLoading === plan.priceId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isLoading === plan.priceId ? "Redirecting..." : `Upgrade to ${plan.title}`}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
