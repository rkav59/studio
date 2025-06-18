
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Trash2, Eye, Users, Thermometer, ShieldCheck, Award, BarChart, BellDot, UserPlus, FlaskConical, ClipboardPlus, Users2Icon, AlertTriangle, CalendarClock, ClockIcon, ShieldAlert, FilePlus, Loader2 } from "lucide-react";
import type { SimilarExposureGroup, IndustrialHygieneSample, MedicalTestRecord, WellnessProgram, MedicalTestWithCertStatus, MedicalTestPrefillData, IndustrialHygieneSampleAgent, MedicalTestRecordType } from "@/lib/types";
import { SegForm } from "@/components/health-monitoring/seg-form";
import { IhSampleForm } from "@/components/health-monitoring/ih-sample-form";
import { MedicalTestForm } from "@/components/health-monitoring/medical-test-form";
import { WellnessProgramForm } from "@/components/health-monitoring/wellness-program-form";
import { SegDetailsDialog } from '@/components/health-monitoring/seg-details-dialog';
import { IhSampleDetailsDialog } from '@/components/health-monitoring/ih-sample-details-dialog';
import { MedicalTestDetailsDialog } from '@/components/health-monitoring/medical-test-details-dialog';
import { WellnessProgramDetailsDialog } from '@/components/health-monitoring/wellness-program-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, differenceInDays, isBefore } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { agentToMedicalTestMap } from '@/lib/health-config';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SEGS_COLLECTION = 'similarExposureGroups';
const IH_SAMPLES_COLLECTION = 'industrialHygieneSamples';
const MEDICAL_TESTS_COLLECTION = 'medicalTestRecords';
const WELLNESS_PROGRAMS_COLLECTION = 'wellnessPrograms';
const CERT_EXPIRY_REMINDER_LEAD_DAYS = 30;

