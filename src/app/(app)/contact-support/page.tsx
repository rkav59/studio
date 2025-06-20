
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MessageSquare, User as UserIcon, FileText as FileTextIcon } from "lucide-react"; // Aliased User and FileText

export default function ContactSupportPage() {
  // This is a static informational page. A real form would require backend handling.
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <Phone className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Contact Support</h1>
        <p className="text-muted-foreground">We're here to help. Reach out to us with your questions or issues.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Get in Touch</CardTitle>
          <CardDescription>
            Please provide as much detail as possible so we can assist you effectively.
            Note: This is a placeholder contact page. For a real application, this form would submit to a backend service or email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-1 text-sm"><UserIcon className="h-4 w-4"/> Your Name</Label>
              <Input id="name" placeholder="John Doe" className="mt-1" disabled />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center gap-1 text-sm"><Mail className="h-4 w-4"/> Your Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="mt-1" disabled />
            </div>
            <div>
              <Label htmlFor="subject" className="flex items-center gap-1 text-sm"><FileTextIcon className="h-4 w-4"/> Subject</Label>
              <Input id="subject" placeholder="Briefly describe your issue or question" className="mt-1" disabled />
            </div>
            <div>
              <Label htmlFor="message" className="flex items-center gap-1 text-sm"><MessageSquare className="h-4 w-4"/> Message</Label>
              <Textarea id="message" placeholder="Please describe your issue in detail..." rows={5} className="mt-1" disabled />
            </div>
          </div>
          <Button className="w-full" disabled>Submit Support Request (Placeholder)</Button>
          
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>Alternatively, you can email us directly at:</p>
            <p className="font-semibold text-primary">support@sheild-example.com (Placeholder)</p>
            <p className="mt-2">Our support team aims to respond within 24-48 business hours.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
