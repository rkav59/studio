
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FaqPage() {
  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "You can reset your password from the User Profile page. Click on 'Send Password Reset Email', and follow the instructions sent to your registered email address.",
    },
    {
      question: "How is my data stored and protected?",
      answer: "Your data is stored securely using Firebase Firestore and Firebase Storage. We implement industry-standard security practices to protect your information. For more details, please see our Privacy Policy.",
    },
    {
      question: "Can I customize the dashboard KPIs?",
      answer: "Yes, you can configure KPI thresholds and visibility on the Dashboard under 'Configure KPI Settings'. You can also suggest new KPIs using the form on the dashboard page.",
    },
    {
      question: "Is there a mobile app available?",
      answer: "Currently, SHEild is a web-based application accessible on all devices through a web browser. We are considering a dedicated mobile app for future development.",
    },
    {
      question: "How do I get support if I encounter an issue?",
      answer: "Please use the 'Contact Support' link in your User Profile page, or email us directly at support@sheild-example.com (this is a placeholder email).",
    },
    {
        question: "What are SHEQ Audits?",
        answer: "SHEQ Audits are systematic, independent, and documented processes for obtaining audit evidence and evaluating it objectively to determine the extent to which audit criteria are fulfilled. Our SHEQ Audit module helps you schedule, conduct, and track these audits."
    },
    {
        question: "What is a Risk Register?",
        answer: "A Risk Register is a central log of identified risks, their analysis, evaluation, treatment plans, and ongoing monitoring. It's a key component of an effective risk management system as per ISO 31000."
    }
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <HelpCircle className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Find answers to common questions about SHEild.</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
