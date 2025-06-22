
"use client";

import { useRouter } from 'next/navigation';
import type { PpeItem } from "@/lib/types";
import { PpeItemForm, type PpeItemFormValues } from "@/components/ppe-management/ppe-item-form";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseISO } from 'date-fns';

const PPE_ITEMS_COLLECTION = 'ppeItems';

export default function NewPpeItemPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addItemMutation = useMutation({
    mutationFn: async (newItemData: Omit<PpeItem, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      return addDoc(collection(db, PPE_ITEMS_COLLECTION), { 
        ...newItemData, 
        userId: user.uid,
        // Convert date strings to Firestore Timestamps if needed, or ensure they are ISO strings
        lastStocktakeDate: newItemData.lastStocktakeDate ? Timestamp.fromDate(parseISO(newItemData.lastStocktakeDate)) : null,
      });
    },
    onSuccess: (docRef, variables) => {
      queryClient.invalidateQueries({ queryKey: [PPE_ITEMS_COLLECTION, user?.uid] });
      toast({ 
        title: "PPE Item Added", 
        description: `"${variables.name}" has been successfully added to inventory.` 
      });
      router.push('/ppe-management');
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error Adding Item", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const handleSaveNewItem = (formData: PpeItemFormValues) => {
    const newItem: Omit<PpeItem, 'id' | 'userId'> = { // Ensure it matches the mutationFn input
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
    addItemMutation.mutate(newItem);
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };

  return (
    <div className="h-full flex flex-col">
      <PpeItemForm
        onSave={handleSaveNewItem}
        onCancel={handleCancel}
      />
    </div>
  );
}
