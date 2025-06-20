
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Terms of Service</h1>
        <p className="text-muted-foreground">Please read these terms carefully before using SHEild.</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
              
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing or using the SHEild platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service.</p>

              <h2>2. Description of Service</h2>
              <p>SHEild provides a comprehensive platform for managing Safety, Health, Environment, and Quality (SHEQ) data, including risk management, incident reporting, audits, training records, and more.</p>

              <h2>3. User Accounts</h2>
              <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
              <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
              <p>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

              <h2>4. User Data</h2>
              <p>You retain all rights to any data, information, or material you submit or upload to the Service ("User Data"). You grant us a limited license to use, process, and store User Data solely for the purpose of providing and improving the Service.</p>
              <p>We will implement reasonable and appropriate measures designed to help you secure your User Data against accidental or unlawful loss, access, or disclosure.</p>

              <h2>5. Acceptable Use</h2>
              <p>You agree not to use the Service:</p>
              <ul>
                <li>In any way that violates any applicable national or international law or regulation.</li>
                <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm the Company or users of the Service or expose them to liability.</li>
              </ul>

              <h2>6. AI-Generated Content</h2>
              <p>Certain features of the Service may utilize artificial intelligence (AI) to generate suggestions, analysis, or content ("AI Content"). AI Content is provided for informational purposes only and should not be solely relied upon for decision-making. You are responsible for reviewing and validating any AI Content before implementation. We make no warranties regarding the accuracy, completeness, or reliability of AI Content.</p>

              <h2>7. Termination</h2>
              <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
              <p>Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.</p>

              <h2>8. Limitation of Liability</h2>
              <p>In no event shall SHEild, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.</p>
              
              <h2>9. Disclaimer</h2>
              <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.</p>
              <p>SHEild, its subsidiaries, affiliates, and its licensors do not warrant that a) the Service will function uninterrupted, secure or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements.</p>

              <h2>10. Governing Law</h2>
              <p>These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction/Country, e.g., "the State of California, United States"], without regard to its conflict of law provisions.</p>

              <h2>11. Changes</h2>
              <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

              <h2>12. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us at [Your Contact Email, e.g., legal@sheild-example.com].</p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