export default function HealthMonitoringPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isSegFormOpen, setIsSegFormOpen] = useState(false);
  const [editingSeg, setEditingSeg] = useState<SimilarExposureGroup | null>(null);
  const [viewingSeg, setViewingSeg] = useState<SimilarExposureGroup | null>(null);

  const [isIhSampleFormOpen, setIsIhSampleFormOpen] = useState(false);
  const [editingIhSample, setEditingIhSample] = useState<IndustrialHygieneSample | null>(null);
  const [viewingIhSample, setViewingIhSample] = useState<IndustrialHygieneSample | null>(null);

  const [isMedicalTestFormOpen, setIsMedicalTestFormOpen] = useState(false);
  const [editingMedicalTest, setEditingMedicalTest] = useState<MedicalTestRecord | null>(null);
  const [viewingMedicalTest, setViewingMedicalTest] = useState<MedicalTestRecord | null>(null); // Was MedicalTestWithCertStatus, simplified for Firestore direct type
  const [medicalTestPrefillData, setMedicalTestPrefillData] = useState<MedicalTestPrefillData | null>(null);

  const [isWellnessProgramFormOpen, setIsWellnessProgramFormOpen] = useState(false);
  const [editingWellnessProgram, setEditingWellnessProgram] = useState<WellnessProgram | null>(null);
  const [viewingWellnessProgram, setViewingWellnessProgram] = useState<WellnessProgram | null>(null);

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
          certificateExpiryDate: (data.certificateExpiryDate as Timestamp)?.toDate().toISOString() || null,
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
          endDate: (data.endDate as Timestamp)?.toDate().toISOString(),
        } as WellnessProgram;
      });
    },
    enabled: !!user?.uid,
  });

  // SEG Mutations
  const addSegMutation = useMutation({
    mutationFn: (newSegData: Omit<SimilarExposureGroup, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      return addDoc(collection(db, SEGS_COLLECTION), { ...newSegData, userId: user.uid });
    },
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [SEGS_COLLECTION, user?.uid]}); toast({title:"SEG Created"}); setIsSegFormOpen(false); setEditingSeg(null); },
    onError: (e:Error) => toast({title:"Error Creating SEG", description: e.message, variant:"destructive"}),
  });
  const updateSegMutation = useMutation({
    mutationFn: (segToUpdate: SimilarExposureGroup) => {
      if (!user?.uid || !segToUpdate.id) throw new Error("Missing user or SEG ID.");
      const { id, ...data } = segToUpdate;
      return updateDoc(doc(db, SEGS_COLLECTION, id), {...data, userId: user.uid});
    },
    onSuccess: (_,vars) => { queryClient.invalidateQueries({queryKey: [SEGS_COLLECTION, user?.uid]}); toast({title:"SEG Updated", description:`SEG "${vars.name}" updated.`}); setIsSegFormOpen(false); setEditingSeg(null); },
    onError: (e:Error) => toast({title:"Error Updating SEG", description: e.message, variant:"destructive"}),
  });
  const deleteSegMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      if (ihSamples.some(s => s.segId === id) || medicalTests.some(t => t.segId === id)) {
        throw new Error("SEG linked to IH samples or medical tests. Reassign or delete them first.");
      }
      await deleteDoc(doc(db, SEGS_COLLECTION, id));
    },
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [SEGS_COLLECTION, user?.uid]}); toast({title:"SEG Deleted"}); },
    onError: (e:Error) => toast({title:"Error Deleting SEG", description: e.message, variant:"destructive", duration: 7000}),
  });

  // IH Sample Mutations
  const addIhSampleMutation = useMutation({
    mutationFn: (newIhSampleData: Omit<IndustrialHygieneSample, 'id'|'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = { ...newIhSampleData, userId: user.uid, sampleDate: Timestamp.fromDate(parseISO(newIhSampleData.sampleDate as string)) };
      return addDoc(collection(db, IH_SAMPLES_COLLECTION), dataForDb);
    },
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [IH_SAMPLES_COLLECTION, user?.uid]}); toast({title:"IH Sample Logged"}); setIsIhSampleFormOpen(false); setEditingIhSample(null); },
    onError: (e:Error) => toast({title:"Error Logging IH Sample", description: e.message, variant:"destructive"}),
  });
  const updateIhSampleMutation = useMutation({
    mutationFn: (ihSampleToUpdate: IndustrialHygieneSample) => {
      if (!user?.uid || !ihSampleToUpdate.id) throw new Error("Missing user or sample ID.");
      const { id, ...data } = ihSampleToUpdate;
      const dataForDb = { ...data, userId: user.uid, sampleDate: Timestamp.fromDate(parseISO(data.sampleDate as string)) };
      return updateDoc(doc(db, IH_SAMPLES_COLLECTION, id), dataForDb);
    },
    onSuccess: (_,vars) => { queryClient.invalidateQueries({queryKey: [IH_SAMPLES_COLLECTION, user?.uid]}); toast({title:"IH Sample Updated", description:`Sample for "${vars.agent}" updated.`}); setIsIhSampleFormOpen(false); setEditingIhSample(null); },
    onError: (e:Error) => toast({title:"Error Updating IH Sample", description: e.message, variant:"destructive"}),
  });
  const deleteIhSampleMutation = useMutation({
    mutationFn: (id: string) => deleteDoc(doc(db, IH_SAMPLES_COLLECTION, id)),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [IH_SAMPLES_COLLECTION, user?.uid]}); toast({title:"IH Sample Deleted"}); },
    onError: (e:Error) => toast({title:"Error Deleting IH Sample", description: e.message, variant:"destructive"}),
  });

  // Medical Test Mutations
  const addMedicalTestMutation = useMutation({
    mutationFn: (newMedicalTestData: Omit<MedicalTestRecord, 'id'|'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = { ...newMedicalTestData, userId: user.uid, 
        testDate: Timestamp.fromDate(parseISO(newMedicalTestData.testDate as string)),
        certificateExpiryDate: newMedicalTestData.certificateExpiryDate ? Timestamp.fromDate(parseISO(newMedicalTestData.certificateExpiryDate as string)) : null,
      };
      return addDoc(collection(db, MEDICAL_TESTS_COLLECTION), dataForDb);
    },
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [MEDICAL_TESTS_COLLECTION, user?.uid]}); toast({title:"Medical Test Logged"}); setIsMedicalTestFormOpen(false); setEditingMedicalTest(null); setMedicalTestPrefillData(null);},
    onError: (e:Error) => toast({title:"Error Logging Medical Test", description: e.message, variant:"destructive"}),
  });
  const updateMedicalTestMutation = useMutation({
    mutationFn: (medicalTestToUpdate: MedicalTestRecord) => {
      if (!user?.uid || !medicalTestToUpdate.id) throw new Error("Missing user or test ID.");
      const { id, ...data } = medicalTestToUpdate;
      const dataForDb = { ...data, userId: user.uid, 
        testDate: Timestamp.fromDate(parseISO(data.testDate as string)),
        certificateExpiryDate: data.certificateExpiryDate ? Timestamp.fromDate(parseISO(data.certificateExpiryDate as string)) : null,
      };
      return updateDoc(doc(db, MEDICAL_TESTS_COLLECTION, id), dataForDb);
    },
    onSuccess: (_,vars) => { queryClient.invalidateQueries({queryKey: [MEDICAL_TESTS_COLLECTION, user?.uid]}); toast({title:"Medical Test Updated", description:`Test for "${vars.employeeName}" updated.`}); setIsMedicalTestFormOpen(false); setEditingMedicalTest(null); setMedicalTestPrefillData(null);},
    onError: (e:Error) => toast({title:"Error Updating Medical Test", description: e.message, variant:"destructive"}),
  });
  const deleteMedicalTestMutation = useMutation({
    mutationFn: (id: string) => deleteDoc(doc(db, MEDICAL_TESTS_COLLECTION, id)),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [MEDICAL_TESTS_COLLECTION, user?.uid]}); toast({title:"Medical Test Deleted"});},
    onError: (e:Error) => toast({title:"Error Deleting Medical Test", description: e.message, variant:"destructive"}),
  });

  // Wellness Program Mutations
  const addWellnessProgramMutation = useMutation({
    mutationFn: (newProgramData: Omit<WellnessProgram, 'id'|'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      const dataForDb = { ...newProgramData, userId: user.uid,
        startDate: Timestamp.fromDate(parseISO(newProgramData.startDate as string)),
        endDate: newProgramData.endDate ? Timestamp.fromDate(parseISO(newProgramData.endDate as string)) : null,
      };
      return addDoc(collection(db, WELLNESS_PROGRAMS_COLLECTION), dataForDb);
    },
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [WELLNESS_PROGRAMS_COLLECTION, user?.uid]}); toast({title:"Wellness Program Added"}); setIsWellnessProgramFormOpen(false); setEditingWellnessProgram(null);},
    onError: (e:Error) => toast({title:"Error Adding Wellness Program", description: e.message, variant:"destructive"}),
  });
  const updateWellnessProgramMutation = useMutation({
    mutationFn: (programToUpdate: WellnessProgram) => {
      if (!user?.uid || !programToUpdate.id) throw new Error("Missing user or program ID.");
      const { id, ...data } = programToUpdate;
      const dataForDb = { ...data, userId: user.uid,
        startDate: Timestamp.fromDate(parseISO(data.startDate as string)),
        endDate: data.endDate ? Timestamp.fromDate(parseISO(data.endDate as string)) : null,
      };
      return updateDoc(doc(db, WELLNESS_PROGRAMS_COLLECTION, id), dataForDb);
    },
    onSuccess: (_,vars) => { queryClient.invalidateQueries({queryKey: [WELLNESS_PROGRAMS_COLLECTION, user?.uid]}); toast({title:"Wellness Program Updated", description:`Program "${vars.programName}" updated.`}); setIsWellnessProgramFormOpen(false); setEditingWellnessProgram(null);},
    onError: (e:Error) => toast({title:"Error Updating Wellness Program", description: e.message, variant:"destructive"}),
  });
  const deleteWellnessProgramMutation = useMutation({
    mutationFn: (id: string) => deleteDoc(doc(db, WELLNESS_PROGRAMS_COLLECTION, id)),
    onSuccess: () => { queryClient.invalidateQueries({queryKey: [WELLNESS_PROGRAMS_COLLECTION, user?.uid]}); toast({title:"Wellness Program Deleted"});},
    onError: (e:Error) => toast({title:"Error Deleting Wellness Program", description: e.message, variant:"destructive"}),
  });

  // Handlers
  const handleSaveSeg = (data: Omit<SimilarExposureGroup, 'id'|'userId'>) => editingSeg ? updateSegMutation.mutate({ ...editingSeg, ...data }) : addSegMutation.mutate(data);
  const handleDeleteSeg = (id: string) => deleteSegMutation.mutate(id);
  const handleSaveIhSample = (data: Omit<IndustrialHygieneSample, 'id'|'userId'>) => editingIhSample ? updateIhSampleMutation.mutate({ ...editingIhSample, ...data }) : addIhSampleMutation.mutate(data);
  const handleDeleteIhSample = (id: string) => deleteIhSampleMutation.mutate(id);
  const handleSaveMedicalTest = (data: Omit<MedicalTestRecord, 'id'|'userId'>) => editingMedicalTest ? updateMedicalTestMutation.mutate({ ...editingMedicalTest, ...data }) : addMedicalTestMutation.mutate(data);
  const handleDeleteMedicalTest = (id: string) => deleteMedicalTestMutation.mutate(id);
  const handleSaveWellnessProgram = (data: Omit<WellnessProgram, 'id'|'userId'>) => editingWellnessProgram ? updateWellnessProgramMutation.mutate({ ...editingWellnessProgram, ...data }) : addWellnessProgramMutation.mutate(data);
  const handleDeleteWellnessProgram = (id: string) => deleteWellnessProgramMutation.mutate(id);
  
  const handleOpenMedicalTestFormWithPrefill = (sample: IndustrialHygieneSample) => {
    const suggestedTestType = agentToMedicalTestMap[sample.agent] || undefined;
    const prefill: MedicalTestPrefillData = {
      employeeName: sample.employeeName, segId: sample.segId,
      linkedExposure: `From IH Sample ${sample.id}: ${sample.agent}${sample.specificAgentName ? ` (${sample.specificAgentName})` : ''} at ${sample.exposureLevel} ${sample.units} on ${format(parseISO(sample.sampleDate), "PPP")}. OEL: ${sample.oel ?? 'N/A'} ${sample.oelUnits || sample.units}.`,
      testType: suggestedTestType,
    };
    setMedicalTestPrefillData(prefill); setEditingMedicalTest(null); setViewingIhSample(null); setIsMedicalTestFormOpen(true);
  };
  
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
        return a.certificateExpiryDate ? -1 : b.certificateExpiryDate ? 1 : parseISO(b.testDate).getTime() - parseISO(a.testDate).getTime();
    });
  }, [medicalTests]);

  const upcomingOrOverdueCerts = useMemo(() => medicalTestsWithCertStatus.filter(test => test.certificateStatus === 'Expired' || test.certificateStatus === 'Expiring Soon'), [medicalTestsWithCertStatus]);

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
  if (anyError) return <div className="text-red-500 text-center py-10">Error loading data: {anyError.message}</div>;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image src="https://placehold.co/1200x400.png" alt="Health data charts" layout="fill" objectFit="cover" data-ai-hint="health dashboard"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><div className="absolute bottom-0 left-0 p-6"><h1 className="text-3xl font-bold tracking-tight font-headline text-white">Proactive Health Management</h1><p className="text-sm text-neutral-300">Monitor occupational health, exposure data, medical screenings, and wellness. Data in Firestore.</p></div>
        </div>
        <CardContent className="pt-6"><p className="text-muted-foreground">This module facilitates health monitoring including SEGs, IH sampling, medical tests, and wellness programs. Data is stored in Firebase Firestore.</p></CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-6 w-6 text-orange-500"/>Upcoming/Overdue Certificate Expiries</CardTitle><CardDescription>Medical test certificates requiring attention.</CardDescription></CardHeader>
        <CardContent>{upcomingOrOverdueCerts.length === 0 ? <p className="text-muted-foreground text-center py-4">No certificates currently due or overdue.</p> : (
            <ScrollArea className="max-h-[300px] pr-3"><div className="space-y-3">{upcomingOrOverdueCerts.map(test => { const { textClass } = getCertStatusStyling(test.certificateStatus); return (
              <Card key={`due-cert-${test.id}`} className={`p-3 shadow-sm border-l-4 ${test.certificateStatus === 'Expired' ? 'border-red-500' : 'border-yellow-500'}`}><div className="flex flex-col sm:flex-row justify-between items-start"><div className="mb-1 sm:mb-0"><h4 className="font-semibold text-md">{test.employeeName} - {test.testType}</h4><p className={`text-xs font-semibold ${textClass}`}>Status: {test.certificateStatus}{test.certificateExpiryDate && ` (Expires: ${format(parseISO(test.certificateExpiryDate), "PPP")})`}</p><p className="text-xs text-muted-foreground">Test Date: {format(parseISO(test.testDate), "PPP")}</p></div><Button variant="outline" size="sm" onClick={() => setViewingMedicalTest(test)}>View Record</Button></div></Card>
            )})}</div></ScrollArea>
        )}</CardContent>
      </Card>
      <Separator/>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Similar Exposure Groups (SEGs)</CardTitle><CardDescription>Define and manage groups of employees with similar exposure profiles.</CardDescription></div><Button onClick={() => { setEditingSeg(null); setIsSegFormOpen(true); }} className="bg-primary hover:bg-primary/90" disabled={addSegMutation.isPending || updateSegMutation.isPending}><UserPlus className="mr-2 h-4 w-4" />Add SEG</Button></CardHeader>
        <CardContent>{segs.length === 0 ? <p className="text-muted-foreground text-center py-4">No SEGs defined.</p> : (<ScrollArea className="max-h-[300px] pr-3"><div className="space-y-3">{segs.map(seg => (<Card key={seg.id} className="p-3 shadow-sm"><div className="flex justify-between items-start"><div><h4 className="font-semibold">{seg.name}</h4><p className="text-xs text-muted-foreground truncate max-w-md">{seg.description || "No description"}</p></div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingSeg(seg)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => { setEditingSeg(seg); setIsSegFormOpen(true);}} disabled={updateSegMutation.isPending}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteSegMutation.isPending}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete SEG?</AlertDialogTitle><AlertDialogDescription>Delete "{seg.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSeg(seg.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>))}</div></ScrollArea>)}</CardContent>
      </Card>
      {isSegFormOpen && <Dialog open={isSegFormOpen} onOpenChange={setIsSegFormOpen}><SegForm initialData={editingSeg} onSave={handleSaveSeg} onCancel={() => setIsSegFormOpen(false)} /></Dialog>}
      {viewingSeg && <SegDetailsDialog seg={viewingSeg} onClose={() => setViewingSeg(null)} />}
      <Separator/>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><FlaskConical className="h-6 w-6 text-accent"/>Industrial Hygiene Sampling</CardTitle><CardDescription>Log and track exposure monitoring data.</CardDescription></div><Button onClick={() => { setEditingIhSample(null); setIsIhSampleFormOpen(true); }} className="bg-accent hover:bg-accent/90" disabled={addIhSampleMutation.isPending || updateIhSampleMutation.isPending}><FilePlus className="mr-2 h-4 w-4" />Log IH Sample</Button></CardHeader>
        <CardContent>{ihSamples.length === 0 ? <p className="text-muted-foreground text-center py-4">No IH samples logged.</p> : (<ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">{ihSamples.map(sample => (<Card key={sample.id} className={`p-3 shadow-sm ${sample.oel !== undefined && sample.exposureLevel > sample.oel ? 'border-l-4 border-red-500' : ''}`}><div className="flex justify-between items-start"><div><h4 className="font-semibold">{sample.agent}{sample.specificAgentName ? ` (${sample.specificAgentName})` : ''} - {format(parseISO(sample.sampleDate), "PPP")}</h4><p className="text-xs text-muted-foreground">Level: {sample.exposureLevel} {sample.units} {sample.oel !== undefined && `(OEL: ${sample.oel} ${sample.oelUnits || sample.units})`} | SEG: {getSegName(sample.segId)}</p>{sample.oel !== undefined && sample.exposureLevel > sample.oel && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>EXPOSURE EXCEEDS OEL!</p>}</div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingIhSample(sample)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => { setEditingIhSample(sample); setIsIhSampleFormOpen(true);}} disabled={updateIhSampleMutation.isPending}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteIhSampleMutation.isPending}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete IH Sample?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteIhSample(sample.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>))}</div></ScrollArea>)}</CardContent>
      </Card>
      {isIhSampleFormOpen && <Dialog open={isIhSampleFormOpen} onOpenChange={setIsIhSampleFormOpen}><IhSampleForm segs={segs} initialData={editingIhSample} onSave={handleSaveIhSample} onCancel={() => setIsIhSampleFormOpen(false)} /></Dialog>}
      {viewingIhSample && <IhSampleDetailsDialog sample={viewingIhSample} segName={getSegName(viewingIhSample.segId)} onClose={() => setViewingIhSample(null)} onLogMedicalTest={handleOpenMedicalTestFormWithPrefill}/>}
      <Separator/>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><ClipboardPlus className="h-6 w-6 text-teal-500"/>Medical Test & Screening Records</CardTitle><CardDescription>Track employee medical tests and certificate expiries.</CardDescription></div><Button onClick={() => { setEditingMedicalTest(null); setMedicalTestPrefillData(null); setIsMedicalTestFormOpen(true); }} className="bg-teal-500 hover:bg-teal-600 text-white" disabled={addMedicalTestMutation.isPending || updateMedicalTestMutation.isPending}><FilePlus className="mr-2 h-4 w-4" />Log Medical Record</Button></CardHeader>
        <CardContent>{medicalTestsWithCertStatus.length === 0 ? <p className="text-muted-foreground text-center py-4">No medical records logged.</p> : (<ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">{medicalTestsWithCertStatus.map(test => { const { textClass, bgClass } = getCertStatusStyling(test.certificateStatus); return (<Card key={test.id} className={`p-3 shadow-sm ${test.certificateStatus === 'Expired' ? 'border-l-4 border-red-500' : test.certificateStatus === 'Expiring Soon' ? 'border-l-4 border-yellow-500' : '' }`}><div className="flex justify-between items-start"><div><h4 className="font-semibold">{test.employeeName} - {test.testType}{test.specificTestName ? ` (${test.specificTestName})` : ''}</h4><p className="text-xs text-muted-foreground">Date: {format(parseISO(test.testDate), "PPP")} | Fit: {test.isFitForWork === undefined ? 'N/A' : test.isFitForWork ? 'Yes' : 'No'}</p>{test.certificateExpiryDate && (<p className={`text-xs flex items-center gap-1 ${textClass}`}><ClockIcon className="h-3 w-3"/>Cert. Expiry: {format(parseISO(test.certificateExpiryDate), "PPP")} {test.certificateStatus && test.certificateStatus !== 'N/A' && <span className={`px-1.5 py-0.5 rounded-full text-xs ${bgClass}`}>{test.certificateStatus}</span>}</p>)}{test.followUpRequired && <p className="text-xs text-yellow-600 font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>Follow-up Required</p>}</div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingMedicalTest(test)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => { setEditingMedicalTest(test); setMedicalTestPrefillData(null); setIsMedicalTestFormOpen(true);}} disabled={updateMedicalTestMutation.isPending}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteMedicalTestMutation.isPending}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Medical Test Record?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMedicalTest(test.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>)})}</div></ScrollArea>)}</CardContent>
      </Card>
      {isMedicalTestFormOpen && <Dialog open={isMedicalTestFormOpen} onOpenChange={(isOpen) => {if (!isOpen) { setIsMedicalTestFormOpen(false); setEditingMedicalTest(null); setMedicalTestPrefillData(null);}}}><MedicalTestForm segs={segs} initialData={editingMedicalTest || medicalTestPrefillData} isEditing={!!editingMedicalTest} onSave={handleSaveMedicalTest} onCancel={() => { setIsMedicalTestFormOpen(false); setEditingMedicalTest(null); setMedicalTestPrefillData(null);}} /></Dialog>}
      {viewingMedicalTest && <MedicalTestDetailsDialog record={viewingMedicalTest} segName={getSegName(viewingMedicalTest.segId)} onClose={() => setViewingMedicalTest(null)} />}
      <Separator/>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><Users2Icon className="h-6 w-6 text-purple-500"/>Employee Wellness Programs</CardTitle><CardDescription>Manage and track wellness initiatives.</CardDescription></div><Button onClick={() => { setEditingWellnessProgram(null); setIsWellnessProgramFormOpen(true); }} className="bg-purple-500 hover:bg-purple-600 text-white" disabled={addWellnessProgramMutation.isPending || updateWellnessProgramMutation.isPending}><Award className="mr-2 h-4 w-4" />Add Program</Button></CardHeader>
        <CardContent>{wellnessPrograms.length === 0 ? <p className="text-muted-foreground text-center py-4">No wellness programs defined.</p> : (<ScrollArea className="max-h-[300px] pr-3"><div className="space-y-3">{wellnessPrograms.map(program => (<Card key={program.id} className="p-3 shadow-sm"><div className="flex justify-between items-start"><div><h4 className="font-semibold">{program.programName}</h4><p className="text-xs text-muted-foreground">Status: {program.status} | Start: {format(parseISO(program.startDate), "PPP")}</p></div><div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" onClick={() => setViewingWellnessProgram(program)}><Eye className="h-3 w-3"/></Button><Button variant="secondary" size="sm" onClick={() => { setEditingWellnessProgram(program); setIsWellnessProgramFormOpen(true);}} disabled={updateWellnessProgramMutation.isPending}><Edit2 className="h-3 w-3"/></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={deleteWellnessProgramMutation.isPending}><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Wellness Program?</AlertDialogTitle><AlertDialogDescription>Delete "{program.programName}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteWellnessProgram(program.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></Card>))}</div></ScrollArea>)}</CardContent>
      </Card>
      {isWellnessProgramFormOpen && <Dialog open={isWellnessProgramFormOpen} onOpenChange={setIsWellnessProgramFormOpen}><WellnessProgramForm initialData={editingWellnessProgram} onSave={handleSaveWellnessProgram} onCancel={() => setIsWellnessProgramFormOpen(false)} /></Dialog>}
      {viewingWellnessProgram && <WellnessProgramDetailsDialog program={viewingWellnessProgram} onClose={() => setViewingWellnessProgram(null)} />}
    </div>
  );
}

    