
"use client";

import { useRouter } from 'next/navigation';
import { PermitToWorkForm } from "@/components/contractor-safety/permit-to-work-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseISO } from 'date-fns';
import type { PermitToWork, Contractor } from '@/lib/types';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PTWS_COLLECTION = 'permitsToWork';
const CONTRACTORS_COLLECTION = 'contractors';

export default function NewPtwPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch Contractors for the dropdown
  const { data: contractors = [], isLoading: isLoadingContractors, error: contractorsError } = useQuery<Contractor[]>({
    queryKey: [CONTRACTORS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, CONTRACTORS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Contractor));
    },
    enabled: !!user?.uid,
  });

  const addPtwMutation = useMutation({
    mutationFn: async (newPtwData: Omit<PermitToWork, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = {
        ...newPtwData,
        userId: user.uid,
        startDate: Timestamp.fromDate(parseISO(newPtwData.startDate)),
        endDate: Timestamp.fromDate(parseISO(newPtwData.endDate)),
        authorizationDate: newPtwData.authorizationDate ? Timestamp.fromDate(parseISO(newPtwData.authorizationDate)) : null,
        closureDate: newPtwData.closureDate ? Timestamp.fromDate(parseISO(newPtwData.closureDate)) : null,
      };
      return addDoc(collection(db, PTWS_COLLECTION), dataForDb);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PTWS_COLLECTION, user?.uid] });
      toast({ title: "Permit Created", description: "The new Permit to Work has been successfully created." });
      router.push('/contractor-safety');
    },
    onError: (e: Error) => toast({ title: "Error Creating PTW", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSavePtw = (data: Omit<PermitToWork, 'id' | 'userId'>) => {
    addPtwMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/contractor-safety');
  };
  
  if (isLoadingContractors) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contractorsError) {
     return <div className="text-red-500 text-center py-10">Error loading contractors. Please try again later.</div>;
  }
  
  if (contractors.length === 0 && !isLoadingContractors) {
    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Contractor Safety">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <FileText className="h-6 w-6 text-accent" /> Create New Permit to Work
                </h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Cannot Create PTW</CardTitle>
                    <CardDescription>There are no contractors registered. Please add a contractor before creating a Permit to Work.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/contractor-safety/contractors/new')}>Add Contractor</Button>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Contractor Safety">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <FileText className="h-6 w-6 text-accent" /> Create New Permit to Work
            </h1>
        </div>
      <PermitToWorkForm 
        contractors={contractors} 
        onSave={handleSavePtw} 
        onCancel={handleCancel}
        isSubmitting={addPtwMutation.isPending}
      />
    </div>
  );
}
