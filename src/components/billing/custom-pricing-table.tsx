
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/hooks/use-toast";
import { createCheckoutSession } from "@/app/(app)/payments/actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export function CustomPricingTable() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID as string;
    
    const handleUpgradeClick = async () => {
        if (!user) {
            toast({ title: "Authentication Required", description: "Please sign in to upgrade.", variant: "destructive" });
            return;
        }
        if (!proPriceId) {
            toast({ title: "Configuration Error", description: "Pricing is not configured correctly. Please contact support.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            const { sessionId } = await createCheckoutSession({
                userId: user.uid,
                userEmail: user.email!,
                priceId: proPriceId
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
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto lg:mx-0 shadow-lg border-primary border-2">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Pro Plan</CardTitle>
                <CardDescription>Unlock all advanced features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center">
                    <p className="text-4xl font-extrabold">$29<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
                </div>
                <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Unlimited Risk Assessments</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Unlimited SHEQ Audits</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> AI-Powered Safety Assist</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Advanced Reporting</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Priority Support</li>
                </ul>
            </CardContent>
            <CardFooter>
                <Button onClick={handleUpgradeClick} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "Redirecting..." : "Upgrade to Pro"}
                </Button>
            </CardFooter>
        </Card>
    );
}
