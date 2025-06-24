"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, History, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const mockBillingHistory = [
    { id: "inv_1", date: "June 1, 2024", amount: "$29.00", status: "Paid" },
    { id: "inv_2", date: "May 1, 2024", amount: "$29.00", status: "Paid" },
    { id: "inv_3", date: "April 1, 2024", amount: "$29.00", status: "Paid" },
    { id: "inv_4", date: "March 1, 2024", amount: "$29.00", status: "Paid" },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <CreditCard className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Billing & Payments</h1>
        <p className="text-muted-foreground">Manage your subscription, payment methods, and view your billing history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5"/> Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border">
              <h3 className="text-lg font-semibold text-primary">Pro Plan</h3>
              <p className="text-2xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Unlimited Incident Logs</li>
                <li>Unlimited Risk Assessments</li>
                <li>Advanced AI-Powered Insights</li>
                <li>Team Collaboration (up to 10 users)</li>
                <li>Priority Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>Manage Subscription (Placeholder)</Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5"/> Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-muted-foreground"/>
                    <div>
                        <p className="font-medium">Visa ending in 1234</p>
                        <p className="text-xs text-muted-foreground">Expires 12/2026</p>
                    </div>
                </div>
                <Badge variant="outline">Primary</Badge>
            </div>
             <p className="text-xs text-muted-foreground">
              This is a placeholder. A real implementation would use a secure payment provider like Stripe or Braintree.
            </p>
          </CardContent>
           <CardFooter>
            <Button variant="outline" className="w-full" disabled>Add New Payment Method</Button>
          </CardFooter>
        </Card>
      </div>

       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Billing History</CardTitle>
            <CardDescription>Review your past invoices and payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Invoice</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockBillingHistory.map((invoice) => (
                        <TableRow key={invoice.id}>
                            <TableCell>{invoice.date}</TableCell>
                            <TableCell className="font-medium">{invoice.amount}</TableCell>
                            <TableCell><Badge variant={invoice.status === 'Paid' ? 'default' : 'destructive'} className={`${invoice.status === 'Paid' ? 'bg-green-600' : ''}`}>{invoice.status}</Badge></TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" disabled>
                                    <Download className="h-4 w-4"/>
                                    <span className="sr-only">Download invoice {invoice.id}</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
