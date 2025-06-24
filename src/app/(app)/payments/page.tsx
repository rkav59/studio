
"use client";

import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center">
        <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Billing & Payments</h1>
        <p className="text-muted-foreground">This functionality is not configured for this application.</p>
      </div>
      
       <Card className="max-w-md mx-auto">
          <CardHeader>
              <CardTitle>Billing Disabled</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground">
                Payment processing has been disabled. All features are currently available to all users without a subscription.
              </p>
          </CardContent>
      </Card>

    </div>
  );
}
