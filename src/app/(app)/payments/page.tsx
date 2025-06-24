
"use client";

import { CreditCard } from "lucide-react";
import React from 'react';

// Define the custom element type for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'pricing-table-id': string;
        'publishable-key': string;
      };
    }
  }
}

export default function PaymentsPage() {
  const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID as string;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <CreditCard className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Billing & Payments</h1>
        <p className="text-muted-foreground">Manage your subscription, payment methods, and view your billing history.</p>
      </div>
      
      {pricingTableId && publishableKey ? (
        <stripe-pricing-table 
          pricing-table-id={pricingTableId}
          publishable-key={publishableKey}>
        </stripe-pricing-table>
      ) : (
        <div className="text-center text-red-500 p-4 border border-destructive rounded-md">
          <p>Stripe Pricing Table is not configured. Please set NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.</p>
        </div>
      )}
    </div>
  );
}
