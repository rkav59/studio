
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FaqPage() {
  const faqs = [
    {
      question: "What is SHEild and what can it do?",
      answer: "SHEild is a comprehensive platform designed to help organizations manage their Safety, Health, Environment, and Quality (SHEQ) processes. Key features include incident logging, risk assessment, SHEQ audits, training and competence tracking, emergency preparedness, PPE management, contractor safety, health monitoring, AI-driven safety recommendations, and data visualization.",
    },
    {
      question: "How do I log an incident, near miss, or hazard?",
      answer: "Navigate to the 'Risk Management' module. You'll find options to 'Log New Incident/Event'. Select the appropriate type (Incident, Near Miss, or Hazard) and fill in the required details such as description, location, date, and classification.",
    },
    {
      question: "How does the AI assist with risk management?",
      answer: "SHEild uses AI to help you in several ways: \n - **Hazard Identification:** Describe an activity, and the AI can suggest potential hazards. \n - **Risk Assessment Suggestions:** Provide activity details and identified hazards, and the AI can suggest potential risks, control measures (based on hierarchy of controls), and suitable assessment methodologies. \n - **Root Cause Suggestions:** For incidents or risks, the AI can help brainstorm potential underlying root causes based on the description and findings.",
    },
    {
      question: "Can I create custom audit checklists?",
      answer: "Yes! Go to the 'Checklist Template Library' (accessible from the SHEQ Audit module or main navigation). You can create new templates from scratch or copy and modify existing system templates. These custom templates can then be used when scheduling new audits.",
    },
    {
      question: "How are non-conformances from audits handled?",
      answer: "When conducting an audit using the 'Audit Execution Form' in the SHEQ Audit module, you can log non-conformances directly. For each non-conformance, you can describe it, set a severity, link it to a checklist item, and detail proposed corrective and preventive actions (CAPA), including assigning responsibility and due dates.",
    },
    {
      question: "How does SHEild manage contractor safety?",
      answer: "The 'Contractor Safety' module allows you to register contractors, track their vetting status, safety induction completion, and manage associated documents (like insurance, certifications). You can also create and manage Permits to Work (PTW) for high-risk activities and log on-site supervision records linked to these PTWs.",
    },
    {
      question: "What features are available for PPE Management?",
      answer: "The 'PPE Management' module helps you maintain an inventory of PPE items, track stock levels, and set reorder points. You can log PPE issuances to employees and record their return. It also includes functionality for scheduling and recording PPE inspections, and defining standard PPE requirements for different job roles using the PPE Job Role Matrix.",
    },
    {
      question: "How can I monitor employee health and exposure?",
      answer: "The 'Health Monitoring' module allows you to define Similar Exposure Groups (SEGs), log Industrial Hygiene (IH) sample results (e.g., noise, dust, chemicals), and track employee medical tests or screenings, including certificate expiry dates. You can also manage and track employee wellness programs.",
    },
    {
      question: "How do I reset my password?",
      answer: "You can reset your password from the User Profile page. Click on 'Send Password Reset Email', and follow the instructions sent to your registered email address.",
    },
    {
      question: "How is my data stored and protected?",
      answer: "Your data is stored securely using Firebase Firestore (for data like incidents, audits) and Firebase Storage (for any uploaded documents). We implement industry-standard security practices to protect your information. For more details, please see our Privacy Policy.",
    },
    {
        question: "What is the purpose of the AI-generated Legal Register?",
        answer: "The Legal Register feature, found in the 'Risk Management' module, uses AI to generate a list of potentially relevant SHEQ legal and regulatory items based on the country specified in your user profile. This is intended as an informational starting point and should be verified with professional legal advice for compliance.",
    },
    {
      question: "Can I customize the dashboard KPIs?",
      answer: "Yes, you can configure KPI thresholds and visibility from the 'Dashboard' by clicking 'Configure KPI Settings'. You can also suggest new KPIs using the form on the dashboard page.",
    },
    {
      question: "Is there a mobile app available?",
      answer: "Currently, SHEild is a web-based application accessible on all devices through a web browser. We are considering a dedicated mobile app for future development.",
    },
    {
      question: "How do I get support if I encounter an issue?",
      answer: "Please use the 'Contact Support' link in your User Profile page, or email us directly at support@sheild-example.com (this is a placeholder email).",
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
                <AccordionContent className="text-muted-foreground whitespace-pre-line">
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
