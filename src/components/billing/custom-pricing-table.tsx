
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function CustomPricingTable() {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing Not Configured</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>
                    This application is currently not configured for payment processing. All features are enabled.
                </CardDescription>
            </CardContent>
        </Card>
    );
}
