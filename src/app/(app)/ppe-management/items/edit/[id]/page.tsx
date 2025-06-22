
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { PpeItem } from "@/lib/types";
import { PpeItemForm, type PpeItemFormValues } from "@/components/ppe-management/ppe-item-form";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

const PPE_ITEMS_COLLECTION = 'ppeItems';

export default function EditPpeItemPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const itemId = params.id as string;

  const { data: itemToEdit, isLoading, error } = useQuery<PpeItem | null>({
    queryKey: [PPE_ITEMS_COLLECTION, itemId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !itemId) return null;
      const itemRef = doc(db, PPE_ITEMS_COLLECTION, itemId);
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists() && itemSnap.data().userId === user.uid) {
        const data = itemSnap.data();
        // Convert Firestore Timestamp to ISO string for form compatibility
        const lastStocktakeDate = data.lastStocktakeDate instanceof Timestamp 
            ? data.lastStocktakeDate.toDate().toISOString() 
            : data.lastStocktakeDate;
        return { id: itemSnap.id, ...data, lastStocktakeDate } as PpeItem;
      }
      return null;
    },
    enabled: !!user?.uid && !!itemId,
  });

  const updateItemMutation = useMutation({
    mutationFn: async (updatedItemData: PpeItem) => {
      if (!user?.uid || !updatedItemData.id) throw new Error("User or item ID missing.");
      const { id, ...dataToUpdate } = updatedItemData;
      const itemRef = doc(db, PPE_ITEMS_COLLECTION, id);
      await updateDoc(itemRef, {
        ...dataToUpdate,
        userId: user.uid, // Ensure userId is maintained
        lastStocktakeDate: dataToUpdate.lastStocktakeDate ? Timestamp.fromDate(parseISO(dataToUpdate.lastStocktakeDate)) : null,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PPE_ITEMS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [PPE_ITEMS_COLLECTION, variables.id, user?.uid] });
      toast({ 
        title: "PPE Item Updated", 
        description: `"${variables.name}" has been successfully updated.` 
      });
      router.push('/ppe-management');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error Updating Item", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const handleSaveItem = (formData: PpeItemFormValues) => {
    if (!itemToEdit) return;
    const updatedItem: PpeItem = {
      ...itemToEdit,
      name: formData.name,
      type: formData.type,
      category: formData.category,
      specifications: formData.specifications,
      currentStock: formData.currentStock,
      reorderLevel: formData.reorderLevel,
      supplier: formData.supplier,
      lastStocktakeDate: formData.lastStocktakeDate || undefined, // Keep as string for mutation
      status: formData.status || 'Available',
      inspectionIntervalDays: formData.inspectionIntervalDays,
    };
    updateItemMutation.mutate(updatedItem);
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
          <CardHeader><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-6 p-4 md:p-6">{[...Array(5)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>))}</CardContent>
        </Card>
      </div>
    );
  }

  if (error || !itemToEdit) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader><CardTitle>PPE Item Not Found</CardTitle></CardHeader>
          <CardContent><p>The PPE item could not be found or you don't have permission to edit it.</p><Button onClick={() => router.push('/ppe-management')} className="mt-4">Back to PPE Management</Button></CardContent>
        </Card>
      </div>
    );
  }
  
  // Re-format date from ISO string (from query) to 'yyyy-MM-dd' for the form's date picker
  const initialDataForForm = {
      ...itemToEdit,
      lastStocktakeDate: itemToEdit.lastStocktakeDate ? format(parseISO(itemToEdit.lastStocktakeDate), 'yyyy-MM-dd') : undefined
  };


  return (
    <div className="h-full flex flex-col">
      <PpeItemForm
        initialData={initialDataForForm}
        onSave={handleSaveItem}
        onCancel={handleCancel}
      />
    </div>
  );
}
