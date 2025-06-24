
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs,getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Users, Crown, AlertTriangle } from "lucide-react";
import { UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const USER_PROFILES_COLLECTION = 'userProfiles';

const planLimits: Record<UserProfile['planId'], number> = {
    free: 1,
    trial: 10, // Assuming trial gives Pro level access
    pro: 10,
    premium: 30,
    enterprise: 100,
};

export default function UserManagementPage() {
    const { user } = useAuth();

    // Fetch current user's profile to get organizationId and planId
    const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile | null>({
        queryKey: [USER_PROFILES_COLLECTION, user?.uid],
        queryFn: async () => {
            if (!user?.uid) return null;
            const profileRef = doc(db, USER_PROFILES_COLLECTION, user.uid);
            const profileSnap = await getDoc(profileRef);
            return profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } as UserProfile : null;
        },
        enabled: !!user?.uid,
    });

    // Fetch user count for the organization
    const { data: userCount, isLoading: isLoadingCount } = useQuery<number>({
        queryKey: ['userCount', userProfile?.organizationId],
        queryFn: async () => {
            if (!userProfile?.organizationId) return 0;
            const q = query(collection(db, USER_PROFILES_COLLECTION), where("organizationId", "==", userProfile.organizationId));
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        },
        enabled: !!userProfile?.organizationId,
    });

    const isLoading = isLoadingProfile || isLoadingCount;
    const currentPlan = userProfile?.planId || 'free';
    const limit = planLimits[currentPlan];
    const canAddUsers = (userCount ?? 0) < limit;

    if (userProfile?.role !== 'admin') {
        return (
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You do not have permission to manage users. This feature is available to account administrators only.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                    <Users className="h-8 w-8"/> User Management
                </h1>
                <p className="text-muted-foreground">
                    Invite and manage users in your organization. Role assignments coming soon.
                </p>
            </div>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-500"/>Subscription Overview</CardTitle>
                    <CardDescription>Your current plan determines the number of users you can have in your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-8 w-64" />
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
                            <p>Your current plan: <strong className="capitalize font-semibold text-primary">{currentPlan}</strong></p>
                            <p>User limit: <strong className="font-semibold">{userCount ?? '...'} / {limit}</strong> users</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Separator/>
            
            <Card>
                <CardHeader>
                    <CardTitle>Invite New User</CardTitle>
                     <CardDescription>Invite a new user to join your organization via email.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-grow">
                            <p className="text-sm text-muted-foreground">
                                This feature is under development. Soon you will be able to invite users and assign them specific roles like SHE Officer, Representative, or Visitor.
                            </p>
                            {!canAddUsers && !isLoading && (
                                <p className="text-sm text-destructive font-semibold mt-2">
                                    You have reached your user limit for the {currentPlan} plan. Please upgrade your subscription to add more users.
                                </p>
                            )}
                        </div>
                        <Button disabled={true || !canAddUsers || isLoading}>
                            <UserPlus className="mr-2 h-4 w-4"/>
                            Invite User (Coming Soon)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
