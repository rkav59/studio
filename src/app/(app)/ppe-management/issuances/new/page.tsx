
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PpeIssuanceRecord, PpeItem } from "@/lib/types";
import { PpeIssuanceForm, type PpeIssuanceFormValues } from "@/components/ppe-management/ppe-issuance-form";
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';

const PPE_ISSUANCES_KEY = 'sheild-ppe-issuances-v1';
const PPE_ITEMS_KEY = 'sheild-ppe-items-v1'; // To load items for the select dropdown

export default function NewPpeIssuancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [ppeItems, setPpeItems] = useState<PpeItem[]>([]);
  const [isLoadingPpeItems, setIsLoadingPpeItems] = useState(true);

  useEffect(() => {
    try {
      const storedPpeItems = localStorage.getItem(PPE_ITEMS_KEY);
      if (storedPpeItems) {
        setPpeItems(JSON.parse(storedPpeItems));
      }
    } catch (error) {
      console.error("Error loading PPE items for form:", error);
      toast({ title: "Error", description: "Could not load PPE items list.", variant: "destructive"});
    }
    setIsLoadingPpeItems(false);
  }, [toast]);


  const handleSaveNewIssuance = (formData: PpeIssuanceFormValues) => {
    try {
      const storedIssuances = localStorage.getItem(PPE_ISSUANCES_KEY);
      const issuances: PpeIssuanceRecord[] = storedIssuances ? JSON.parse(storedIssuances) : [];
      
      const newIssuance: PpeIssuanceRecord = {
        id: crypto.randomUUID(),
        ppeItemId: formData.ppeItemId,
        employeeName: formData.employeeName,
        jobRole: formData.jobRole,
        issuedDate: parseISO(formData.issuedDate).toISOString(),
        quantityIssued: formData.quantityIssued,
        expectedReturnDate: formData.expectedReturnDate ? parseISO(formData.expectedReturnDate).toISOString() : undefined,
        actualReturnDate: formData.actualReturnDate ? parseISO(formData.actualReturnDate).toISOString() : undefined,
        conditionOnReturn: formData.conditionOnReturn,
        notes: formData.notes,
      };

      issuances.unshift(newIssuance);
      localStorage.setItem(PPE_ISSUANCES_KEY, JSON.stringify(issuances));
      
      toast({ 
        title: "PPE Issuance Logged", 
        description: `Issuance for ${newIssuance.employeeName} has been successfully logged.` 
      });
      router.push('/ppe-management');
    } catch (error) {
      console.error("Error saving new PPE issuance:", error);
      toast({ 
        title: "Error Logging Issuance", 
        description: "Could not log the new PPE issuance.", 
        variant: "destructive" 
      });
    }
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };
  
  if (isLoadingPpeItems) {
      return <div className="p-6">Loading PPE items...</div>; // Basic loading state
  }

  return (
    <div className="h-full flex flex-col">
      <PpeIssuanceForm
        ppeItems={ppeItems}
        onSave={handleSaveNewIssuance}
        onCancel={handleCancel}
      />
    </div>
  );
}
    