
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
        <p className="text-muted-foreground">Please read these terms carefully before using SHEiQpro.</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
              
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing or using the SHEiQpro platform ("Service"), operated by SHEiQpro ("Company", "us", "we", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service. Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who wish to access or use the Service.</p>

              <h2>2. Description of Service</h2>
              <p>SHEiQpro provides a comprehensive platform for managing Safety, Health, Environment, and Quality (SHEQ) data and processes. Features include, but are not limited to, incident logging, risk assessment and management (including AI-assisted tools), SHEQ audit management, checklist template creation, training and competence tracking, emergency preparedness planning, Personal Protective Equipment (PPE) management, contractor safety management, health monitoring, SHE meetings and programs management, data visualization, and AI-driven safety recommendations ("Features"). The Service is provided on an "as is" and "as available" basis.</p>

              <h2>3. User Accounts</h2>
              <p>When you create an account with us, you guarantee that the information you provide is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.</p>
              <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
              <p>You may not use as a username the name of another person or entity or that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity other than you, without appropriate authorization. You may not use as a username any name that is offensive, vulgar, or obscene.</p>

              <h2>4. User Data and Content</h2>
              <p>You retain all rights, title, and interest in and to any data, information, text, graphics, videos, or other material that you upload, submit, store, send, or receive on or through the Service ("User Data"). You grant the Company a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform the User Data solely in connection with providing and improving the Service and its Features.</p>
              <p>You are solely responsible for your User Data and the consequences of posting, publishing, or sharing it. We do not endorse any User Data or any opinion, recommendation, or advice expressed therein, and we expressly disclaim any and all liability in connection with User Data.</p>
              <p>We will implement reasonable and appropriate measures designed to help you secure your User Data against accidental or unlawful loss, access, or disclosure. However, the Company cannot guarantee that unauthorized third parties will never be able to defeat our security measures or use your User Data for improper purposes.</p>

              <h2>5. Acceptable Use Policy</h2>
              <p>You agree not to use the Service:</p>
              <ul>
                <li>In any way that violates any applicable national or international law or regulation.</li>
                <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm the Company or users of the Service or expose them to liability.</li>
                <li>To upload or transmit viruses, Trojan horses, worms, time bombs, cancelbots, corrupted files, or any other similar software or programs that may damage the operation of another's computer or property of another.</li>
              </ul>

              <h2>6. AI-Generated Content and Recommendations</h2>
              <p>Certain Features of the Service may utilize artificial intelligence (AI) to generate suggestions, analysis, recommendations, or other content ("AI Content"). AI Content is provided for informational and assistive purposes only and should not be solely relied upon for decision-making, compliance, or safety-critical applications. You are solely responsible for reviewing, validating, and appropriately using any AI Content. The Company makes no warranties or representations regarding the accuracy, completeness, reliability, or suitability of AI Content for any particular purpose. You acknowledge that AI systems can make mistakes and produce inaccurate information.</p>

              <h2>7. Intellectual Property</h2>
              <p>The Service and its original content (excluding User Data), features, and functionality are and will remain the exclusive property of the Company and its licensors. The Service is protected by copyright, trademark, and other laws of both [Your Jurisdiction/Country] and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of the Company.</p>

              <h2>8. Termination</h2>
              <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
              <p>If you wish to terminate your account, you may simply discontinue using the Service. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>

              <h2>9. Limitation of Liability</h2>
              <p>In no event shall the Company, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.</p>
              
              <h2>10. Disclaimer of Warranties</h2>
              <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.</p>
              <p>The Company, its subsidiaries, affiliates, and its licensors do not warrant that a) the Service will function uninterrupted, secure or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements or expectations.</p>

              <h2>11. Governing Law</h2>
              <p>These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction/Country, e.g., "the State of California, United States"], without regard to its conflict of law provisions.</p>
              <p>Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have had between us regarding the Service.</p>

              <h2>12. Changes to Terms</h2>
              <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
              <p>By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.</p>

              <h2>13. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us at sentriq263@gmail.com.</p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
