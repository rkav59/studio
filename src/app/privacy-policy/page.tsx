import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | SHEiQpro",
  description: "How SHEiQpro collects, uses, stores, and protects personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="text-center">
          <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">SHEiQpro Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground">Last updated: 14 November 2026</p>
        </header>
        <Card><CardContent className="prose prose-sm sm:prose-base dark:prose-invert max-w-none p-6">
          <p>This Privacy Policy explains how SHEiQpro, operated by SHEiQco (“SHEiQpro”, “we”, “us”, or “our”), handles information when you use <a href="https://sheiqpro.com">sheiqpro.com</a> and the SHEiQpro application.</p>
          <h2>1. Information we collect</h2>
          <p>We may collect your name, email address, organisation, country, role, authentication details, and information you enter into the platform. This may include risk assessments, incidents, audits, training records, contractor records, PPE records, legal registers, documents, and related SHEQ information.</p>
          <p>We also receive technical information such as browser and device details, log information, approximate location inferred from network data, and activity needed to secure and operate the service.</p>
          <h2>2. How we use information</h2>
          <ul><li>To create and secure accounts, including Google sign-in.</li><li>To provide dashboards, reports, workflows, reminders, and collaboration features.</li><li>To respond to support requests and communicate service changes.</li><li>To maintain security, prevent abuse, troubleshoot, and improve the platform.</li><li>To comply with legal obligations and enforce our agreements.</li></ul>
          <h2>3. Organisation data</h2>
          <p>SHEiQpro is an organisation platform. Your organisation may control your access and may be able to view, manage, export, or delete information submitted under its organisation account. If you use SHEiQpro through an organisation, direct data requests to that organisation or contact us for assistance.</p>
          <h2>4. Service providers</h2>
          <p>We use trusted infrastructure and service providers, including Supabase for authentication, database, storage, and related services; Google for Google authentication and, where enabled, AI services; and hosting and operational providers needed to deliver the platform. Providers process information only as needed to provide their services and under their applicable terms and privacy policies.</p>
          <h2>5. AI features</h2>
          <p>Where an AI feature is enabled, information submitted to that feature may be processed to generate suggestions, summaries, classifications, or draft content. AI output may be inaccurate and must be reviewed by a qualified person. Do not submit information to an AI feature unless your organisation is authorised to do so.</p>
          <h2>6. Retention and security</h2>
          <p>We retain information while an account or organisation relationship is active and for as long as reasonably necessary for the purposes described above, legal obligations, dispute resolution, and security. We use reasonable technical and organisational safeguards, but no internet service can guarantee absolute security.</p>
          <h2>7. Your choices and rights</h2>
          <p>Depending on applicable law, you may request access, correction, deletion, restriction, portability, or information about processing. You may also withdraw consent where processing relies on consent. We may verify your identity and coordinate with your organisation before completing a request.</p>
          <h2>8. International processing</h2>
          <p>Your information may be processed in countries other than where you live. Where required, we use appropriate safeguards for such transfers.</p>
          <h2>9. Children</h2>
          <p>SHEiQpro is intended for workplace and organisational use and is not directed to children under 18. We do not knowingly collect children’s personal information.</p>
          <h2>10. Changes</h2>
          <p>We may update this policy from time to time. We will post the updated version on this page and revise the date above.</p>
          <h2>11. Contact</h2>
          <p>For privacy questions or requests, email <a href="mailto:rapportsango@gmail.com">rapportsango@gmail.com</a>.</p>
        </CardContent></Card>
      </div>
    </main>
  );
}
