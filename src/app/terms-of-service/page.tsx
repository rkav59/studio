import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service | SHEiQpro",
  description: "Terms governing use of the SHEiQpro platform.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">SHEiQpro Terms of Service</h1>
          <p className="mt-2 text-muted-foreground">Last updated: 14 November 2026</p>
        </header>
        <Card><CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none p-6">
          <p>These Terms of Service (“Terms”) govern your use of <a href="https://sheiqpro.com">sheiqpro.com</a> and the SHEiQpro application, operated by SHEiQco (“SHEiQpro”, “we”, “us”, or “our”). By creating an account or using the service, you agree to these Terms.</p>
          <h2>1. The service</h2>
          <p>SHEiQpro provides software for organising SHEQ information and workflows, including risk management, incidents, audits, training, contractors, PPE, reports, legal registers, and related tools. Features may change, be limited, or be withdrawn.</p>
          <h2>2. Account responsibility</h2>
          <p>You must provide accurate information, keep your sign-in credentials secure, and promptly report unauthorised access. You are responsible for activity under your account and for ensuring that users invited to your organisation are authorised.</p>
          <h2>3. Organisation data</h2>
          <p>You retain responsibility for the accuracy, lawfulness, confidentiality, and permissions relating to information uploaded by you or your organisation. You authorise us to process that information only to provide, secure, support, and improve the service.</p>
          <h2>4. Acceptable use</h2>
          <p>You must not misuse the service, bypass access controls, upload malware, infringe another person’s rights, unlawfully process personal information, disrupt the service, or use the service to create a safety risk. You must comply with applicable laws and workplace requirements.</p>
          <h2>5. Safety and AI disclaimer</h2>
          <p>SHEiQpro is a management and documentation tool. It does not replace competent professional judgement, site inspections, legal advice, emergency services, regulatory requirements, or an organisation’s duty to protect people. AI-generated content is a draft aid, may contain errors, and must be independently reviewed before use.</p>
          <h2>6. Intellectual property</h2>
          <p>We and our licensors own the service, software, branding, and platform content. Subject to these Terms, you receive a limited, non-exclusive, non-transferable right to use the service for your organisation’s internal business purposes.</p>
          <h2>7. Availability and third parties</h2>
          <p>We aim to keep the service available but do not guarantee uninterrupted or error-free operation. The service may depend on third-party providers, including Supabase, Google, and hosting providers, whose services are governed by their own terms.</p>
          <h2>8. Suspension and termination</h2>
          <p>We may suspend or terminate access for security, legal, operational, non-payment, or breach reasons. You may stop using the service or request account closure. Subject to legal and operational requirements, we will handle organisation data according to the Privacy Policy and any applicable subscription agreement.</p>
          <h2>9. Disclaimers and liability</h2>
          <p>The service is provided on an “as available” basis. To the maximum extent permitted by law, SHEiQpro disclaims implied warranties and is not responsible for indirect, incidental, special, or consequential loss arising from use of the service. Nothing in these Terms excludes liability that cannot lawfully be excluded.</p>
          <h2>10. Changes</h2>
          <p>We may update these Terms by posting a revised version on this page. Continued use after the effective date means you accept the updated Terms.</p>
          <h2>11. Governing law and contact</h2>
          <p>These Terms are governed by the laws applicable in Zimbabwe, subject to any mandatory rights that apply where you live. Questions about these Terms should be sent to <a href="mailto:rapportsango@gmail.com">rapportsango@gmail.com</a>.</p>
        </CardContent></Card>
      </div>
    </main>
  );
}
