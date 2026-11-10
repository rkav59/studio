
"use client";
import { toIso } from "@/lib/supabase/serialization";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ContractorForm, type ContractorFormDataWithFiles } from "@/components/contractor-safety/contractor-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db, storage } from '@/lib/supabase/client';
import { doc, getDoc, updateDoc, Timestamp } from '@/lib/supabase/records';
import { uploadContractorDocument, ref as storageRef, deleteObject } from "@/lib/supabase/storage";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseISO, format } from 'date-fns';
import type { Contractor, ContractorDocument } from '@/lib/types';
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react';

const CONTRACTORS_COLLECTION = 'contractors';

async function deleteContractorDocumentFile(filePath: string) {
  if (!filePath) return;
  const fileRef = storageRef(storage, filePath);
  try {
    await deleteObject(fileRef);
  } catch (error: any) {
    if (error.code !== 'storage/object-not-found') {
      console.error("Error deleting file from storage:", error);
    }
  }
}

export default function EditContractorPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  
  const contractorId = params.id as string;

  const { data: contractorToEdit, isLoading: isLoadingContractor, error: contractorError } = useQuery<Contractor | null>({
    queryKey: [CONTRACTORS_COLLECTION, contractorId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !contractorId) return null;
      const contractorRef = doc(db, CONTRACTORS_COLLECTION, contractorId);
      const contractorSnap = await getDoc(contractorRef);
      if (contractorSnap.exists() && contractorSnap.data().userId === user.uid) {
        const data = contractorSnap.data();
        return { 
          id: contractorSnap.id, 
          ...data, 
          inductionDate: data.inductionDate instanceof Timestamp ? toIso(data.inductionDate) : data.inductionDate,
          documents: (data.documents || []).map((d: any) => ({
            ...d,
            uploadedDate: d.uploadedDate instanceof Timestamp ? toIso(d.uploadedDate) : d.uploadedDate,
            expiryDate: d.expiryDate instanceof Timestamp ? toIso(d.expiryDate) : d.expiryDate,
          }))
        } as Contractor;
      }
      return null;
    },
    enabled: !!user?.uid && !!contractorId,
  });


  const updateContractorMutation = useMutation({
    mutationFn: async (formData: ContractorFormDataWithFiles) => {
      if (!user?.uid || !contractorId) throw new Error("Missing user or contractor ID.");
      
      const { documentFiles, documentsToRemove, ...contractorData } = formData;

      const filesToDelete = new Set(documentsToRemove || []);
      const retainedIds = new Set((contractorData.documents || []).map(d => d.id));
      for (const old of contractorToEdit?.documents || []) if (!retainedIds.has(old.id) && old.filePath) filesToDelete.add(old.filePath);
      // 2. Process documents: upload new files and create the final document array.
      const processedDocuments: ContractorDocument[] = await Promise.all(
        (contractorData.documents || []).map(async (docData) => {
          const fileToUpload = documentFiles?.get(docData.id);
          const existingDoc = contractorToEdit?.documents.find(d => d.id === docData.id);

          if (fileToUpload) { 
            // If there's a new file, delete the old one first.
            if (existingDoc?.filePath) { 
              filesToDelete.add(existingDoc.filePath);
            }
            // Then upload the new one with progress.
            const { url, path, name, type, size } = await uploadContractorDocument(
              fileToUpload, 
              user.uid, 
              contractorId, 
              docData.id,
              (progress) => {
                setUploadProgress(prev => new Map(prev).set(docData.id, progress));
              }
            );
            return { ...docData, fileUrl: url, filePath: path, fileName: name, fileType: type, fileSize: size };
          } else if (existingDoc) { 
            // If no new file, retain existing file info.
            const restOfExisting = existingDoc;
            return { ...restOfExisting, ...docData };
          }
          
          // If it's a new document entry without a file.
          const {fileUrl, filePath, fileName, fileSize, fileType, ...restOfDocData} = docData;
          return filePath ? docData : restOfDocData;
        })
      );
      
      const dataToSave = { 
        ...contractorData, 
        userId: user.uid,
        documents: processedDocuments,
        inductionDate: contractorData.inductionDate ? Timestamp.fromDate(parseISO(contractorData.inductionDate)) : null,
      };
       dataToSave.documents = dataToSave.documents.map(d => {
        const { fileUrl, filePath, fileName, fileSize, fileType, ...rest } = d;
        if (d.filePath) return d;
        return rest;
      });

      await updateDoc(doc(db, CONTRACTORS_COLLECTION, contractorId), dataToSave);
      await Promise.all([...filesToDelete].map(path => deleteContractorDocumentFile(path)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, contractorId, user?.uid] });
      setUploadProgress(new Map());
      toast({ title: "Contractor Updated", description: `Details for ${contractorToEdit?.companyName || 'the contractor'} updated.` });
      router.push('/contractor-safety');
    },
    onError: (e: Error) => {
        setUploadProgress(new Map());
        toast({ title: "Error Updating Contractor", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    },
  });

  const handleSaveContractor = (data: ContractorFormDataWithFiles) => {
    updateContractorMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/contractor-safety');
  };

  if (isLoadingContractor) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contractorError || !contractorToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Contractor Not Found</CardTitle></CardHeader>
          <CardContent><p>The contractor could not be found or you don't have permission to edit it.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  const initialDataForForm = {
      ...contractorToEdit,
      inductionDate: contractorToEdit.inductionDate ? format(parseISO(contractorToEdit.inductionDate), 'yyyy-MM-dd') : undefined,
      documents: contractorToEdit.documents.map(doc => ({
          ...doc,
          expiryDate: doc.expiryDate ? format(parseISO(doc.expiryDate), 'yyyy-MM-dd') : undefined,
          uploadedDate: format(parseISO(doc.uploadedDate), 'yyyy-MM-dd'),
      }))
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Contractor Safety">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <ClipboardList className="h-6 w-6 text-primary" /> Edit Contractor: {contractorToEdit.companyName}
            </h1>
        </div>
      <ContractorForm 
        initialData={initialDataForForm} 
        onSave={handleSaveContractor} 
        onCancel={handleCancel}
        isSubmitting={updateContractorMutation.isPending}
        uploadProgress={uploadProgress}
      />
    </div>
  );
}
