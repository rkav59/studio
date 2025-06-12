
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PpeItem } from "@/lib/types";
import { PpeItemForm, type PpeItemFormValues } from "@/components/ppe-management/ppe-item-form";
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';

const PPE_ITEMS_KEY = 'sheild-ppe-items-v1';

export default function NewPpeItemPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSaveNewItem = (formData: PpeItemFormValues) => {
    try {
      const storedItems = localStorage.getItem(PPE_ITEMS_KEY);
      const items: PpeItem[] = storedItems ? JSON.parse(storedItems) : [];
      
      const newItem: PpeItem = {
        id: crypto.randomUUID(),
        name: formData.name,
        type: formData.type,
        category: formData.category,
        specifications: formData.specifications,
        currentStock: formData.currentStock,
        reorderLevel: formData.reorderLevel,
        supplier: formData.supplier,
        lastStocktakeDate: formData.lastStocktakeDate ? parseISO(formData.lastStocktakeDate).toISOString() : undefined,
      };

      items.unshift(newItem);
      localStorage.setItem(PPE_ITEMS_KEY, JSON.stringify(items));
      
      toast({ 
        title: "PPE Item Added", 
        description: `"${newItem.name}" has been successfully added to inventory.` 
      });
      router.push('/ppe-management');
    } catch (error) {
      console.error("Error saving new PPE item:", error);
      toast({ 
        title: "Error Adding Item", 
        description: "Could not add the new PPE item.", 
        variant: "destructive" 
      });
    }
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
    