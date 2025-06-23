
"use client";

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { PpeInspectionRecord, PpeItem, PpeItemStatus, PpeInspectionOverallStatus } from "@/lib/types";
import { PpeInspectionForm, type PpeInspectionFormValues, DEFAULT_PPE_CHECKLIST_ITEMS_TEMPLATE } from "@/components/ppe-management/ppe-inspection-form";
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const PPE_INSPECTIONS_COLLECTION = 'ppeInspections';
const PPE_ITEMS_COLLECTION = 'ppeItems';

function NewPpeInspectionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const preselectedPpeItemId = searchParams.get('ppeItemId');

    const { data: ppeItems = [], isLoading: isLoadingPpeItems, error: ppeItemsError } = useQuery<PpeItem[]>({
        queryKey: [PPE_ITEMS_COLLECTION, user?.uid],
        queryFn: async () => {
            if (!user?.uid) return [];
            const q = query(collection(db, PPE_ITEMS_COLLECTION), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PpeItem));
        },
        enabled: !!user?.uid,
    });
    
    const addInspectionMutation = useMutation({
        mutationFn: async (newInspectionData: PpeInspectionFormValues) => {
            if (!user?.uid) throw new Error("User not authenticated.");
            const dataForDb = {
                ...newInspectionData,
                userId: user.uid,
                inspectionDate: Timestamp.fromDate(parseISO(newInspectionData.inspectionDate)),
                nextInspectionDate: newInspectionData.nextInspectionDate ? Timestamp.fromDate(parseISO(newInspectionData.nextInspectionDate)) : null,
            };
            return addDoc(collection(db, PPE_INSPECTIONS_COLLECTION), dataForDb);
        },
        onSuccess: async (docRef, variables) => {
            await updatePpeItemStatus(variables.ppeItemId, variables.overallStatus);
            queryClient.invalidateQueries({ queryKey: [PPE_INSPECTIONS_COLLECTION, user?.uid] });
            queryClient.invalidateQueries({ queryKey: [PPE_ITEMS_COLLECTION, user?.uid] });
            toast({
                title: "PPE Inspection Logged",
                description: `Inspection for PPE Item ID ${variables.ppeItemId} has been successfully logged.`
            });
            router.push('/ppe-management');
        },
        onError: (error: Error) => {
            toast({
                title: "Error Logging Inspection",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive"
            });
        },
    });

    const updatePpeItemStatus = async (itemId: string, inspectionStatus: PpeInspectionOverallStatus) => {
        if (!user?.uid) return;
        const itemToUpdate = ppeItems.find(item => item.id === itemId);
        if (!itemToUpdate) return;
        
        let newPpeStatus: PpeItemStatus = 'Available';
        switch (inspectionStatus) {
            case 'Pass': newPpeStatus = 'Available'; break;
            case 'Requires Repair': newPpeStatus = 'Awaiting Repair'; break;
            case 'To be Replaced': newPpeStatus = 'Awaiting Replacement'; break;
            case 'Action Pending': newPpeStatus = 'Under Inspection'; break;
        }
        
        const itemRef = doc(db, PPE_ITEMS_COLLECTION, itemId);
        await updateDoc(itemRef, { status: newPpeStatus });
    };

    const handleSaveNewInspection = (formData: PpeInspectionFormValues) => {
        addInspectionMutation.mutate(formData);
    };

    const handleCancel = () => {
        router.push('/ppe-management');
    };
    
    if (isLoadingPpeItems) {
        return (
          <div className="h-full flex flex-col">
            <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
              <CardHeader><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
              <CardContent className="space-y-6 p-4 md:p-6">{[...Array(8)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>))}</CardContent>
            </Card>
          </div>
        );
    }

    if (ppeItemsError) {
        return <div className="text-red-500 p-6">Error loading PPE items. Please try again later.</div>;
    }

    const initialFormValues: Partial<PpeInspectionRecord> = {
        ppeItemId: preselectedPpeItemId || undefined,
        checklistItems: DEFAULT_PPE_CHECKLIST_ITEMS_TEMPLATE.map(templateItem => ({
            id: crypto.randomUUID(),
            templateItemId: templateItem.templateItemId,
            text: templateItem.text,
            result: 'Pending',
            remarks: '',
        })),
    };

    return (
        <div className="h-full flex flex-col">
            <PpeInspectionForm
                ppeItems={ppeItems}
                initialData={initialFormValues as PpeInspectionRecord}
                onSave={handleSaveNewInspection}
                onCancel={handleCancel}
                isSubmitting={addInspectionMutation.isPending}
            />
        </div>
    );
}

// Wrap with Suspense because useSearchParams requires it
export default function NewPpeInspectionPage() {
    return (
        <Suspense fallback={<div>Loading inspection form...</div>}>
            <NewPpeInspectionPageContent />
        </Suspense>
    )
}
