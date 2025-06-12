
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { PpeIssuanceRecord, PpeItem } from "@/lib/types";
import { PpeIssuanceForm, type PpeIssuanceFormValues } from "@/components/ppe-management/ppe-issuance-form";
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const PPE_ISSUANCES_KEY = 'sheild-ppe-issuances-v1';
const PPE_ITEMS_KEY = 'sheild-ppe-items-v1';

export default function EditPpeIssuancePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [issuanceToEdit, setIssuanceToEdit] = useState<PpeIssuanceRecord | null | undefined>(undefined);
  const [ppeItems, setPpeItems] = useState<PpeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const issuanceId = params.id as string;

  useEffect(() => {
    if (issuanceId) {
      try {
        const storedPpeItems = localStorage.getItem(PPE_ITEMS_KEY);
        if (storedPpeItems) setPpeItems(JSON.parse(storedPpeItems));

        const storedIssuances = localStorage.getItem(PPE_ISSUANCES_KEY);
        const issuances: PpeIssuanceRecord[] = storedIssuances ? JSON.parse(storedIssuances) : [];
        const foundIssuance = issuances.find(iss => iss.id === issuanceId);
        setIssuanceToEdit(foundIssuance || null);
      } catch (error) {
        console.error("Error loading PPE issuance for editing:", error);
        setIssuanceToEdit(null);
        toast({ title: "Error", description: "Could not load PPE issuance data.", variant: "destructive" });
      }
    }
    setIsLoading(false);
  }, [issuanceId, toast]);

  const handleSaveIssuance = (formData: PpeIssuanceFormValues) => {
    if (!issuanceToEdit) return;
    try {
      const storedIssuances = localStorage.getItem(PPE_ISSUANCES_KEY);
      const issuances: PpeIssuanceRecord[] = storedIssuances ? JSON.parse(storedIssuances) : [];
      
      const updatedIssuance: PpeIssuanceRecord = {
        ...issuanceToEdit,
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

      const updatedIssuances = issuances.map(i => (i.id === issuanceId ? updatedIssuance : i));
      localStorage.setItem(PPE_ISSUANCES_KEY, JSON.stringify(updatedIssuances));
      
      toast({ 
        title: "PPE Issuance Updated", 
        description: `Issuance for ${updatedIssuance.employeeName} has been successfully updated.` 
      });
      router.push('/ppe-management');
    } catch (error) {
      console.error("Error updating PPE issuance:", error);
      toast({ 
        title: "Error Updating Issuance", 
        description: "Could not update the PPE issuance.", 
        variant: "destructive" 
      });
    }
  };

  const handleCancel = () => {
    router.push('/ppe-management');
  };

  if (isLoading || issuanceToEdit === undefined) {
    return (
      <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6 p-4 md:p-6">
            {[...Array(6)].map((_, i) => (
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

  if (issuanceToEdit === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>PPE Issuance Record Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The PPE issuance record you are trying to edit could not be found.</p>
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
      <PpeIssuanceForm
        ppeItems={ppeItems}
        initialData={issuanceToEdit}
        onSave={handleSaveIssuance}
        onCancel={handleCancel}
      />
    </div>
  );
}
    