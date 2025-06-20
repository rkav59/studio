
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
                <li>Usage Data (collected automatically, e.g., feature usage, IP address for session management)</li>
              </ul>
              <h4>User-Generated Content (SHEQ Data)</h4>
              <p>The primary purpose of SHEild is to manage your Safety, Health, Environment, and Quality (SHEQ) data. This includes information you input regarding incidents, risk assessments, audits, training records, PPE management, contractor information, health monitoring data, emergency preparedness plans, meeting minutes, and any other data entered into the Service's modules ("SHEQ Data"). You own your SHEQ Data. We process this data on your behalf to provide the Service.</p>

              <h2>3. Use of Data</h2>
              <p>SHEild uses the collected data for various purposes:</p>
              <ul>
                <li>To provide and maintain our Service, including all its features and functionalities.</li>
                <li>To manage your account and provide you with customer support.</li>
                <li>To notify you about changes to our Service or important updates.</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so.</li>
                <li>To gather analysis or valuable information so that we can improve our Service, develop new features, and enhance user experience.</li>
                <li>To monitor the usage of our Service for performance, security, and operational purposes.</li>
                <li>To detect, prevent and address technical issues.</li>
                <li>To fulfill any other purpose for which you provide it or with your consent.</li>
              </ul>
              <p><strong>AI-Powered Features:</strong> Some features within SHEild utilize artificial intelligence (AI) models (e.g., through Genkit and Google AI services) to provide suggestions, analysis, or generate content (e.g., safety recommendations, risk assessment assistance, legal register generation). When you use these features, the relevant input data you provide (which may be derived from your SHEQ Data) is sent to these AI models. We strive to use AI responsibly. Data sent to AI models for these specific features will be handled according to the data usage policies of the respective AI service providers (e.g., Google). Where feasible, we aim to use anonymized or aggregated data to train and improve the underlying AI models, taking steps to ensure that such data does not identify individual users or organizations unless explicit consent is given for specific features.</p>

              <h2>4. Data Storage and Security</h2>
              <p>Your Personal Data and SHEQ Data are stored using Firebase services, including Firebase Firestore (for database storage), Firebase Authentication (for user management), and Firebase Storage (for file uploads like documents related to contractors or PPE). We are committed to protecting the security of your data and implement reasonable technical and organizational measures designed to prevent unauthorized access, use, alteration, or disclosure. However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee its absolute security.</p>

              <h2>5. Data Retention</h2>
              <p>We will retain your Personal Data for as long as your account is active or as needed to provide you the Service and fulfill the purposes outlined in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.</p>
              <p>Your SHEQ Data is retained as long as your account is active or as needed to provide you the Service. You are responsible for managing your SHEQ Data, including its deletion, through the Service features where available, or by requesting account deletion.</p>

              <h2>6. Your Data Protection Rights</h2>
              <p>Depending on your location and applicable data protection laws, you may have certain rights regarding your Personal Data. These may include:</p>
              <ul>
                <li>The right to access, update, or delete the information we have on you. You can access and update most of your Personal Data through your User Profile page.</li>
                <li>The right of rectification if your information is inaccurate or incomplete.</li>
                <li>The right to object to our processing of your Personal Data.</li>
                <li>The right to request that we restrict the processing of your Personal Data.</li>
                <li>The right to data portability, allowing you to obtain a copy of your Personal Data in a structured, commonly used, and machine-readable format.</li>
                <li>The right to withdraw consent at any time where SHEild relied on your consent to process your Personal Data.</li>
              </ul>
              <p>To exercise any of these rights, please contact us using the details provided in the "Contact Us" section. We may need to verify your identity before responding to such requests.</p>

              <h2>7. Service Providers</h2>
              <p>We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), provide the Service on our behalf, perform Service-related services, or assist us in analyzing how our Service is used. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>
              <p>Our primary infrastructure provider is Google Firebase, which provides database, authentication, storage, and hosting services. Generative AI features may utilize models from Google (e.g., Gemini via Genkit). Data sent to these models is subject to Google's data usage policies for their AI services.</p>

              <h2>8. Links to Other Sites</h2>
              <p>Our Service may contain links to other sites that are not operated by us. If you click a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>

              <h2>9. Children's Privacy</h2>
              <p>Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.</p>

              <h2>10. Changes to This Privacy Policy</h2>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. We will let you know via email and/or a prominent notice on our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.</p>
              <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

              <h2>11. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at sentriq263@gmail.com.</p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

