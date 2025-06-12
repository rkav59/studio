
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { PpeItem } from "@/lib/types";
import { PpeItemForm, type PpeItemFormValues } from "@/components/ppe-management/ppe-item-form";
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // For loading/not found state
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

const PPE_ITEMS_KEY = 'sheild-ppe-items-v1';

export default function EditPpeItemPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [itemToEdit, setItemToEdit] = useState<PpeItem | null | undefined>(undefined); // undefined for loading

  const itemId = params.id as string;

  useEffect(() => {
    if (itemId) {
      try {
        const storedItems = localStorage.getItem(PPE_ITEMS_KEY);
        const items: PpeItem[] = storedItems ? JSON.parse(storedItems) : [];
        const foundItem = items.find(item => item.id === itemId);
        setItemToEdit(foundItem || null); // null if not found
      } catch (error) {
        console.error("Error loading PPE item for editing:", error);
        setItemToEdit(null);
        toast({ title: "Error", description: "Could not load PPE item data.", variant: "destructive" });
      }
    }
  }, [itemId, toast]);

  const handleSaveItem = (formData: PpeItemFormValues) => {
    if (!itemToEdit) return;
    try {
      const storedItems = localStorage.getItem(PPE_ITEMS_KEY);
      const items: PpeItem[] = storedItems ? JSON.parse(storedItems) : [];
      
      const updatedItem: PpeItem = {
        ...itemToEdit,
        name: formData.name,
        type: formData.type,
        category: formData.category,
        specifications: formData.specifications,
        currentStock: formData.currentStock,
        reorderLevel: formData.reorderLevel,
        supplier: formData.supplier,
        lastStocktakeDate: formData.lastStocktakeDate ? parseISO(formData.lastStocktakeDate).toISOString() : undefined,
      };

      const updatedItems = items.map(i => (i.id === itemId ? updatedItem : i));
      localStorage.setItem(PPE_ITEMS_KEY, JSON.stringify(updatedItems));
      
      toast({ 
        title: "PPE Item Updated", 
        description: `"${updatedItem.name}" has been successfully updated.` 
      });
      router.push('/ppe-management');
    } catch (error) {
      console.error("Error updating PPE item:", error);
      toast({ 
        title: "Error Updating Item", 
        description: "Could not update the PPE item.", 
        variant: "destructive" 
      });
    }
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };

  if (itemToEdit === undefined) { // Loading state
    return (
      <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6 p-4 md:p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (itemToEdit === null) { // Not found state
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>PPE Item Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The PPE item you are trying to edit could not be found.</p>
            <Button onClick={() => router.push('/ppe-management')} className="mt-4">
              Back to PPE Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PpeItemForm
        initialData={itemToEdit}
        onSave={handleSaveItem}
        onCancel={handleCancel}
      />
    </div>
  );
}
    