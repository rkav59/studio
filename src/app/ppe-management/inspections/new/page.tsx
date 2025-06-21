
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PpeInspectionRecord, PpeItem, PpeItemStatus, PpeInspectionOverallStatus } from "@/lib/types";
import { PpeInspectionForm, type PpeInspectionFormValues, DEFAULT_PPE_CHECKLIST_ITEMS_TEMPLATE } from "@/components/ppe-management/ppe-inspection-form";
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';

const PPE_INSPECTIONS_KEY = 'sheiqpro-ppe-inspections-v1';
const PPE_ITEMS_KEY = 'sheiqpro-ppe-items-v1';

export default function NewPpeInspectionPage() {
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

  const updatePpeItemStatus = (itemId: string, inspectionStatus: PpeInspectionOverallStatus) => {
    const storedItems = localStorage.getItem(PPE_ITEMS_KEY);
    let items: PpeItem[] = storedItems ? JSON.parse(storedItems) : [];
    
    let newPpeStatus: PpeItemStatus = 'Available'; // Default
    switch (inspectionStatus) {
        case 'Pass':
            newPpeStatus = 'Available';
            break;
        case 'Requires Repair':
            newPpeStatus = 'Awaiting Repair';
            break;
        case 'To be Replaced':
            newPpeStatus = 'Awaiting Replacement';
            break;
        case 'Action Pending':
            newPpeStatus = 'Under Inspection'; 
            break;
    }

    items = items.map(item => item.id === itemId ? { ...item, status: newPpeStatus } : item);
    localStorage.setItem(PPE_ITEMS_KEY, JSON.stringify(items));
  };

  const handleSaveNewInspection = (formData: PpeInspectionFormValues) => {
    try {
      const storedInspections = localStorage.getItem(PPE_INSPECTIONS_KEY);
      const inspections: PpeInspectionRecord[] = storedInspections ? JSON.parse(storedInspections) : [];
      
      const newInspection: PpeInspectionRecord = {
        id: crypto.randomUUID(),
        ppeItemId: formData.ppeItemId,
        uniquePpeIdentifier: formData.uniquePpeIdentifier,
        inspectionDate: parseISO(formData.inspectionDate).toISOString(),
        inspectorName: formData.inspectorName,
        overallStatus: formData.overallStatus,
        checklistItems: formData.checklistItems.map(item => ({ // Ensure checklist items are saved
          ...item, 
          id: item.id || crypto.randomUUID(), // Ensure IDs if somehow missing
        })),
        notes: formData.notes,
        followUpAction: formData.followUpAction,
        nextInspectionDate: formData.nextInspectionDate ? parseISO(formData.nextInspectionDate).toISOString() : undefined,
      };

      inspections.unshift(newInspection);
      localStorage.setItem(PPE_INSPECTIONS_KEY, JSON.stringify(inspections));
      
      updatePpeItemStatus(newInspection.ppeItemId, newInspection.overallStatus);
      
      toast({ 
        title: "PPE Inspection Logged", 
        description: `Inspection for PPE Item ID ${newInspection.ppeItemId} has been successfully logged.` 
      });
      router.push('/ppe-management');
    } catch (error) {
      console.error("Error saving new PPE inspection:", error);
      toast({ 
        title: "Error Logging Inspection", 
        description: "Could not log the new PPE inspection.", 
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

  // Prepare initial data for the form, including the default checklist
  const initialFormValues: Partial<PpeInspectionRecord> = {
      checklistItems: DEFAULT_PPE_CHECKLIST_ITEMS_TEMPLATE.map(templateItem => ({
        id: crypto.randomUUID(),
        templateItemId: templateItem.templateItemId,
        text: templateItem.text,
        result: 'Pending',
        remarks: '',
      })),
      // other default fields for a new inspection can be set here if needed by the form.
      // For example, if the PpeInspectionForm expects 'overallStatus' to be pre-filled:
      // overallStatus: undefined, // Let user choose
  };


  return (
    <div className="h-full flex flex-col">
      <PpeInspectionForm
        ppeItems={ppeItems}
        initialData={initialFormValues as PpeInspectionRecord} // Pass initial checklist structure
        onSave={handleSaveNewInspection}
        onCancel={handleCancel}
      />
    </div>
  );
}
