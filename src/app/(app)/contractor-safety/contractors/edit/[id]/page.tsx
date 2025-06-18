
"use client";

import { useRouter, useParams } from 'next/navigation';
import { ContractorForm, type ContractorFormDataWithFiles } from "@/components/contractor-safety/contractor-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseISO, format } from 'date-fns';
import type { Contractor, ContractorDocument } from '@/lib/types';
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react';

const CONTRACTORS_COLLECTION = 'contractors';

async function uploadContractorDocument(file: File, userId: string, contractorId: string, documentId: string): Promise<{ url: string, path: string, name: string, type: string, size: number }> {
  const filePath = `contractor_documents/${userId}/${contractorId}/${documentId}/${file.name}`;
  const fileStorageRef = storageRef(storage, filePath);
  const snapshot = await uploadBytes(fileStorageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return { url, path: filePath, name: file.name, type: file.type, size: file.size };
}

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
          inductionDate: data.inductionDate instanceof Timestamp ? data.inductionDate.toDate().toISOString() : data.inductionDate,
          documents: (data.documents || []).map((d: any) => ({
            ...d,
            uploadedDate: d.uploadedDate instanceof Timestamp ? d.uploadedDate.toDate().toISOString() : d.uploadedDate,
            expiryDate: d.expiryDate instanceof Timestamp ? d.expiryDate.toDate().toISOString() : d.expiryDate,
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

      // 1. Delete files marked for removal (from form UI selections)
      if (documentsToRemove && documentsToRemove.length > 0) {
        await Promise.all(documentsToRemove.map(path => deleteContractorDocumentFile(path)));
      }
      
      // 2. Identify files for documents that were fully removed from the documents array
      const initialDocIds = contractorToEdit?.documents.map(d => d.id) || [];
      const finalDocIds = contractorData.documents?.map(d => d.id) || [];
      const removedDocEntries = contractorToEdit?.documents.filter(
        initialDoc => !finalDocIds.includes(initialDoc.id) && initialDoc.filePath
      ) || [];
      await Promise.all(removedDocEntries.map(doc => deleteContractorDocumentFile(doc.filePath!)));

      const processedDocuments: ContractorDocument[] = await Promise.all(
        (contractorData.documents || []).map(async (docData) => {
          const fileToUpload = documentFiles?.get(docData.id);
          const existingDoc = contractorToEdit?.documents.find(d => d.id === docData.id);

          if (fileToUpload) { 
            if (existingDoc?.filePath) { 
              await deleteContractorDocumentFile(existingDoc.filePath);
            }
            const { url, path, name, type, size } = await uploadContractorDocument(fileToUpload, user.uid, contractorId, docData.id);
            return { ...docData, fileUrl: url, filePath: path, fileName: name, fileType: type, fileSize: size };
          } else if (existingDoc) { 
            // Retain existing file info if no new file uploaded for this doc entry
            const {file, ...restOfExisting} = existingDoc; // remove 'file' if it exists as a File object due to old state management
            return { ...docData, ...restOfExisting };
          }
          // New doc entry without a file, or existing doc entry that previously had no file
           const {fileUrl, filePath, fileName, fileSize, fileType, ...restOfDocData} = docData; // remove if no fileUrl
           return fileUrl ? docData : restOfDocData;
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
        if (d.fileUrl) return d;
        return rest;
      });

      await updateDoc(doc(db, CONTRACTORS_COLLECTION, contractorId), dataToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, contractorId, user?.uid] });
      toast({ title: "Contractor Updated", description: `Details for ${contractorToEdit?.companyName || 'the contractor'} updated.` });
      router.push('/contractor-safety');
    },
    onError: (e: Error) => toast({ title: "Error Updating Contractor", description: e.message, variant: "destructive" }),
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
          <CardContent><p>{contractorError ? contractorError.message : "The contractor could not be found or you don't have permission to edit it."}</p></CardContent>
        </Card>
      </div>
    );
  }
  
  // Prepare initialData for the form, ensuring dates are in 'yyyy-MM-dd' for date inputs
  const initialDataForForm = {
      ...contractorToEdit,
      inductionDate: contractorToEdit.inductionDate ? format(parseISO(contractorToEdit.inductionDate), 'yyyy-MM-dd') : undefined,
      documents: contractorToEdit.documents.map(doc => ({
          ...doc,
          expiryDate: doc.expiryDate ? format(parseISO(doc.expiryDate), 'yyyy-MM-dd') : undefined,
          uploadedDate: format(parseISO(doc.uploadedDate), 'yyyy-MM-dd'), // uploadedDate is required
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
      />
    </div>
  );
}

    