
"use client";

import { useRouter, useParams } from 'next/navigation';
import { RiskRegisterEntryForm, type RiskRegisterEntryFormValues } from "@/components/risk-management/risk-register-entry-form";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RiskRegisterEntry, SheqAudit } from '@/lib/types';
import { ArrowLeft, BookOpen, FileDown } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const RISK_REGISTER_ENTRIES_COLLECTION = 'riskRegisterEntries';
const SHEQ_AUDITS_COLLECTION = 'sheqAudits';

export default function EditRiskRegisterEntryPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const entryId = params.id as string;

  const { data: sheqAudits = [], isLoading: isLoadingSheqAudits, error: sheqAuditsError } = useQuery<SheqAudit[]>({
    queryKey: [SHEQ_AUDITS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, SHEQ_AUDITS_COLLECTION), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ 
        id: docSnap.id, 
        ...docSnap.data(),
        auditDate: (docSnap.data().auditDate as Timestamp)?.toDate().toISOString(),
      } as SheqAudit));
    },
    enabled: !!user?.uid,
  });

  const { data: entryToEdit, isLoading: isLoadingEntry, error: entryError } = useQuery<RiskRegisterEntry | null>({
    queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, entryId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !entryId) return null;
      const entryRef = doc(db, RISK_REGISTER_ENTRIES_COLLECTION, entryId);
      const entrySnap = await getDoc(entryRef);
      if (entrySnap.exists() && entrySnap.data().userId === user.uid) {
        const data = entrySnap.data();
        return { 
          id: entrySnap.id, 
          ...data,
          dateIdentified: (data.dateIdentified as Timestamp)?.toDate().toISOString(),
          treatmentDueDate: data.treatmentDueDate ? (data.treatmentDueDate as Timestamp).toDate().toISOString() : undefined,
          lastReviewedDate: data.lastReviewedDate ? (data.lastReviewedDate as Timestamp).toDate().toISOString() : undefined,
          nextReviewDate: data.nextReviewDate ? (data.nextReviewDate as Timestamp).toDate().toISOString() : undefined,
        } as RiskRegisterEntry;
      }
      return null;
    },
    enabled: !!user?.uid && !!entryId,
  });

  const updateEntryMutation = useMutation({
    mutationFn: async (updatedEntryData: RiskRegisterEntry) => { 
      if (!user?.uid || !updatedEntryData.id) throw new Error("User or entry ID missing.");
      const { id, ...dataToUpdate } = updatedEntryData; 
      const entryRef = doc(db, RISK_REGISTER_ENTRIES_COLLECTION, id);
      const dataForDb = { 
        ...dataToUpdate, 
        userId: user.uid, 
        dateIdentified: Timestamp.fromDate(parseISO(dataToUpdate.dateIdentified as string)),
        treatmentDueDate: dataToUpdate.treatmentDueDate ? Timestamp.fromDate(parseISO(dataToUpdate.treatmentDueDate as string)) : null,
        lastReviewedDate: dataToUpdate.lastReviewedDate ? Timestamp.fromDate(parseISO(dataToUpdate.lastReviewedDate as string)) : null,
        nextReviewDate: dataToUpdate.nextReviewDate ? Timestamp.fromDate(parseISO(dataToUpdate.nextReviewDate as string)) : null,
        linkedSheqAuditId: dataToUpdate.linkedSheqAuditId || null,
        linkedSheqAuditName: dataToUpdate.linkedSheqAuditName || null,
      };
      await updateDoc(entryRef, dataForDb); 
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [RISK_REGISTER_ENTRIES_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Risk Entry Updated", description: `Risk "${variables.riskTitle}" has been updated.` });
      router.push('/risk-management');
    },
    onError: (e: Error) => toast({ title: "Error Updating Risk Entry", description: "An unexpected error occurred. Please try again.", variant: "destructive" }),
  });

  const handleSaveEntry = (formData: RiskRegisterEntryFormValues) => {
    if (!entryToEdit) return;
    const entryDataToSave: RiskRegisterEntry = {
      ...entryToEdit, 
      ...formData,
      dateIdentified: parseISO(formData.dateIdentified).toISOString(),
      treatmentDueDate: formData.treatmentDueDate ? parseISO(formData.treatmentDueDate).toISOString() : undefined,
      lastReviewedDate: formData.lastReviewedDate ? parseISO(formData.lastReviewedDate).toISOString() : undefined,
      nextReviewDate: formData.nextReviewDate ? parseISO(formData.nextReviewDate).toISOString() : undefined,
      linkedSheqAuditId: formData.linkedSheqAuditId || undefined,
      linkedSheqAuditName: formData.linkedSheqAuditName || undefined,
    };
    updateEntryMutation.mutate(entryDataToSave);
  };

  const handleCancel = () => {
    router.push('/risk-management');
  };

  const handleDownloadPdf = () => {
    const reportElement = document.getElementById(`pdf-report-risk-entry-${entryId}`);
    if (reportElement) {
        toast({ title: "Generating PDF...", description: "Please wait a moment." });
        html2canvas(reportElement, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth;
            const height = width / ratio;
            
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save(`Risk_Register_Entry_${entryToEdit?.riskTitle.replace(/\s/g, '_')}.pdf`);
        });
    }
  };


  if (isLoadingEntry || isLoadingSheqAudits) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
           <CardContent className="p-6 space-y-4">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent>
        </Card>
      </div>
    );
  }

  if (entryError || !entryToEdit || sheqAuditsError) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Error Loading Data</CardTitle></CardHeader>
          <CardContent><p>The risk entry or SHEQ audit data could not be found, or an error occurred.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <>
    <RiskRegisterEntryPdfReport entry={entryToEdit} />
    <div className="space-y-6">
       <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Risk Management">
                  <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-green-600" /> Edit Risk: {entryToEdit.riskTitle}
              </h1>
            </div>
            <Button variant="outline" onClick={handleDownloadPdf}>
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
        </div>
      <Card className="shadow-lg">
         <CardHeader>
          <CardDescription>
            Modify the details for this risk register entry.
          </CardDescription>
        </CardHeader>
        <RiskRegisterEntryForm 
            initialData={entryToEdit}
            sheqAudits={sheqAudits} 
            onSave={handleSaveEntry} 
            onCancel={handleCancel}
            isSubmitting={updateEntryMutation.isPending}
        />
      </Card>
    </div>
    </>
  );
}


