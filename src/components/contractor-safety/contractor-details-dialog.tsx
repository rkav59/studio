
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Contractor, ContractorDocument } from "@/lib/types";
import { format, parseISO, isValid } from 'date-fns';
import { Building, User, Mail, Phone, Wrench, CheckCircle2, XCircle, AlertTriangle, FileText, CalendarDays, ShieldQuestion } from "lucide-react";

interface ContractorDetailsDialogProps {
  contractor: Contractor;
  onClose: () => void;
}

export function ContractorDetailsDialog({ contractor, onClose }: ContractorDetailsDialogProps) {

  const getVettingStatusIcon = (status: Contractor['vettingStatus']) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'Pending': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'Rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Requires Review': return <ShieldQuestion className="h-5 w-5 text-orange-500" />;
      default: return null;
    }
  };
  
  const getDocumentTypeIcon = (type: ContractorDocument['documentType']) => {
     // Simple icon mapping, can be expanded
    switch(type) {
        case 'Insurance': return <FileText className="h-4 w-4 text-blue-500"/>;
        case 'Certification': return <CheckSquare className="h-4 w-4 text-green-500"/>;
        default: return <FileText className="h-4 w-4 text-gray-500"/>;
    }
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Building className="h-6 w-6" /> {contractor.companyName}
          </DialogTitle>
          <DialogDescription>
            Detailed information for {contractor.tradeOrService} contractor.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-6">
                {/* Contact Info */}
                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/><strong>Person:</strong> {contractor.contactPerson}</p>
                        <p className="flex items-center gap-2"><Wrench className="h-4 w-4 text-muted-foreground"/><strong>Trade:</strong> {contractor.tradeOrService}</p>
                        {contractor.contactEmail && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/><strong>Email:</strong> {contractor.contactEmail}</p>}
                        {contractor.contactPhone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><strong>Phone:</strong> {contractor.contactPhone}</p>}
                    </div>
                </section>

                <Separator/>

                {/* Vetting & Induction */}
                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">Vetting & Safety Induction</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm items-start">
                        <div className="flex items-center gap-2">
                            {getVettingStatusIcon(contractor.vettingStatus)}
                            <strong>Vetting Status:</strong>
                            <span className={`font-medium ${
                                contractor.vettingStatus === 'Approved' ? 'text-green-600' : 
                                contractor.vettingStatus === 'Pending' ? 'text-yellow-600' :
                                contractor.vettingStatus === 'Rejected' ? 'text-red-600' :
                                contractor.vettingStatus === 'Requires Review' ? 'text-orange-600' : ''
                            }`}>
                                {contractor.vettingStatus}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {contractor.inductionCompleted ? <CheckCircle2 className="h-5 w-5 text-green-500"/> : <XCircle className="h-5 w-5 text-red-500"/>}
                            <strong>Induction Completed:</strong> 
                            <span className={contractor.inductionCompleted ? "text-green-600" : "text-red-600"}>
                                {contractor.inductionCompleted ? "Yes" : "No"}
                            </span>
                        </div>
                    </div>
                    {contractor.vettingNotes && <p className="text-sm mt-2"><strong>Vetting Notes:</strong><br/><span className="text-muted-foreground whitespace-pre-wrap">{contractor.vettingNotes}</span></p>}
                     {contractor.inductionCompleted && contractor.inductionDate && isValid(parseISO(contractor.inductionDate)) && (
                        <p className="text-sm mt-1"><strong>Induction Date:</strong> {format(parseISO(contractor.inductionDate), "PPP")}</p>
                    )}
                </section>
                
                <Separator/>

                {/* Documents */}
                <section>
                    <h3 className="text-lg font-semibold mb-2 border-b pb-1">Associated Documents (Simulated)</h3>
                    {contractor.documents && contractor.documents.length > 0 ? (
                        <ul className="space-y-2">
                            {contractor.documents.map(doc => (
                                <li key={doc.id} className="p-2 border rounded-md bg-muted/50 text-sm">
                                    <p className="font-medium flex items-center gap-2">{getDocumentTypeIcon(doc.documentType)} {doc.name} ({doc.documentType})</p>
                                    {doc.fileUrlPlaceholder && <p className="text-xs text-muted-foreground">File Ref: {doc.fileUrlPlaceholder}</p>}
                                    <p className="text-xs text-muted-foreground">Uploaded: {format(parseISO(doc.uploadedDate), "PPP")}</p>
                                    {doc.expiryDate && isValid(parseISO(doc.expiryDate)) && (
                                        <p className={`text-xs ${new Date(doc.expiryDate) < new Date() ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                                            Expires: {format(parseISO(doc.expiryDate), "PPP")}
                                            {new Date(doc.expiryDate) < new Date() && " (Expired)"}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground italic">No documents recorded for this contractor.</p>}
                </section>
                
                <Separator/>

                {/* Performance Notes */}
                {contractor.performanceNotes && (
                    <section>
                         <h3 className="text-lg font-semibold mb-2 border-b pb-1">Performance Notes</h3>
                         <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contractor.performanceNotes}</p>
                    </section>
                )}
            </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

