
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation'; // Added
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Dialog import
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Trash2, Eye, Users, Thermometer, ShieldCheck, Award, UserPlus, FlaskConical, ClipboardPlus, Users2Icon, AlertTriangle, CalendarClock, ClockIcon, ShieldAlert, FilePlus, Loader2, HeartPulse, Search, ArrowDown } from "lucide-react";
import type { SimilarExposureGroup, IndustrialHygieneSample, MedicalTestRecord, WellnessProgram, MedicalTestWithCertStatus, MedicalTestPrefillData, IndustrialHygieneSampleAgent, MedicalTestRecordType } from "@/lib/types";
// Removed form imports: SegForm, IhSampleForm, MedicalTestForm, WellnessProgramForm
import { SegDetailsDialog } from '@/components/health-monitoring/seg-details-dialog';
import { IhSampleDetailsDialog } from '@/components/health-monitoring/ih-sample-details-dialog';
import { MedicalTestDetailsDialog } from '@/components/health-monitoring/medical-test-details-dialog';
import { WellnessProgramDetailsDialog } from '@/components/health-monitoring/wellness-program-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, differenceInDays, isBefore } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// Removed agentToMedicalTestMap import as prefill button is removed for now
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const SEGS_COLLECTION = 'similarExposureGroups';
const IH_SAMPLES_COLLECTION = 'industrialHygieneSamples';
const MEDICAL_TESTS_COLLECTION = 'medicalTestRecords';
const WELLNESS_PROGRAMS_COLLECTION = 'wellnessPrograms';
const CERT_EXPIRY_REMINDER_LEAD_DAYS = 30;

