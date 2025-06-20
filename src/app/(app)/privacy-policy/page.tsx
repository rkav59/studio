
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">Privacy Policy</h1>
        <p className="text-muted-foreground">Your privacy is important to us. This policy explains how we handle your data.</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
              
              <h2>1. Introduction</h2>
              <p>SHEild ("us", "we", or "our") operates the SHEild platform (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
              <p>We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.</p>

              <h2>2. Information Collection and Use</h2>
              <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
              <h3>Types of Data Collected</h3>
              <h4>Personal Data</h4>
              <p>While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:</p>
              <ul>
                <li>Email address</li>
                <li>Full name</li>
                <li>Country of operation</li>
                <li>Usage Data (collected automatically)</li>
              </ul>
              <h4>User-Generated Content (SHEQ Data)</h4>
              <p>The primary purpose of SHEild is to manage your Safety, Health, Environment, and Quality (SHEQ) data. This includes information you input regarding incidents, risk assessments, audits, training records, etc. ("SHEQ Data"). You own your SHEQ Data. We process this data on your behalf to provide the Service.</p>

              <h2>3. Use of Data</h2>
              <p>SHEild uses the collected data for various purposes:</p>
              <ul>
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To fulfill any other purpose for which you provide it.</li>
              </ul>
              <p>Specifically for AI-powered features, anonymized or aggregated SHEQ Data may be used to train and improve the underlying AI models. We will take steps to ensure that such data does not identify individual users or organizations unless explicit consent is given for specific features.</p>

              <h2>4. Data Storage and Security</h2>
              <p>Your Personal Data and SHEQ Data are stored using Firebase services (Firestore, Firebase Authentication, Firebase Storage). We take the security of your data seriously and implement reasonable measures to protect it from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or method of electronic storage is 100% secure.</p>

              <h2>5. Data Retention</h2>
              <p>We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies. Your SHEQ Data is retained as long as your account is active or as needed to provide you the Service.</p>

              <h2>6. Your Data Protection Rights</h2>
              <p>Depending on your location, you may have certain data protection rights. These may include:</p>
              <ul>
                <li>The right to access, update or delete the information we have on you.</li>
                <li>The right of rectification.</li>
                <li>The right to object.</li>
                <li>The right of restriction.</li>
                <li>The right to data portability.</li>
                <li>The right to withdraw consent.</li>
              </ul>
              <p>You can typically manage your account information through your User Profile page. For other requests, please contact us.</p>

              <h2>7. Service Providers</h2>
              <p>We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), provide the Service on our behalf, perform Service-related services, or assist us in analyzing how our Service is used. Firebase (Google) is our primary service provider for backend infrastructure, database, authentication, and storage.</p>
              <p>Generative AI features may utilize models from Google (e.g., Gemini via Genkit). Data sent to these models is subject to Google's AI data usage policies.</p>

              <h2>8. Links to Other Sites</h2>
              <p>Our Service may contain links to other sites that are not operated by us. If you click a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.</p>

              <h2>9. Children's Privacy</h2>
              <p>Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Child has provided us with Personal Data, please contact us.</p>

              <h2>10. Changes to This Privacy Policy</h2>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>

              <h2>11. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at [Your Contact Email, e.g., privacy@sheild-example.com].</p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
