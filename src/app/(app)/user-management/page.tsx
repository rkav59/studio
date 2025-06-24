

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<UserRole>("visitor");
    const [isInviting, setIsInviting] = useState(false);

    const canInviteUsers = useMemo(() => userProfile?.role === 'admin', [userProfile]);
    const disabledTooltipContent = "You do not have permission to perform this action.";


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
    const isLoading = !userProfile || isLoadingOrgUsers;
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
        if (!canInviteUsers) {
             toast({
                title: "Permission Denied",
                description: "Only administrators can invite new users.",
                variant: "destructive",
            });
            return;
        }

        if (!inviteEmail || !inviteRole) {
            toast({
                title: "Missing Information",
                description: "Please provide an email and select a role.",
                variant: "destructive",
            });
            return;
        }
        
        setIsInviting(true);
        
        try {
            const appName = "SHEild";
            const primaryColor = "#3498DB";
            const backgroundColor = "#f4f4f4";
            const textColor = "#333333";
            const inviteUrl = `${window.location.origin}/sign-up`;
            const roleName = inviteRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            await addDoc(collection(db, MAIL_COLLECTION), {
                to: [inviteEmail],
                message: {
                    subject: `You're invited to join ${userProfile?.organizationId || 'an organization'} on ${appName}!`,
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: ${textColor}; background-color: ${backgroundColor}; padding: 20px;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                                <h1 style="color: ${primaryColor}; font-size: 24px;">Invitation to Join ${appName}</h1>
                                <p>Hello,</p>
                                <p>You have been invited to join the organization <strong>${userProfile?.organizationId || 'your organization'}</strong> on ${appName} with the role of <strong>${roleName}</strong>.</p>
                                <p>${appName} is a platform for managing Safety, Health, Environment, and Quality processes.</p>
                                <p style="text-align: center; margin: 30px 0;">
                                    <a href="${inviteUrl}" style="background-color: ${primaryColor}; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation & Create Account</a>
                                </p>
                                <p>To ensure you join the correct organization, please use this email address (<strong>${inviteEmail}</strong>) when signing up.</p>
                                <p>If you were not expecting this invitation, you can safely ignore this email.</p>
                                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
                                <p style="font-size: 12px; color: #888888;">This is an automated message from the ${appName} application.</p>
                            </div>
                        </div>
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

    if (isLoading) {
        return (
             <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
            </div>
        );
    }
    
    return (
        <TooltipProvider>
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
            
            <Alert variant="info">
                <Mail className="h-4 w-4" />
                <AlertTitle>Email Invitations</AlertTitle>
                <AlertDescription>
                    This feature adds an invitation document to the 'mail' collection in Firestore. For emails to be sent, you must install and configure the official <strong>`Send an email from Firestore`</strong> (ID: `firestore-send-email`) extension from the Firebase Extensions marketplace.
                </AlertDescription>
            </Alert>
            
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div tabIndex={0} className={cn(!canInviteUsers && "cursor-not-allowed")}>
                                <DialogTrigger asChild>
                                    <Button disabled={!canAddUsers || !canInviteUsers}>
                                        <UserPlus className="mr-2 h-4 w-4"/>
                                        Invite User
                                    </Button>
                                </DialogTrigger>
                              </div>
                            </TooltipTrigger>
                            {!canInviteUsers && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                          </Tooltip>
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
                            <AlertTitle>User Limit Reached</AlertTitle>
                            <AlertDescription>
                                You have reached the user limit for the <span className="font-semibold capitalize">{currentPlan}</span> plan. Please upgrade your subscription to add more users.
                            </AlertDescription>
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
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div tabIndex={0} className={cn(!canInviteUsers && "cursor-not-allowed")}>
                                                            <Button variant="ghost" size="sm" disabled={!canInviteUsers}>Manage</Button>
                                                        </div>
                                                    </TooltipTrigger>
                                                    {!canInviteUsers && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                                                </Tooltip>
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
        </TooltipProvider>
    );
}