export default function HealthMonitoringPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter(); // Initialize useRouter

  const [viewingSeg, setViewingSeg] = useState<SimilarExposureGroup | null>(null);
  const [viewingIhSample, setViewingIhSample] = useState<IndustrialHygieneSample | null>(null);
  const [viewingMedicalTest, setViewingMedicalTest] = useState<MedicalTestRecord | null>(null);
  const [viewingWellnessProgram, setViewingWellnessProgram] = useState<WellnessProgram | null>(null);
  const [segSearchTerm, setSegSearchTerm] = useState("");
  const [ihSampleSearchTerm, setIhSampleSearchTerm] = useState("");
  const [medicalTestSearchTerm, setMedicalTestSearchTerm] = useState("");
  const [wellnessProgramSearchTerm, setWellnessProgramSearchTerm] = useState("");


  // Fetch SEGs
  const { data: segs = [], isLoading: isLoadingSegs, error: segsError } = useQuery<SimilarExposureGroup[]>({
    queryKey: [SEGS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, SEGS_COLLECTION), where("userId", "==", user.uid), orderBy("name"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SimilarExposureGroup));
    },
    enabled: !!user?.uid,
  });

  // Fetch IH Samples
  const { data: ihSamples = [], isLoading: isLoadingIhSamples, error: ihSamplesError } = useQuery<IndustrialHygieneSample[]>({
    queryKey: [IH_SAMPLES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, IH_SAMPLES_COLLECTION), where("userId", "==", user.uid), orderBy("sampleDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, sampleDate: (data.sampleDate as Timestamp)?.toDate().toISOString() } as IndustrialHygieneSample;
      });
    },
    enabled: !!user?.uid,
  });
  
  // Fetch Medical Tests
  const { data: medicalTests = [], isLoading: isLoadingMedicalTests, error: medicalTestsError } = useQuery<MedicalTestRecord[]>({
    queryKey: [MEDICAL_TESTS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, MEDICAL_TESTS_COLLECTION), where("userId", "==", user.uid), orderBy("testDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, ...data, 
          testDate: (data.testDate as Timestamp)?.toDate().toISOString(),
          certificateExpiryDate: data.certificateExpiryDate ? (data.certificateExpiryDate as Timestamp).toDate().toISOString() : null,
        } as MedicalTestRecord;
      });
    },
    enabled: !!user?.uid,
  });

  // Fetch Wellness Programs
  const { data: wellnessPrograms = [], isLoading: isLoadingWellnessPrograms, error: wellnessProgramsError } = useQuery<WellnessProgram[]>({
    queryKey: [WELLNESS_PROGRAMS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, WELLNESS_PROGRAMS_COLLECTION), where("userId", "==", user.uid), orderBy("startDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, ...data, 
          startDate: (data.startDate as Timestamp)?.toDate().toISOString(),
          endDate: data.endDate ? (data.endDate as Timestamp).toDate().toISOString() : undefined,
        } as WellnessProgram;
      });
    },
    enabled: !!user?.uid,
  });

  // Deletion Mutations
  const deleteSegMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      if (ihSamples.some(s => s.segId === id) || medicalTests.some(t => t.segId === id)) {
        throw new Error("Cannot delete: This SEG is linked to existing IH samples or medical tests.");
      }
      await deleteDoc(doc(db, SEGS_COLLECTION, id));
    },
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [SEGS_COLLECTION, user?.uid]}); toast({title:"SEG Deleted"}); },
    onError: (e:Error) => {
        const userFriendlyMessage = e.message.includes("linked to existing") 
            ? e.message
            : "An unexpected error occurred. Please try again.";
        toast({title:"Error Deleting SEG", description: userFriendlyMessage, variant:"destructive", duration: 7000});
    },
  });

  const deleteIhSampleMutation = useMutation({
    mutationFn: (id: string) => deleteDoc(doc(db, IH_SAMPLES_COLLECTION, id)),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [IH_SAMPLES_COLLECTION, user?.uid]}); toast({title:"IH Sample Deleted"}); },
    onError: (e:Error) => toast({title:"Error Deleting IH Sample", description: "An unexpected error occurred. Please try again.", variant:"destructive"}),
  });

  const deleteMedicalTestMutation = useMutation({
    mutationFn: (id: string) => deleteDoc(doc(db, MEDICAL_TESTS_COLLECTION, id)),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [MEDICAL_TESTS_COLLECTION, user?.uid]}); toast({title:"Medical Test Deleted"});},
    onError: (e:Error) => toast({title:"Error Deleting Medical Test", description: "An unexpected error occurred. Please try again.", variant:"destructive"}),
  });

  const deleteWellnessProgramMutation = useMutation({
    mutationFn: (id: string) => deleteDoc(doc(db, WELLNESS_PROGRAMS_COLLECTION, id)),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [WELLNESS_PROGRAMS_COLLECTION, user?.uid]}); toast({title:"Wellness Program Deleted"});},
    onError: (e:Error) => toast({title:"Error Deleting Wellness Program", description: "An unexpected error occurred. Please try again.", variant:"destructive"}),
  });

  // Navigation Handlers
  const handleOpenNewSegForm = () => router.push('/health-monitoring/segs/new');
  const handleEditSeg = (seg: SimilarExposureGroup) => router.push(`/health-monitoring/segs/edit/${seg.id}`);
  const handleDeleteSeg = (id: string) => deleteSegMutation.mutate(id);
  
  const handleOpenNewIhSampleForm = () => router.push('/health-monitoring/ih-samples/new');
  const handleEditIhSample = (sample: IndustrialHygieneSample) => router.push(`/health-monitoring/ih-samples/edit/${sample.id}`);
  const handleDeleteIhSample = (id: string) => deleteIhSampleMutation.mutate(id);
  
  const handleOpenNewMedicalTestForm = () => router.push('/health-monitoring/medical-tests/new');
  const handleEditMedicalTest = (record: MedicalTestRecord) => router.push(`/health-monitoring/medical-tests/edit/${record.id}`);
  const handleDeleteMedicalTest = (id: string) => deleteMedicalTestMutation.mutate(id);

  const handleOpenNewWellnessProgramForm = () => router.push('/health-monitoring/wellness-programs/new');
  const handleEditWellnessProgram = (program: WellnessProgram) => router.push(`/health-monitoring/wellness-programs/edit/${program.id}`);
  const handleDeleteWellnessProgram = (id: string) => deleteWellnessProgramMutation.mutate(id);
  
  const getSegName = (segId?: string) => segs.find(s => s.id === segId)?.name || "N/A";

  const medicalTestsWithCertStatus = useMemo((): MedicalTestWithCertStatus[] => {
    return medicalTests.map(test => {
      let certificateStatus: MedicalTestWithCertStatus['certificateStatus'] = 'N/A';
      if (test.certificateExpiryDate && isValid(parseISO(test.certificateExpiryDate))) {
        const expiry = parseISO(test.certificateExpiryDate);
        const today = new Date(); today.setHours(0,0,0,0);
        if (isBefore(expiry, today)) certificateStatus = 'Expired';
        else if (differenceInDays(expiry, today) <= CERT_EXPIRY_REMINDER_LEAD_DAYS) certificateStatus = 'Expiring Soon';
        else certificateStatus = 'Valid';
      }
      return { ...test, certificateStatus };
    }).sort((a,b) => {
        const statusOrder = { 'Expired': 1, 'Expiring Soon': 2, 'Valid': 3, 'N/A': 4};
        const aStatusVal = statusOrder[a.certificateStatus || 'N/A'] || 5;
        const bStatusVal = statusOrder[b.certificateStatus || 'N/A'] || 5;
        if(aStatusVal !== bStatusVal) return aStatusVal - bStatusVal;
        if(a.certificateExpiryDate && b.certificateExpiryDate) return parseISO(a.certificateExpiryDate).getTime() - parseISO(b.certificateExpiryDate).getTime();
        return a.certificateExpiryDate ? -1 : (b.certificateExpiryDate ? 1 : (parseISO(b.testDate).getTime() - parseISO(a.testDate).getTime()));
    });
  }, [medicalTests]);

  const upcomingOrOverdueCerts = useMemo(() => medicalTestsWithCertStatus.filter(test => test.certificateStatus === 'Expired' || test.certificateStatus === 'Expiring Soon'), [medicalTestsWithCertStatus]);

  // Filtering Logic
  const filteredSegs = useMemo(() => segs.filter(seg => seg.name.toLowerCase().includes(segSearchTerm.toLowerCase())), [segs, segSearchTerm]);
  const filteredIhSamples = useMemo(() => ihSamples.filter(s => s.agent.toLowerCase().includes(ihSampleSearchTerm.toLowerCase()) || (s.employeeName && s.employeeName.toLowerCase().includes(ihSampleSearchTerm.toLowerCase())) || s.location.toLowerCase().includes(ihSampleSearchTerm.toLowerCase()) ), [ihSamples, ihSampleSearchTerm]);
  const filteredMedicalTests = useMemo(() => medicalTestsWithCertStatus.filter(t => t.employeeName.toLowerCase().includes(medicalTestSearchTerm.toLowerCase()) || t.testType.toLowerCase().includes(medicalTestSearchTerm.toLowerCase())), [medicalTestsWithCertStatus, medicalTestSearchTerm]);
  const filteredWellnessPrograms = useMemo(() => wellnessPrograms.filter(p => p.programName.toLowerCase().includes(wellnessProgramSearchTerm.toLowerCase())), [wellnessPrograms, wellnessProgramSearchTerm]);


  const getCertStatusStyling = (status?: MedicalTestWithCertStatus['certificateStatus']) => {
    if (!status || status === 'N/A') return { textClass: 'text-muted-foreground', bgClass: 'bg-muted/50' };
    switch (status) {
      case 'Expired': return { textClass: 'text-red-700 dark:text-red-400 font-bold', bgClass: 'bg-red-100 dark:bg-red-900/30' };
      case 'Expiring Soon': return { textClass: 'text-yellow-700 dark:text-yellow-400 font-semibold', bgClass: 'bg-yellow-100 dark:bg-yellow-900/30' };
      case 'Valid': return { textClass: 'text-green-700 dark:text-green-400', bgClass: 'bg-green-100 dark:bg-green-900/30' };
      default: return { textClass: 'text-muted-foreground', bgClass: 'bg-muted/50' };
    }
  };
  
  const isLoading = isLoadingSegs || isLoadingIhSamples || isLoadingMedicalTests || isLoadingWellnessPrograms;
  const anyError = segsError || ihSamplesError || medicalTestsError || wellnessProgramsError;

  if (isLoading) return (<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3 text-lg text-muted-foreground">Loading health data...</p></div>);
  if (anyError) return <div className="text-red-500 text-center py-10">Error loading data. Please try again later.</div>;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <HeartPulse className="h-8 w-8"/> Proactive Health Management
        </h1>
        <p className="text-muted-foreground">
          Monitor occupational health, exposure data, medical screenings, and wellness. This module facilitates health monitoring including SEGs, IH sampling, medical tests, and wellness programs. Data is stored in Firebase Firestore.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="#certificate-expiries"><ArrowDown className="mr-2 h-4 w-4"/>Certificate Expiries</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#segs"><ArrowDown className="mr-2 h-4 w-4"/>Similar Exposure Groups</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#ih-sampling"><ArrowDown className="mr-2 h-4 w-4"/>IH Sampling</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#medical-tests"><ArrowDown className="mr-2 h-4 w-4"/>Medical Tests</Link>
          </Button>
           <Button asChild variant="outline" size="sm">
            <Link href="#wellness-programs"><ArrowDown className="mr-2 h-4 w-4"/>Wellness Programs</Link>
          </Button>
        </CardContent>
      </Card>
      
      <Separator/>

      <Card id="certificate-expiries">
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-6 w-6 text-orange-500"/>Upcoming/Overdue Certificate Expiries</CardTitle><CardDescription>Medical test certificates requiring attention.</CardDescription></CardHeader>
        <CardContent>{upcomingOrOverdueCerts.length === 0 ? <p className="text-muted-foreground text-center py-4">No certificates currently due or overdue.</p> : (
            <ScrollArea className="max-h-[300px] pr-3"><div className="space-y-3">{upcomingOrOverdueCerts.map(test => { const { textClass } = getCertStatusStyling(test.certificateStatus); return (
              <Card key={`due-cert-${test.id}`} className={`p-3 shadow-sm border-l-4 ${test.certificateStatus === 'Expired' ? 'border-red-500' : 'border-yellow-500'}`}><div className="flex flex-col sm:flex-row justify-between items-start"><div className="mb-1 sm:mb-0"><h4 className="font-semibold text-md">{test.employeeName} - {test.testType}</h4><p className={`text-xs font-semibold ${textClass}`}>Status: {test.certificateStatus}{test.certificateExpiryDate && ` (Expires: ${format(parseISO(test.certificateExpiryDate), "PPP")})`}</p><p className="text-xs text-muted-foreground">Test Date: {format(parseISO(test.testDate), "PPP")}</p></div><Button variant="outline" size="sm" onClick={() => setViewingMedicalTest(test)}>View Record</Button></div></Card>
            )})}</div></ScrollArea>
        )}</CardContent>
      </Card>
      <Separator/>

      <Card id="segs">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Similar Exposure Groups (SEGs)</CardTitle>
                <CardDescription>Define and manage groups of employees with similar exposure profiles.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search SEGs..." className="pl-8 w-full sm:w-[200px]" value={segSearchTerm} onChange={(e) => setSegSearchTerm(e.target.value)} /></div>
                <Button onClick={handleOpenNewSegForm} className="bg-primary hover:bg-primary/90"><UserPlus className="mr-2 h-4 w-4" />Add SEG</Button>
            </div>
        </CardHeader>
        <CardContent>{filteredSegs.length === 0 ? <p className="text-muted-foreground text-center py-4">{segSearchTerm ? "No matching SEGs found." : "No SEGs defined."}</p> : (<ScrollArea className="max-h-[300px] pr-3"><div className="space-y-3">{filteredSegs.map(seg => (<Card key={seg.id} className="p-3 shadow-sm"><div className="flex justify-between items-start"><div><h4 className="font-semibold">{seg.name}</h4><p className="text-xs text-muted-foreground truncate max-w-md">{seg.description || "No description"}</p></div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingSeg(seg)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => handleEditSeg(seg)}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteSegMutation.isPending && deleteSegMutation.variables === seg.id}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete SEG?</AlertDialogTitle><AlertDialogDescription>Delete "{seg.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSeg(seg.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>))}</div></ScrollArea>)}</CardContent>
      </Card>
      {viewingSeg && <SegDetailsDialog seg={viewingSeg} onClose={() => setViewingSeg(null)} />}
      <Separator/>

      <Card id="ih-sampling">
        <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><FlaskConical className="h-6 w-6 text-accent"/>Industrial Hygiene Sampling</CardTitle><CardDescription>Log and track exposure monitoring data.</CardDescription></div>
            <div className="flex items-center gap-2">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search samples..." className="pl-8 w-full sm:w-[200px]" value={ihSampleSearchTerm} onChange={(e) => setIhSampleSearchTerm(e.target.value)} /></div>
                <Button onClick={handleOpenNewIhSampleForm} className="bg-accent hover:bg-accent/90"><FilePlus className="mr-2 h-4 w-4" />Log IH Sample</Button>
            </div>
        </CardHeader>
        <CardContent>{filteredIhSamples.length === 0 ? <p className="text-muted-foreground text-center py-4">{ihSampleSearchTerm ? "No matching samples found." : "No IH samples logged."}</p> : (<ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">{filteredIhSamples.map(sample => (<Card key={sample.id} className={`p-3 shadow-sm ${sample.oel !== undefined && sample.exposureLevel > sample.oel ? 'border-l-4 border-red-500' : ''}`}><div className="flex justify-between items-start"><div><h4 className="font-semibold">{sample.agent}{sample.specificAgentName ? ` (${sample.specificAgentName})` : ''} - {format(parseISO(sample.sampleDate), "PPP")}</h4><p className="text-xs text-muted-foreground">Level: {sample.exposureLevel} {sample.units} {sample.oel !== undefined && `(OEL: ${sample.oel} ${sample.oelUnits || sample.units})`} | SEG: {getSegName(sample.segId)}</p>{sample.oel !== undefined && sample.exposureLevel > sample.oel && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>EXPOSURE EXCEEDS OEL!</p>}</div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingIhSample(sample)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => handleEditIhSample(sample)}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteIhSampleMutation.isPending && deleteIhSampleMutation.variables === sample.id}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete IH Sample?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteIhSample(sample.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>))}</div></ScrollArea>)}</CardContent>
      </Card>
      {viewingIhSample && <IhSampleDetailsDialog sample={viewingIhSample} segName={getSegName(viewingIhSample.segId)} onClose={() => setViewingIhSample(null)} />}
      <Separator/>

      <Card id="medical-tests">
        <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><ClipboardPlus className="h-6 w-6 text-teal-500"/>Medical Test & Screening Records</CardTitle><CardDescription>Track employee medical tests and certificate expiries.</CardDescription></div>
            <div className="flex items-center gap-2">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search records..." className="pl-8 w-full sm:w-[200px]" value={medicalTestSearchTerm} onChange={(e) => setMedicalTestSearchTerm(e.target.value)} /></div>
                <Button onClick={handleOpenNewMedicalTestForm} className="bg-teal-500 hover:bg-teal-600 text-white"><FilePlus className="mr-2 h-4 w-4" />Log Medical Record</Button>
            </div>
        </CardHeader>
        <CardContent>{filteredMedicalTests.length === 0 ? <p className="text-muted-foreground text-center py-4">{medicalTestSearchTerm ? "No matching records found." : "No medical records logged."}</p> : (<ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">{filteredMedicalTests.map(test => { const { textClass, bgClass } = getCertStatusStyling(test.certificateStatus); return (<Card key={test.id} className={`p-3 shadow-sm ${test.certificateStatus === 'Expired' ? 'border-l-4 border-red-500' : test.certificateStatus === 'Expiring Soon' ? 'border-l-4 border-yellow-500' : '' }`}><div className="flex justify-between items-start"><div><h4 className="font-semibold">{test.employeeName} - {test.testType}{test.specificTestName ? ` (${test.specificTestName})` : ''}</h4><p className="text-xs text-muted-foreground">Date: {format(parseISO(test.testDate), "PPP")} | Fit: {test.isFitForWork === undefined ? 'N/A' : test.isFitForWork ? 'Yes' : 'No'}</p>{test.certificateExpiryDate && (<p className={`text-xs flex items-center gap-1 ${textClass}`}><ClockIcon className="h-3 w-3"/>Cert. Expiry: {format(parseISO(test.certificateExpiryDate), "PPP")} {test.certificateStatus && test.certificateStatus !== 'N/A' && <span className={`px-1.5 py-0.5 rounded-full text-xs ${bgClass}`}>{test.certificateStatus}</span>}</p>)}{test.followUpRequired && <p className="text-xs text-yellow-600 font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>Follow-up Required</p>}</div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingMedicalTest(test)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => handleEditMedicalTest(test)}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteMedicalTestMutation.isPending && deleteMedicalTestMutation.variables === test.id}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Medical Test Record?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMedicalTest(test.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>)})}</div></ScrollArea>)}</CardContent>
      </Card>
      {viewingMedicalTest && <MedicalTestDetailsDialog record={viewingMedicalTest} segName={getSegName(viewingMedicalTest.segId)} onClose={() => setViewingMedicalTest(null)} />}
      <Separator/>

      <Card id="wellness-programs">
        <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><Users2Icon className="h-6 w-6 text-purple-500"/>Employee Wellness Programs</CardTitle><CardDescription>Manage and track wellness initiatives.</CardDescription></div>
            <div className="flex items-center gap-2">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search programs..." className="pl-8 w-full sm:w-[200px]" value={wellnessProgramSearchTerm} onChange={(e) => setWellnessProgramSearchTerm(e.target.value)} /></div>
                <Button onClick={handleOpenNewWellnessProgramForm} className="bg-purple-500 hover:bg-purple-600 text-white"><Award className="mr-2 h-4 w-4" />Add Program</Button>
            </div>
        </CardHeader>
        <CardContent>{filteredWellnessPrograms.length === 0 ? <p className="text-muted-foreground text-center py-4">{wellnessProgramSearchTerm ? "No matching programs found." : "No wellness programs defined."}</p> : (<ScrollArea className="max-h-[300px] pr-3"><div className="space-y-3">{filteredWellnessPrograms.map(program => (<Card key={program.id} className="p-3 shadow-sm"><div className="flex justify-between items-start"><div><h4 className="font-semibold">{program.programName}</h4><p className="text-xs text-muted-foreground">Status: {program.status} | Start: {format(parseISO(program.startDate), "PPP")}</p></div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingWellnessProgram(program)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => handleEditWellnessProgram(program)}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteWellnessProgramMutation.isPending && deleteWellnessProgramMutation.variables === program.id}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Wellness Program?</AlertDialogTitle><AlertDialogDescription>Delete "{program.programName}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteWellnessProgram(program.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>))}</div></ScrollArea>)}</CardContent>
      </Card>
      {viewingWellnessProgram && <WellnessProgramDetailsDialog program={viewingWellnessProgram} onClose={() => setViewingWellnessProgram(null)} />}
    </div>
  );
}
