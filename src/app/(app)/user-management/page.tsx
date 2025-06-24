

"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, getCountFromServer, doc, getDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, UserPlus, Users, Crown, AlertTriangle, Search, Mail, KeyRound } from "lucide-react";
import { UserProfile, UserRole } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const USER_PROFILES_COLLECTION = 'userProfiles';
const MAIL_COLLECTION = 'mail'; // Collection for the firestore-send-email extension
const USER_ROLES: UserRole[] = ['admin', 'she_officer', 'authorizer', 'she_rep', 'visitor'];

const planLimits: Record<UserProfile['planId'], number> = {
    free: 1,
    trial: 10,
    pro: 10,
    premium: 30,
    enterprise: 100,
};

export default function UserManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<UserRole>("visitor");
    const [isInviting, setIsInviting] = useState(false);


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

    // Fetch all users in the organization
    const { data: organizationUsers = [], isLoading: isLoadingOrgUsers } = useQuery<UserProfile[]>({
        queryKey: ['organizationUsers', userProfile?.organizationId],
        queryFn: async () => {
            if (!userProfile?.organizationId) return [];
            const q = query(collection(db, USER_PROFILES_COLLECTION), where("organizationId", "==", userProfile.organizationId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        },
        enabled: !!userProfile?.organizationId,
    });

    const userCount = organizationUsers.length;
    const isLoading = isLoadingProfile || isLoadingOrgUsers;
    const currentPlan = userProfile?.planId || 'free';
    const limit = planLimits[currentPlan];
    const canAddUsers = userCount < limit;

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return organizationUsers;
        return organizationUsers.filter(u =>
            u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [organizationUsers, searchTerm]);
    
    const handleSendInvite = async () => {
        if (!inviteEmail || !inviteRole) {
            toast({
                title: "Missing Information",
                description: "Please provide an email and select a role.",
                variant: "destructive",
            });
            return;
        }
        
        setIsInviting(true);
        
        // This function now writes a document to the 'mail' collection.
        // The `firestore-send-email` extension should be configured to watch this collection.
        try {
            await addDoc(collection(db, MAIL_COLLECTION), {
                to: [inviteEmail],
                message: {
                    subject: `You're invited to join ${userProfile?.organizationId || 'an organization'} on SHEiQpro!`,
                    html: `
                        <p>Hello,</p>
                        <p>You have been invited to join an organization on SHEiQpro with the role of <strong>${inviteRole.replace('_', ' ')}</strong>.</p>
                        <p>Please click the following link to sign up and create your account:</p>
                        <a href="${window.location.origin}/sign-up">Create Your Account</a>
                        <p>During sign-up, please use this email address: ${inviteEmail}</p>
                        <p>Thank you,</p>
                        <p>The SHEiQpro Team</p>
                    `,
                },
            });

            toast({
                title: "Invitation Sent",
                description: `An invitation has been sent to ${inviteEmail}.`,
            });
            
            setIsInviteDialogOpen(false);
            setInviteEmail("");
            setInviteRole("visitor");

        } catch (error) {
            console.error("Error creating invitation document:", error);
            toast({
                title: "Invitation Failed",
                description: "Could not create the invitation record. Please check console for errors.",
                variant: "destructive",
            });
        } finally {
            setIsInviting(false);
        }
    };

    if (isLoadingProfile) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
            </div>
        );
    }
    
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
                    Invite and manage users in your organization. Role-based access will be enforced in future updates.
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
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Organization Users</CardTitle>
                        <CardDescription>Manage users in your organization.</CardDescription>
                    </div>
                     <div className="flex w-full md:w-auto items-center gap-2">
                        <div className="relative flex-grow">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by name or email..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button disabled={!canAddUsers || isLoading}>
                                    <UserPlus className="mr-2 h-4 w-4"/>
                                    Invite User
                                </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Invite New User</DialogTitle>
                                    <DialogDescription>
                                        Enter the user's email and assign them a role. An invitation email will be sent automatically.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center gap-1"><Mail className="h-4 w-4"/>Email</Label>
                                        <Input id="email" type="email" placeholder="new.user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="flex items-center gap-1"><KeyRound className="h-4 w-4"/>Role</Label>
                                        <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {USER_ROLES.map(role => (
                                                    <SelectItem key={role} value={role} className="capitalize">
                                                        {role.replace('_', ' ')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button onClick={handleSendInvite} disabled={isInviting}>
                                        {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send Invite
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {!canAddUsers && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <CardTitle>User Limit Reached</CardTitle>
                            <CardDescription>
                                You have reached the user limit for the <span className="font-semibold capitalize">{currentPlan}</span> plan. Please upgrade your subscription to add more users.
                            </CardDescription>
                        </Alert>
                    )}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(2)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-48"/></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 inline-block"/></TableCell>
                                    </TableRow>
                                    ))
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((orgUser) => (
                                        <TableRow key={orgUser.id}>
                                            <TableCell>
                                                <div className="font-medium">{orgUser.displayName || 'Unnamed User'}</div>
                                                <div className="text-sm text-muted-foreground">{orgUser.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">{orgUser.role.replace('_', ' ')}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" disabled>Manage</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">User editing and removal will be enabled in a future update.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