const RiskRegisterEntryPdfReport = ({ entry }: { entry: RiskRegisterEntry }) => {
    return (
        <div id={`pdf-report-risk-entry-${entry.id}`} style={{ width: '800px', padding: '40px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', position: 'absolute', left: '-9999px', top: 0 }}>
            <h1 style={{ fontSize: '24px', color: '#2C3E50', borderBottom: '2px solid #3498DB', paddingBottom: '10px' }}>Risk Register Entry Report</h1>
            
            <h2 style={{ fontSize: '18px', color: '#34495E', marginTop: '20px' }}>{entry.riskTitle}</h2>
            <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{entry.riskDescription}</p>

            <h3 style={{ fontSize: '16px', color: '#2980B9', marginTop: '20px' }}>Identification</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                    <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}><strong>Date Identified:</strong></td><td style={{ padding: '6px', border: '1px solid #ddd' }}>{format(parseISO(entry.dateIdentified), 'PPP')}</td></tr>
                    <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}><strong>Identified By:</strong></td><td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.identifiedBy}</td></tr>
                    <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}><strong>Category:</strong></td><td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.category || 'N/A'}</td></tr>
                    <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}><strong>Source:</strong></td><td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.source || 'N/A'}</td></tr>
                </tbody>
            </table>

            <h3 style={{ fontSize: '16px', color: '#2980B9', marginTop: '20px' }}>Risk Analysis</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ padding: '6px', border: '1px solid #ddd' }}></th>
                        <th style={{ padding: '6px', border: '1px solid #ddd' }}>Likelihood</th>
                        <th style={{ padding: '6px', border: '1px solid #ddd' }}>Severity</th>
                        <th style={{ padding: '6px', border: '1px solid #ddd' }}>Risk Level</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ padding: '6px', border: '1px solid #ddd' }}><strong>Initial:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.initialLikelihood}</td>
                        <td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.initialSeverity}</td>
                        <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'bold' }}>{entry.initialRiskLevel}</td>
                    </tr>
                     <tr>
                        <td style={{ padding: '6px', border: '1px solid #ddd' }}><strong>Residual:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.residualLikelihood || 'N/A'}</td>
                        <td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.residualSeverity || 'N/A'}</td>
                        <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'bold' }}>{entry.residualRiskLevel || 'N/A'}</td>
                    </tr>
                </tbody>
            </table>
            
            <h3 style={{ fontSize: '16px', color: '#2980B9', marginTop: '20px' }}>Risk Treatment</h3>
            <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>{entry.treatmentPlan}</p>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' }}>
                <tbody>
                    <tr><td style={{ padding: '6px', border: '1px solid #ddd', width: '25%' }}><strong>Risk Owner:</strong></td><td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.riskOwner}</td></tr>
                    <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}><strong>Status:</strong></td><td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.status}</td></tr>
                    <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}><strong>Treatment Due Date:</strong></td><td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.treatmentDueDate ? format(parseISO(entry.treatmentDueDate), 'PPP') : 'N/A'}</td></tr>
                </tbody>
            </table>

             <h3 style={{ fontSize: '16px', color: '#2980B9', marginTop: '20px' }}>Monitoring & Review</h3>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                    <tr><td style={{ padding: '6px', border: '1px solid #ddd', width: '25%' }}><strong>Last Reviewed:</strong></td><td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.lastReviewedDate ? format(parseISO(entry.lastReviewedDate), 'PPP') : 'N/A'}</td></tr>
                    <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}><strong>Next Review:</strong></td><td style={{ padding: '6px', border: '1px solid #ddd' }}>{entry.nextReviewDate ? format(parseISO(entry.nextReviewDate), 'PPP') : 'N/A'}</td></tr>
                </tbody>
            </table>

            {entry.notes && (
                 <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontSize: '16px', color: '#34495E' }}>Notes:</h3>
                    <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>{entry.notes}</p>
                </div>
            )}
        </div>
    );
};
