
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { PpeInspectionRecord, PpeItem, PpeItemStatus, PpeInspectionOverallStatus } from "@/lib/types";
import { PpeInspectionForm, type PpeInspectionFormValues, DEFAULT_PPE_CHECKLIST_ITEMS_TEMPLATE } from "@/components/ppe-management/ppe-inspection-form";
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const PPE_INSPECTIONS_KEY = 'sheiqpro-ppe-inspections-v1';
const PPE_ITEMS_KEY = 'sheiqpro-ppe-items-v1';

export default function EditPpeInspectionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [inspectionToEdit, setInspectionToEdit] = useState<PpeInspectionRecord | null | undefined>(undefined);
  const [ppeItems, setPpeItems] = useState<PpeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const inspectionId = params.id as string;

  useEffect(() => {
    if (inspectionId) {
      try {
        const storedPpeItems = localStorage.getItem(PPE_ITEMS_KEY);
        if (storedPpeItems) setPpeItems(JSON.parse(storedPpeItems));

        const storedInspections = localStorage.getItem(PPE_INSPECTIONS_KEY);
        const inspections: PpeInspectionRecord[] = storedInspections ? JSON.parse(storedInspections) : [];
        let foundInspection = inspections.find(insp => insp.id === inspectionId);
        
        if (foundInspection) {
          // Ensure checklistItems exists, if not, populate with default
          if (!foundInspection.checklistItems || foundInspection.checklistItems.length === 0) {
            foundInspection = {
              ...foundInspection,
              checklistItems: DEFAULT_PPE_CHECKLIST_ITEMS_TEMPLATE.map(templateItem => ({
                id: crypto.randomUUID(),
                templateItemId: templateItem.templateItemId,
                text: templateItem.text,
                result: 'Pending',
                remarks: '',
              })),
            };
          }
        }
        setInspectionToEdit(foundInspection || null);
      } catch (error) {
        console.error("Error loading PPE inspection for editing:", error);
        setInspectionToEdit(null);
        toast({ title: "Error", description: "Could not load PPE inspection data.", variant: "destructive" });
      }
    }
    setIsLoading(false);
  }, [inspectionId, toast]);

  const updatePpeItemStatus = (itemId: string, inspectionStatus: PpeInspectionOverallStatus) => {
    const storedItems = localStorage.getItem(PPE_ITEMS_KEY);
    let items: PpeItem[] = storedItems ? JSON.parse(storedItems) : [];
    
    let newPpeStatus: PpeItemStatus = 'Available'; 
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

  const handleSaveInspection = (formData: PpeInspectionFormValues) => {
    if (!inspectionToEdit) return;
    try {
      const storedInspections = localStorage.getItem(PPE_INSPECTIONS_KEY);
      const inspections: PpeInspectionRecord[] = storedInspections ? JSON.parse(storedInspections) : [];
      
      const updatedInspection: PpeInspectionRecord = {
        ...inspectionToEdit,
        ppeItemId: formData.ppeItemId,
        uniquePpeIdentifier: formData.uniquePpeIdentifier,
        inspectionDate: parseISO(formData.inspectionDate).toISOString(),
        inspectorName: formData.inspectorName,
        overallStatus: formData.overallStatus,
        checklistItems: formData.checklistItems.map(item => ({ // Ensure checklist items are saved
          ...item,
          id: item.id || crypto.randomUUID(), 
        })),
        notes: formData.notes,
        followUpAction: formData.followUpAction,
        nextInspectionDate: formData.nextInspectionDate ? parseISO(formData.nextInspectionDate).toISOString() : undefined,
      };

      const updatedInspections = inspections.map(i => (i.id === inspectionId ? updatedInspection : i));
      localStorage.setItem(PPE_INSPECTIONS_KEY, JSON.stringify(updatedInspections));

      updatePpeItemStatus(updatedInspection.ppeItemId, updatedInspection.overallStatus);
      
      toast({ 
        title: "PPE Inspection Updated", 
        description: `Inspection record for PPE Item ID ${updatedInspection.ppeItemId} has been successfully updated.` 
      });
      router.push('/ppe-management');
    } catch (error) {
      console.error("Error updating PPE inspection:", error);
      toast({ 
        title: "Error Updating Inspection", 
        description: "Could not update the PPE inspection.", 
        variant: "destructive" 
      });
    }
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };

  if (isLoading || inspectionToEdit === undefined) {
    return (
      <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6 p-4 md:p-6">
            {[...Array(8)].map((_, i) => ( // Increased skeleton items for checklist
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

  if (inspectionToEdit === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>PPE Inspection Record Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The PPE inspection record you are trying to edit could not be found.</p>
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
      <PpeInspectionForm
        ppeItems={ppeItems}
        initialData={inspectionToEdit}
        onSave={handleSaveInspection}
        onCancel={handleCancel}
      />
    </div>
  );
}
