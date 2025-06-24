"use client";

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, History, Download, Check, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession } from './actions'; // The new server action
import { useAuth } from '@/contexts/auth-context';

// Initialize Stripe.js. In a real app, this MUST be in environment variables.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export default function PaymentsPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleUpgradeClick = async () => {
        setIsSubmitting(true);
        if (!user) {
            toast({
                title: "Not Authenticated",
                description: "You must be signed in to upgrade your plan.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        try {
            // Pass user data to the server action
            const { sessionId } = await createCheckoutSession({ uid: user.uid, email: user.email });
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error("Stripe.js has not loaded yet.");
            }
            const { error } = await stripe.redirectToCheckout({ sessionId });

            if (error) {
                console.error("Stripe redirect error:", error);
                toast({
                    title: "Stripe Error",
                    description: error.message || "Failed to redirect to Stripe. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            console.error("Failed to create checkout session:", error);
            toast({
                title: "Upgrade Failed",
                description: error.message || "Could not initiate the upgrade process. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };


  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <CreditCard className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Billing & Payments</h1>
        <p className="text-muted-foreground">Manage your subscription, payment methods, and view your billing history.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5"/> Our Pro Plan</CardTitle>
          <CardDescription>Unlock all features with the Pro Plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/50 border">
            <h3 className="text-lg font-semibold text-primary">Pro Plan</h3>
            <p className="text-2xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></p>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0"/>Unlimited Incident Logs</li>
              <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0"/>Unlimited Risk Assessments</li>
              <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0"/>Advanced AI-Powered Insights</li>
              <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0"/>Team Collaboration (up to 10 users)</li>
              <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0"/>Priority Support</li>
          </ul>
        </CardContent>
        <CardFooter>
            <Button className="w-full" onClick={handleUpgradeClick} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Upgrade to Pro Plan
            </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5"/> Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-xs text-muted-foreground">
              Your payment methods will be managed securely through our payment provider, Stripe. After subscribing, you can manage your payment methods via the billing portal.
            </p>
          </CardContent>
           <CardFooter>
            <Button variant="outline" className="w-full" disabled>Manage Payment Methods (via Stripe)</Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Billing History</CardTitle>
                <CardDescription>Review your past invoices and payments.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">Your billing history will appear here once you subscribe.</p>
                {/* 
                <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Invoice</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {mockBillingHistory.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>{invoice.date}</TableCell>
                                <TableCell className="font-medium">{invoice.amount}</TableCell>
                                <TableCell><Badge variant={invoice.status === 'Paid' ? 'default' : 'destructive'} className={`${invoice.status === 'Paid' ? 'bg-green-600' : ''}`}>{invoice.status}</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="ghost" size="icon" disabled><Download className="h-4 w-4"/><span className="sr-only">Download invoice</span></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                */}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
