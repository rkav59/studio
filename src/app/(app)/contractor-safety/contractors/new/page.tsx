
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContractorForm, type ContractorFormDataWithFiles } from "@/components/contractor-safety/contractor-form";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, setDoc } from 'firebase/firestore'; 
import { ref as storageRef, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from "firebase/storage";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseISO } from 'date-fns';
import type { ContractorDocument } from '@/lib/types';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONTRACTORS_COLLECTION = 'contractors';

export default function NewContractorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());

  async function uploadContractorDocument(
    file: File, 
    userId: string, 
    contractorId: string, 
    documentId: string,
    onProgress: (progress: number) => void
  ): Promise<{ url: string, path: string, name: string, type: string, size: number }> {
    const filePath = `contractor_documents/${userId}/${contractorId}/${documentId}/${file.name}`;
    const fileStorageRef = storageRef(storage, filePath);
    
    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        uploadTask.on('state_changed',
            (snapshot: UploadTaskSnapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                reject(error);
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({ url, path: filePath, name: file.name, type: file.type, size: file.size });
            }
        );
    });
  }

  const addContractorMutation = useMutation({
    mutationFn: async (formData: ContractorFormDataWithFiles) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      
      const { documentFiles, documentsToRemove, ...contractorData } = formData; 
      const contractorDocRef = doc(collection(db, CONTRACTORS_COLLECTION));

      const processedDocuments: ContractorDocument[] = await Promise.all(
        (contractorData.documents || []).map(async (docData) => {
          const fileToUpload = documentFiles?.get(docData.id);
          if (fileToUpload) {
            const { url, path, name, type, size } = await uploadContractorDocument(
              fileToUpload,
              user.uid,
              contractorDocRef.id,
              docData.id,
              (progress) => {
                setUploadProgress(prev => new Map(prev).set(docData.id, progress));
              }
            );
            return { ...docData, fileUrl: url, filePath: path, fileName: name, fileType: type, fileSize: size };
          }
          const {fileUrl, filePath, fileName, fileSize, fileType, ...rest } = docData;
          return rest;
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

      await setDoc(contractorDocRef, dataToSave);
      return contractorDocRef.id;
    },
    onSuccess: (newContractorId) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTORS_COLLECTION, user?.uid] });
      setUploadProgress(new Map());
      toast({ title: "Contractor Added", description: "The new contractor has been successfully registered." });
      router.push('/contractor-safety');
    },
    onError: (e: Error) => {
        setUploadProgress(new Map());
        toast({ title: "Error Adding Contractor", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    },
  });

  const handleSaveContractor = (data: ContractorFormDataWithFiles) => {
    addContractorMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/contractor-safety');
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Contractor Safety">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <ClipboardList className="h-6 w-6 text-primary" /> Add New Contractor
            </h1>
        </div>
      <ContractorForm 
        onSave={handleSaveContractor} 
        onCancel={handleCancel} 
        isSubmitting={addContractorMutation.isPending}
        uploadProgress={uploadProgress}
      />
    </div>
  );
}
