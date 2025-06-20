
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ProfileUpdateForm } from '@/components/user-profile/profile-update-form';
import { PasswordChangeSection } from '@/components/user-profile/password-change-section';
import type { UserProfile } from '@/lib/types';
import { Mail, User as UserIcon, Globe, Shield, HelpCircle, FileText as FileTextIcon, Phone } from 'lucide-react'; // Aliased FileText
import Link from 'next/link';

const USER_PROFILES_COLLECTION = 'userProfiles';

export default function UserProfilePage() {
  const { user, updateUserDisplayName } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: userProfile, isLoading: isLoadingProfile, error: profileError } = useQuery<UserProfile | null>({
    queryKey: [USER_PROFILES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const profileRef = doc(db, USER_PROFILES_COLLECTION, user.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        return { id: profileSnap.id, ...profileSnap.data() } as UserProfile;
      }
      // If profile doesn't exist, create a basic one (though signup should handle this ideally)
      const basicProfile: Omit<UserProfile, 'id'> = {
          email: user.email || "",
          displayName: user.displayName || "",
          country: "", // Default empty, user needs to set it
          createdAt: new Date().toISOString(),
      };
      await updateDoc(profileRef, basicProfile, { merge: true }); // Use updateDoc with merge to create if not exists
      return {id: user.uid, ...basicProfile };
    },
    enabled: !!user?.uid,
  });

  const profileUpdateMutation = useMutation({
    mutationFn: async (updatedData: { displayName?: string; country?: string }) => {
      if (!user?.uid || !userProfile) throw new Error("User or profile not available.");
      
      const dataToUpdate: Partial<UserProfile> = {};
      if (updatedData.displayName && updatedData.displayName !== userProfile.displayName) {
        await updateUserDisplayName(updatedData.displayName); // Updates Firebase Auth display name
        dataToUpdate.displayName = updatedData.displayName;
      }
      if (updatedData.country && updatedData.country !== userProfile.country) {
        dataToUpdate.country = updatedData.country;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        const profileRef = doc(db, USER_PROFILES_COLLECTION, user.uid);
        await updateDoc(profileRef, dataToUpdate);
      }
      return dataToUpdate;
    },
    onSuccess: (updatedFields) => {
      queryClient.invalidateQueries({ queryKey: [USER_PROFILES_COLLECTION, user?.uid] });
      let successMessage = "Profile updated successfully.";
      if (updatedFields.displayName && updatedFields.country) {
        successMessage = "Display name and country updated.";
      } else if (updatedFields.displayName) {
        successMessage = "Display name updated.";
      } else if (updatedFields.country) {
        successMessage = "Country updated.";
      }
      toast({ title: "Success", description: successMessage });
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Card><CardHeader><Skeleton className="h-8 w-1/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card><CardHeader><Skeleton className="h-8 w-1/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent><Skeleton className="h-10 w-1/2" /></CardContent>
        </Card>
      </div>
    );
  }

  if (profileError) {
    return <div className="text-red-500">Error loading profile: {profileError.message}</div>;
  }

  if (!user || !userProfile) {
    return <div className="text-muted-foreground">User profile not available.</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight font-headline">User Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5 text-primary"/>Account Information</CardTitle>
          <CardDescription>View and update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email" className="flex items-center gap-1 text-sm text-muted-foreground"><Mail className="h-4 w-4"/>Email</Label>
            <Input id="email" value={userProfile.email} readOnly disabled className="bg-muted/50"/>
          </div>
          <ProfileUpdateForm
            initialDisplayName={userProfile.displayName || ""}
            initialCountry={userProfile.country || ""}
            onUpdate={(data) => profileUpdateMutation.mutate(data)}
            isSubmitting={profileUpdateMutation.isPending}
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/>Security</CardTitle>
          <CardDescription>Manage your account security settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeSection currentEmail={userProfile.email}/>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary"/>Support & Legal</CardTitle>
          <CardDescription>Access help resources and legal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/faq"><FileTextIcon className="mr-2 h-4 w-4"/>Frequently Asked Questions (FAQ)</Link>
            </Button>
             <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/terms-of-service"><FileTextIcon className="mr-2 h-4 w-4"/>Terms of Service</Link>
            </Button>
             <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/privacy-policy"><FileTextIcon className="mr-2 h-4 w-4"/>Privacy Policy</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/contact-support"><Phone className="mr-2 h-4 w-4"/>Contact Support</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

