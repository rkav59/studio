
"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, UserPlus, Users, Crown, AlertTriangle, Search, Mail, KeyRound, MoreHorizontal } from "lucide-react";
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
const MAIL_COLLECTION = 'mail';
const USER_ROLES: UserRole[] = ['admin', 'she_officer', 'authorizer', 'she_rep', 'visitor'];

export default function UserManagementPage() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<UserRole>("visitor");
    const [isInviting, setIsInviting] = useState(false);

    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [newRole, setNewRole] = useState<UserRole>('visitor');

    const canManageUsers = useMemo(() => user?.email === 'sentriq263@gmail.com' || (userProfile?.role === 'admin'), [user, userProfile]);
    const disabledTooltipContent = "You do not have permission to perform this action.";

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
    
    const updateUserRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
            if (!canManageUsers) throw new Error("Permission denied.");
            if (userId === user?.uid) throw new Error("You cannot change your own role.");
            const userDocRef = doc(db, USER_PROFILES_COLLECTION, userId);
            await updateDoc(userDocRef, { role });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizationUsers', userProfile?.organizationId] });
            toast({ title: "Role Updated", description: "The user's role has been successfully updated." });
            setEditingUser(null);
        },
        onError: (error: Error) => {
            toast({ title: "Error Updating Role", description: error.message, variant: "destructive" });
        }
    });
    
    const removeUserMutation = useMutation({
        mutationFn: async (userIdToRemove: string) => {
            if (!canManageUsers) throw new Error("Permission denied.");
            if (userIdToRemove === user?.uid) throw new Error("You cannot remove yourself from the organization.");
            const userToRemove = organizationUsers.find(u => u.id === userIdToRemove);
            if (userToRemove?.role === 'admin') throw new Error("Administrators cannot be removed by other users.");

            const userDocRef = doc(db, USER_PROFILES_COLLECTION, userIdToRemove);
            await deleteDoc(userDocRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizationUsers', userProfile?.organizationId] });
            toast({ title: "User Removed", description: "The user has been removed from the organization." });
        },
        onError: (error: Error) => {
             toast({ title: "Error Removing User", description: error.message, variant: "destructive" });
        }
    });

    const isLoading = !userProfile || isLoadingOrgUsers;

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return organizationUsers;
        return organizationUsers.filter(u =>
            u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [organizationUsers, searchTerm]);
    
    const handleSendInvite = async () => {
        if (!canManageUsers) return;
        if (!inviteEmail || !inviteRole) {
            toast({ title: "Missing Information", description: "Please provide an email and select a role.", variant: "destructive" });
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

            await addDoc(collection(db, MAIL_COLLECTION), { to: [inviteEmail], message: { subject: `You're invited to join ${userProfile?.organizationId || 'an organization'} on ${appName}!`, html: `<div style="...invitation html..."` } });
            toast({ title: "Invitation Sent", description: `An invitation has been sent to ${inviteEmail}.` });
            setIsInviteDialogOpen(false); setInviteEmail(""); setInviteRole("visitor");
        } catch (error) {
            console.error("Error creating invitation document:", error);
            toast({ title: "Invitation Failed", description: "Could not create the invitation record.", variant: "destructive" });
        } finally {
            setIsInviting(false);
        }
    };

    const handleOpenRoleDialog = (userToEdit: UserProfile) => {
        setNewRole(userToEdit.role);
        setEditingUser(userToEdit);
    };

    const handleRoleUpdate = () => {
        if (editingUser) {
            updateUserRoleMutation.mutate({ userId: editingUser.id, role: newRole });
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
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><Users className="h-8 w-8"/> User Management</h1>
                <p className="text-muted-foreground">Invite and manage users in your organization. Role-based access will be enforced in future updates.</p>
            </div>
            <Alert variant="info"><Mail className="h-4 w-4" /><AlertTitle>Email Invitations</AlertTitle><AlertDescription>This feature uses the Firebase 'Send an email from Firestore' extension. Ensure it is configured for invites to be sent.</AlertDescription></Alert>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div><CardTitle>Organization Users</CardTitle><CardDescription>Manage users in your organization.</CardDescription></div>
                     <div className="flex w-full md:w-auto items-center gap-2">
                        <div className="relative flex-grow"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or email..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                          <Tooltip><TooltipTrigger asChild><div tabIndex={0} className={cn(!canManageUsers && "cursor-not-allowed")}><DialogTrigger asChild><Button disabled={!canManageUsers}><UserPlus className="mr-2 h-4 w-4"/>Invite User</Button></DialogTrigger></div></TooltipTrigger>{!canManageUsers && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}</Tooltip>
                             <DialogContent>
                                <DialogHeader><DialogTitle>Invite New User</DialogTitle><DialogDescription>Enter the user's email and assign them a role. An invitation email will be sent.</DialogDescription></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2"><Label htmlFor="email" className="flex items-center gap-1"><Mail className="h-4 w-4"/>Email</Label><Input id="email" type="email" placeholder="new.user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
                                    <div className="space-y-2"><Label htmlFor="role" className="flex items-center gap-1"><KeyRound className="h-4 w-4"/>Role</Label>
                                        <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                                            <SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                                            <SelectContent>{USER_ROLES.map(role => (<SelectItem key={role} value={role} className="capitalize">{role.replace('_', ' ')}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleSendInvite} disabled={isInviting}>{isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send Invite</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoading ? ([...Array(2)].map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-5 w-48"/></TableCell><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-20 inline-block"/></TableCell></TableRow>))) 
                                : filteredUsers.length > 0 ? (
                                    filteredUsers.map((orgUser) => (
                                        <TableRow key={orgUser.id}>
                                            <TableCell><div className="font-medium">{orgUser.displayName || 'Unnamed User'}{orgUser.id === user?.uid && " (You)"}</div><div className="text-sm text-muted-foreground">{orgUser.email}</div></TableCell>
                                            <TableCell><Badge variant="secondary" className="capitalize">{orgUser.role.replace('_', ' ')}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <Tooltip><TooltipTrigger asChild>
                                                        <div tabIndex={0} className={cn(!canManageUsers || orgUser.id === user?.uid, "cursor-not-allowed")}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!canManageUsers || orgUser.id === user?.uid}><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger></div>
                                                    </TooltipTrigger>{(!canManageUsers || orgUser.id === user?.uid) && <TooltipContent><p>{orgUser.id === user?.uid ? "You cannot manage your own account." : disabledTooltipContent}</p></TooltipContent>}</Tooltip>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenRoleDialog(orgUser)}>Change Role</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                         <AlertDialog>
                                                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Remove User</DropdownMenuItem></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently remove {orgUser.displayName} from the organization, revoking their access. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => removeUserMutation.mutate(orgUser.id)} disabled={removeUserMutation.isPending}>
                                                                        {removeUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Remove User
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">No users found.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {editingUser && (
                <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Change Role for {editingUser.displayName}</DialogTitle>
                            <DialogDescription>Select a new role for this user. This will affect their permissions across the application.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="new-role">New Role</Label>
                            <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
                                <SelectTrigger id="new-role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                                <SelectContent>{USER_ROLES.map(role => (<SelectItem key={role} value={role} className="capitalize">{role.replace('_', ' ')}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleRoleUpdate} disabled={updateUserRoleMutation.isPending}>
                                {updateUserRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
        </TooltipProvider>
    );
}
