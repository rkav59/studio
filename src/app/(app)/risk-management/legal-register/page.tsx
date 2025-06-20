
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription as UiAlertDescription, AlertTitle as UiAlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowLeft, AlertCircle, FileText, Landmark, Tag, BookOpen, Search, ShieldAlert } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, GenerateLegalRegisterOutput, LegalRegisterItem } from '@/lib/types';
import { generateLegalRegister } from '@/ai/flows/generate-legal-register-flow';
import { Separator } from '@/components/ui/separator';

const USER_PROFILES_COLLECTION = 'userProfiles';

export default function LegalRegisterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [legalRegister, setLegalRegister] = useState<GenerateLegalRegisterOutput | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const fetchUserProfile = async () => {
        setIsLoadingProfile(true);
        setError(null);
        try {
          const userProfileRef = doc(db, USER_PROFILES_COLLECTION, user.uid);
          const docSnap = await getDoc(userProfileRef);
          if (docSnap.exists()) {
            setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            setError("User profile not found. Please ensure your country is set in your profile (re-signup might be needed if country was not captured).");
            toast({ title: "Profile Error", description: "User profile or country information missing.", variant: "destructive" });
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
          setError("Failed to load user profile.");
          toast({ title: "Error", description: "Could not load user profile.", variant: "destructive" });
        }
        setIsLoadingProfile(false);
      };
      fetchUserProfile();
    } else {
      setIsLoadingProfile(false);
    }
  }, [user?.uid, toast]);

  const fetchLegalRegister = async () => {
    if (!userProfile?.country) {
      setError("Country information is missing from your profile. Cannot generate legal register.");
      toast({ title: "Missing Information", description: "Country is required to generate the legal register.", variant: "destructive" });
      return;
    }
    setIsLoadingRegister(true);
    setError(null);
    // Keep existing legalRegister data while loading to avoid UI flicker if user just wants to refresh
    // setLegalRegister(null); // Commented out to keep old data during refresh
    try {
      const result = await generateLegalRegister({ country: userProfile.country });
      setLegalRegister(result);
    } catch (e) {
      console.error("Error generating legal register:", e);
      setError("Failed to generate legal register. The AI service might be temporarily unavailable or encountered an issue.");
      toast({ title: "Generation Failed", description: "Could not generate the legal register.", variant: "destructive" });
    }
    setIsLoadingRegister(false);
  };

  useEffect(() => {
    // Only fetch automatically if no data and no error, and profile is loaded with country
    if (userProfile?.country && !legalRegister && !isLoadingRegister && !error && !isLoadingProfile) {
      fetchLegalRegister();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, isLoadingProfile]); // Depend on userProfile and its loading state

  const renderLegalItem = (item: LegalRegisterItem) => (
    <Card key={item.title} className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-primary flex items-center gap-2">
          <FileText className="h-5 w-5" /> {item.title}
        </CardTitle>
        <CardDescription className="text-xs">
          <strong>Type:</strong> {item.type}
          {item.issuingBody && <> | <strong>Issuing Body:</strong> {item.issuingBody}</>}
          {item.jurisdiction && <> | <strong>Jurisdiction:</strong> {item.jurisdiction}</>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <p className="font-medium text-muted-foreground">Summary:</p>
          <p className="whitespace-pre-wrap text-xs">{item.summary}</p>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Relevance to SHEQ:</p>
          <p className="whitespace-pre-wrap text-xs">{item.relevanceToSheq}</p>
        </div>
        {item.keywords && item.keywords.length > 0 && (
          <div>
            <p className="font-medium text-muted-foreground">Keywords:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {item.keywords.map(kw => <span key={kw} className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">{kw}</span>)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 print-hide"> {/* Added print-hide */}
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/risk-management')} aria-label="Back to Risk Management">
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Landmark className="h-6 w-6 text-green-600" /> SHEQ Legal Register
            </h1>
        </div>
        {/* Button moved into card content when data is loaded */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Country-Specific Legal Requirements</CardTitle>
          <CardDescription>
            AI-generated list of potential SHEQ legal and regulatory items for {userProfile?.country || "your country"}.
            {userProfile?.country ? ` This list is tailored for ${userProfile.country}.` : " Country not found in profile."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !isLoadingRegister && ( // Show error only if not actively loading new data
            <Alert variant="destructive" className="mb-4 print-hide"> {/* Added print-hide */}
              <AlertCircle className="h-4 w-4" />
              <UiAlertTitle>Error</UiAlertTitle>
              <UiAlertDescription>{error}</UiAlertDescription>
            </Alert>
          )}

          {isLoadingRegister && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-3 text-muted-foreground">Generating legal register for {userProfile?.country}... This may take a moment.</p>
            </div>
          )}

          {!isLoadingRegister && legalRegister && (
            <>
              <Alert variant="info" className="mb-6 print-hide"> {/* Added print-hide */}
                <ShieldAlert className="h-4 w-4" />
                <UiAlertTitle>Important Disclaimer</UiAlertTitle>
                <UiAlertDescription>{legalRegister.disclaimer}</UiAlertDescription>
              </Alert>
              <ScrollArea className="max-h-[70vh]"> {/* Simplified max-height */}
                <div className="space-y-4 pr-4"> {/* Added pr-4 for scrollbar */}
                  {legalRegister.legalItems.length > 0 ? (
                    legalRegister.legalItems.map(renderLegalItem)
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No specific legal items were identified by the AI for your criteria, or there was an issue generating them.</p>
                  )}
                </div>
              </ScrollArea>
              <div className="mt-4 text-center print-hide"> {/* Added print-hide and moved button here */}
                <Button onClick={fetchLegalRegister} disabled={isLoadingRegister || !userProfile?.country} variant="default">
                  {isLoadingRegister && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {legalRegister.legalItems.length > 0 ? 'Refresh Register' : 'Generate Register'}
                </Button>
              </div>
            </>
          )}
          {!isLoadingProfile && !userProfile?.country && !isLoadingRegister && !legalRegister && ( // Show if profile loaded, no country, not loading, no data
            <div className="text-muted-foreground text-center py-4 print-hide"> {/* Added print-hide */}
              <p className="mb-2">Please set your country in your user profile to generate a legal register.</p>
              <Button onClick={() => router.push('/user-profile')} variant="secondary">Go to Profile</Button>
            </div>
          )}
           {!isLoadingProfile && userProfile?.country && !isLoadingRegister && !legalRegister && !error && ( // Initial state with country, but no data/error
             <div className="text-center py-4 print-hide"> {/* Added print-hide */}
                <Button onClick={fetchLegalRegister} disabled={isLoadingRegister} variant="default">
                    {isLoadingRegister && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Legal Register for {userProfile.country}
                </Button>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
