
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
import type { Incident } from "@/lib/types";
import { format, parseISO } from 'date-fns';
import { Megaphone, CalendarDays, MapPin, User, TypeRows, ShieldAlert, Briefcase, LinkIcon, Activity, BarChart3, Info, AlertTriangle, CheckSquare, XCircle, FileDown } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface IncidentDetailsDialogProps {
  incident: Incident;
  onClose: () => void;
}

export function IncidentDetailsDialog({ incident, onClose }: IncidentDetailsDialogProps) {

  const handleDownloadPdf = () => {
    const reportElement = document.getElementById(`pdf-report-${incident.id}`);
    if (reportElement) {
        html2canvas(reportElement, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth;
            const height = width / ratio;

            // Check if content fits on one page
            if (height <= pdfHeight) {
                pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            } else { // Handle multi-page content
                let position = 0;
                const pageHeight = pdf.internal.pageSize.getHeight();
                let remainingHeight = canvasHeight;

                while (remainingHeight > 0) {
                    // Create a temporary canvas for the current page chunk
                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvasWidth;
                    
                    // Determine chunk height - either full page or remaining part
                    const chunkHeight = Math.min(remainingHeight, (canvasWidth / pdfWidth) * pageHeight);
                    pageCanvas.height = chunkHeight;

                    const ctx = pageCanvas.getContext('2d');
                    if (ctx) {
                        // Draw the chunk of the original canvas onto the page canvas
                        ctx.drawImage(canvas, 0, position, canvasWidth, chunkHeight, 0, 0, canvasWidth, chunkHeight);
                        
                        const pageImgData = pageCanvas.toDataURL('image/png');
                        const pageImgRatio = pageCanvas.width / pageCanvas.height;
                        const pageImgWidth = pdfWidth;
                        const pageImgHeight = pageImgWidth / pageImgRatio;
                        
                        pdf.addImage(pageImgData, 'PNG', 0, 0, pageImgWidth, pageImgHeight);

                        position += chunkHeight;
                        remainingHeight -= chunkHeight;

                        if (remainingHeight > 0) {
                            pdf.addPage();
                        }
                    } else {
                        break; // Exit if context can't be created
                    }
                }
            }

            pdf.save(`Incident_Report_${incident.id}.pdf`);
        });
    }
};

  const getIncidentStatusColor = (status?: Incident['status']) => {
    switch (status) {
      case 'Open': return 'text-blue-600 dark:text-blue-400';
      case 'Under Investigation': return 'text-yellow-600 dark:text-yellow-400';
      case 'Actions Pending': return 'text-orange-500 dark:text-orange-400';
      case 'Closed': return 'text-green-600 dark:text-green-400';
      default: return 'text-muted-foreground';
    }
  };
  
  const getIncidentTypeIcon = (type: Incident['type']) => {
    switch (type) {
      case 'Incident': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'Near Miss': return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
      case 'Hazard': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Megaphone className="h-5 w-5 text-muted-foreground"/>;
    }
  };

  const PdfReportContent = () => (
    <div id={`pdf-report-${incident.id}`} style={{ width: '800px', padding: '40px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', position: 'absolute', left: '-9999px', top: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #3498DB', paddingBottom: '10px' }}>
             <h1 style={{ fontSize: '28px', color: '#2C3E50', margin: 0 }}>Incident Report</h1>
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3498DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
        </div>
        <div style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#34495E', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '15px' }}>Event Overview</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Report ID:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.id}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Event Type:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.type}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Date & Time:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{format(parseISO(incident.timestamp), "yyyy-MM-dd, HH:mm")}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Location:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.location}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Region/Dept:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.region}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Reported By:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.reportedBy || 'N/A'}</td></tr>
                </tbody>
            </table>
        </div>
        <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#34495E' }}>Description of Event:</h3>
            <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>{incident.description}</p>
        </div>
        <div style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#34495E', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '15px' }}>Classification & Impact</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Classification:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.classification || 'N/A'}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Severity:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.severityLevel || 'N/A'}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Recordable (OSHA/Local):</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.isRecordable ? 'Yes' : 'No'}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Fatality:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.isFatality ? 'Yes' : 'No'}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Lost Work Days:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.lostWorkDays !== undefined ? incident.lostWorkDays : 'N/A'}</td></tr>
                </tbody>
            </table>
        </div>
        <div style={{ marginTop: '20px' }}>
             <h2 style={{ fontSize: '20px', color: '#34495E', borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '15px' }}>Status & Follow-up</h2>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Current Status:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.status || 'N/A'}</td></tr>
                    <tr><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Root Cause Analysis Done:</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{incident.rootCauseAnalyzed ? 'Yes' : 'No'}</td></tr>
                </tbody>
             </table>
        </div>
        <div style={{ marginTop: '40px', fontSize: '12px', color: '#777', textAlign: 'center' }}>
            Report generated by SHEiQpro on {format(new Date(), 'PPP')}
        </div>
    </div>
  );

  return (
    <>
    <PdfReportContent />
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            {getIncidentTypeIcon(incident.type)} {incident.type} Details
          </DialogTitle>
          <DialogDescription>
            Detailed information for the logged event.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <section>
                    <h3 className="text-md font-semibold mb-1 border-b pb-1">Event Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
                        <p><strong className="text-muted-foreground">Type:</strong> {incident.type}</p>
                        <p><CalendarDays className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Date & Time:</strong> {format(parseISO(incident.timestamp), "PPPp")}</p>
                        <p className="md:col-span-2"><MapPin className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Location:</strong> {incident.location}</p>
                        <p><strong className="text-muted-foreground">Region/Dept:</strong> {incident.region}</p>
                        {incident.reportedBy && <p><User className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Reported By:</strong> {incident.reportedBy}</p>}
                    </div>
                     <div className="mt-2">
                        <strong className="text-muted-foreground">Description:</strong>
                        <p className="whitespace-pre-wrap text-foreground bg-secondary/50 p-2 rounded-md text-xs mt-0.5">{incident.description}</p>
                    </div>
                </section>

                <Separator/>
                
                <section>
                    <h3 className="text-md font-semibold mb-1 border-b pb-1">Classification & Impact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
                        {incident.classification && <p><Briefcase className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Classification:</strong> {incident.classification}</p>}
                        {incident.severityLevel && <p><BarChart3 className="inline h-4 w-4 mr-1 text-muted-foreground" /><strong>Severity:</strong> {incident.severityLevel}</p>}
                         <p className="flex items-center gap-1">{incident.isRecordable ? <CheckSquare className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-muted-foreground"/>} Recordable (OSHA/Local)</p>
                         <p className="flex items-center gap-1">{incident.isFatality ? <AlertTriangle className="h-4 w-4 text-red-500"/> : <CheckSquare className="h-4 w-4 text-muted-foreground"/>} Fatality Occurred</p>
                        {incident.lostWorkDays !== undefined && incident.lostWorkDays > 0 && <p><strong className="text-muted-foreground">Lost Work Days:</strong> {incident.lostWorkDays}</p>}
                    </div>
                </section>
                
                <Separator/>

                <section>
                    <h3 className="text-md font-semibold mb-1 border-b pb-1">Status & Follow-up</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1">
                        <p className="flex items-center gap-1"><Activity className="h-4 w-4 text-muted-foreground" /><strong>Status:</strong> <span className={`font-semibold ${getIncidentStatusColor(incident.status)}`}>{incident.status || 'N/A'}</span></p>
                        <p className="flex items-center gap-1">{incident.rootCauseAnalyzed ? <CheckSquare className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-muted-foreground"/>} Root Cause Analysis Done</p>
                    </div>
                </section>
            </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t flex justify-between">
          <Button variant="outline" onClick={handleDownloadPdf}>
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
