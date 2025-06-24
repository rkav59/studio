
"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import type { Contractor } from '@/lib/types';
import { InductionForm } from '@/components/contractor-safety/induction-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';

const CONTRACTORS_COLLECTION = 'contractors';

export default function OnlineInductionPage() {
    const router = useRouter();
    const { user } = useAuth();

    const { data: contractors = [], isLoading: isLoadingContractors, error: contractorsError } = useQuery<Contractor[]>({
        queryKey: [CONTRACTORS_COLLECTION, user?.uid],
        queryFn: async () => {
          if (!user?.uid) return [];
          const q = query(collection(db, CONTRACTORS_COLLECTION), where("userId", "==", user.uid), where("inductionCompleted", "==", false));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(docSnap => ({ 
              id: docSnap.id, 
              ...docSnap.data(), 
              inductionDate: docSnap.data().inductionDate instanceof Timestamp ? docSnap.data().inductionDate.toDate().toISOString() : docSnap.data().inductionDate,
          } as Contractor));
        },
        enabled: !!user?.uid,
    });

    const handleCancel = () => {
        router.push('/contractor-safety');
    };

    if (isLoadingContractors) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div></CardContent></Card>
            </div>
        );
    }
    
    if (contractorsError) {
        return <div className="text-red-500 text-center py-10">Error loading contractor data. Please try again later.</div>;
    }

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Contractor Safety">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" /> Contractor Online Safety Induction
                </h1>
            </div>
            
            {contractors.length === 0 ? (
                 <Card>
                    <CardHeader>
                        <CardTitle>No Contractors Pending Induction</CardTitle>
                        <CardDescription>All registered contractors have completed their safety induction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleCancel}>Back to Contractor Safety</Button>
                    </CardContent>
                </Card>
            ) : (
                <InductionForm contractors={contractors} />
            )}
        </div>
    );
}
