
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Trash2, Eye, Users, Thermometer, ShieldCheck, Award, BarChart, BellDot, UserPlus, FlaskConical, ClipboardPlus, Users2Icon } from "lucide-react"; // Added specific icons
import type { SimilarExposureGroup, IndustrialHygieneSample, MedicalTestRecord, WellnessProgram } from "@/lib/types";
import { SegForm } from "@/components/health-monitoring/seg-form";
import { IhSampleForm } from "@/components/health-monitoring/ih-sample-form";
import { MedicalTestForm } from "@/components/health-monitoring/medical-test-form";
import { WellnessProgramForm } from "@/components/health-monitoring/wellness-program-form";
import { SegDetailsDialog } from '@/components/health-monitoring/seg-details-dialog';
import { IhSampleDetailsDialog } from '@/components/health-monitoring/ih-sample-details-dialog';
import { MedicalTestDetailsDialog } from '@/components/health-monitoring/medical-test-details-dialog';
import { WellnessProgramDetailsDialog } from '@/components/health-monitoring/wellness-program-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SEGS_STORAGE_KEY = 'sheild-health-segs-v1';
const IH_SAMPLES_STORAGE_KEY = 'sheild-health-ih-samples-v1';
const MEDICAL_TESTS_STORAGE_KEY = 'sheild-health-medical-tests-v1';
const WELLNESS_PROGRAMS_STORAGE_KEY = 'sheild-health-wellness-programs-v1';

export default function HealthMonitoringPage() {
  const { toast } = useToast();

  const [segs, setSegs] = useState<SimilarExposureGroup[]>([]);
  const [ihSamples, setIhSamples] = useState<IndustrialHygieneSample[]>([]);
  const [medicalTests, setMedicalTests] = useState<MedicalTestRecord[]>([]);
  const [wellnessPrograms, setWellnessPrograms] = useState<WellnessProgram[]>([]);

  const [isSegFormOpen, setIsSegFormOpen] = useState(false);
  const [editingSeg, setEditingSeg] = useState<SimilarExposureGroup | null>(null);
  const [viewingSeg, setViewingSeg] = useState<SimilarExposureGroup | null>(null);

  const [isIhSampleFormOpen, setIsIhSampleFormOpen] = useState(false);
  const [editingIhSample, setEditingIhSample] = useState<IndustrialHygieneSample | null>(null);
  const [viewingIhSample, setViewingIhSample] = useState<IndustrialHygieneSample | null>(null);

  const [isMedicalTestFormOpen, setIsMedicalTestFormOpen] = useState(false);
  const [editingMedicalTest, setEditingMedicalTest] = useState<MedicalTestRecord | null>(null);
  const [viewingMedicalTest, setViewingMedicalTest] = useState<MedicalTestRecord | null>(null);

  const [isWellnessProgramFormOpen, setIsWellnessProgramFormOpen] = useState(false);
  const [editingWellnessProgram, setEditingWellnessProgram] = useState<WellnessProgram | null>(null);
  const [viewingWellnessProgram, setViewingWellnessProgram] = useState<WellnessProgram | null>(null);

  // Load data
  useEffect(() => {
    const loadData = () => {
      try {
        const storedSegs = localStorage.getItem(SEGS_STORAGE_KEY);
        if (storedSegs) setSegs(JSON.parse(storedSegs));

        const storedIhSamples = localStorage.getItem(IH_SAMPLES_STORAGE_KEY);
        if (storedIhSamples) setIhSamples(JSON.parse(storedIhSamples));

        const storedMedicalTests = localStorage.getItem(MEDICAL_TESTS_STORAGE_KEY);
        if (storedMedicalTests) setMedicalTests(JSON.parse(storedMedicalTests));

        const storedWellnessPrograms = localStorage.getItem(WELLNESS_PROGRAMS_STORAGE_KEY);
        if (storedWellnessPrograms) setWellnessPrograms(JSON.parse(storedWellnessPrograms));
      } catch (error) {
        console.error("Error loading health monitoring data:", error);
        toast({ title: "Error", description: "Could not load health monitoring data.", variant: "destructive" });
      }
    };
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [toast]);

  // Save data
  useEffect(() => { try { localStorage.setItem(SEGS_STORAGE_KEY, JSON.stringify(segs)); } catch (e) { console.error("Error saving SEGs"); } }, [segs]);
  useEffect(() => { try { localStorage.setItem(IH_SAMPLES_STORAGE_KEY, JSON.stringify(ihSamples)); } catch (e) { console.error("Error saving IH Samples"); } }, [ihSamples]);
  useEffect(() => { try { localStorage.setItem(MEDICAL_TESTS_STORAGE_KEY, JSON.stringify(medicalTests)); } catch (e) { console.error("Error saving Medical Tests"); } }, [medicalTests]);
  useEffect(() => { try { localStorage.setItem(WELLNESS_PROGRAMS_STORAGE_KEY, JSON.stringify(wellnessPrograms)); } catch (e) { console.error("Error saving Wellness Programs"); } }, [wellnessPrograms]);

  // SEG Handlers
  const handleSaveSeg = (data: Omit<SimilarExposureGroup, 'id'>) => {
    const action = editingSeg ? "Updated" : "Created";
    setSegs(prev => editingSeg ? prev.map(s => s.id === editingSeg.id ? { ...editingSeg, ...data } : s) : [{ id: crypto.randomUUID(), ...data }, ...prev]);
    toast({ title: `SEG ${action}`, description: `Similar Exposure Group "${data.name}" ${action.toLowerCase()}.` });
    setIsSegFormOpen(false); setEditingSeg(null);
  };
  const handleDeleteSeg = (id: string) => {
    if (ihSamples.some(s => s.segId === id) || medicalTests.some(t => t.segId === id)) {
      toast({ title: "Cannot Delete SEG", description: "This SEG is linked to IH samples or medical tests. Please reassign or delete them first.", variant: "destructive", duration: 7000 });
      return;
    }
    setSegs(prev => prev.filter(s => s.id !== id));
    toast({ title: "SEG Deleted" });
  };

  // IH Sample Handlers
  const handleSaveIhSample = (data: Omit<IndustrialHygieneSample, 'id'>) => {
    const action = editingIhSample ? "Updated" : "Created";
    setIhSamples(prev => editingIhSample ? prev.map(s => s.id === editingIhSample.id ? { ...editingIhSample, ...data } : s) : [{ id: crypto.randomUUID(), ...data }, ...prev]);
    toast({ title: `IH Sample ${action}`, description: `Sample for "${data.agent}" ${action.toLowerCase()}.` });
    setIsIhSampleFormOpen(false); setEditingIhSample(null);
  };
  const handleDeleteIhSample = (id: string) => { setIhSamples(prev => prev.filter(s => s.id !== id)); toast({ title: "IH Sample Deleted" }); };

  // Medical Test Handlers
  const handleSaveMedicalTest = (data: Omit<MedicalTestRecord, 'id'>) => {
    const action = editingMedicalTest ? "Updated" : "Created";
    setMedicalTests(prev => editingMedicalTest ? prev.map(t => t.id === editingMedicalTest.id ? { ...editingMedicalTest, ...data } : t) : [{ id: crypto.randomUUID(), ...data }, ...prev]);
    toast({ title: `Medical Test ${action}`, description: `Test for "${data.employeeName}" (${data.testType}) ${action.toLowerCase()}.` });
    setIsMedicalTestFormOpen(false); setEditingMedicalTest(null);
  };
  const handleDeleteMedicalTest = (id: string) => { setMedicalTests(prev => prev.filter(t => t.id !== id)); toast({ title: "Medical Test Deleted" }); };

  // Wellness Program Handlers
  const handleSaveWellnessProgram = (data: Omit<WellnessProgram, 'id'>) => {
    const action = editingWellnessProgram ? "Updated" : "Created";
    setWellnessPrograms(prev => editingWellnessProgram ? prev.map(p => p.id === editingWellnessProgram.id ? { ...editingWellnessProgram, ...data } : p) : [{ id: crypto.randomUUID(), ...data }, ...prev]);
    toast({ title: `Wellness Program ${action}`, description: `Program "${data.programName}" ${action.toLowerCase()}.` });
    setIsWellnessProgramFormOpen(false); setEditingWellnessProgram(null);
  };
  const handleDeleteWellnessProgram = (id: string) => { setWellnessPrograms(prev => prev.filter(p => p.id !== id)); toast({ title: "Wellness Program Deleted" }); };
  
  const getSegName = (segId?: string) => segs.find(s => s.id === segId)?.name || "N/A";


  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Health data charts and graphs" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="health dashboard"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Proactive Health Management</h1>
                <p className="text-sm text-neutral-300">Monitor occupational health, exposure data, and wellness initiatives.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module facilitates the management of Similar Exposure Groups (SEGs), industrial hygiene sampling data (including OEL tracking), medical surveillance records (with reference ranges), and employee wellness programs (with participation metrics). 
                All data is stored locally in your browser.
            </p>
        </CardContent>
      </Card>

      {/* Similar Exposure Groups (SEGs) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Similar Exposure Groups (SEGs)</CardTitle>
            <CardDescription>Define and manage groups of employees with similar exposure profiles.</CardDescription>
          </div>
          <Button onClick={() => { setEditingSeg(null); setIsSegFormOpen(true); }} className="bg-primary hover:bg-primary/90">
            <UserPlus className="mr-2 h-4 w-4" /> Add New SEG
          </Button>
        </CardHeader>
        <CardContent>
          {segs.length === 0 ? <p className="text-muted-foreground text-center py-4">No SEGs defined. Click 'Add New SEG' to start grouping employees by exposure.</p> : (
            <ScrollArea className="max-h-[300px] pr-3"><div className="space-y-3">
              {segs.map(seg => (
                <Card key={seg.id} className="p-3 shadow-sm"><div className="flex justify-between items-start">
                  <div><h4 className="font-semibold">{seg.name}</h4><p className="text-xs text-muted-foreground truncate max-w-md">{seg.description || "No description"}</p></div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setViewingSeg(seg)}><Eye className="h-3 w-3"/></Button>
                    <Button variant="secondary" size="sm" onClick={() => { setEditingSeg(seg); setIsSegFormOpen(true);}}><Edit2 className="h-3 w-3"/></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete SEG "{seg.name}"?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. Ensure this SEG is not linked to other records.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSeg(seg.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div></div></Card>
              ))}
            </div></ScrollArea>
          )}
        </CardContent>
      </Card>
      {isSegFormOpen && <Dialog open={isSegFormOpen} onOpenChange={setIsSegFormOpen}><SegForm initialData={editingSeg} onSave={handleSaveSeg} onCancel={() => setIsSegFormOpen(false)} /></Dialog>}
      {viewingSeg && <SegDetailsDialog seg={viewingSeg} onClose={() => setViewingSeg(null)} />}

      <Separator/>

      {/* Industrial Hygiene (IH) Sampling Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="h-6 w-6 text-accent"/>Industrial Hygiene Sampling</CardTitle>
            <CardDescription>Log and track exposure monitoring data (noise, dust, chemicals, etc.), including OELs.</CardDescription>
          </div>
          <Button onClick={() => { setEditingIhSample(null); setIsIhSampleFormOpen(true); }} className="bg-accent hover:bg-accent/90">
            <Thermometer className="mr-2 h-4 w-4" /> Log New IH Sample
          </Button>
        </CardHeader>
        <CardContent>
          {ihSamples.length === 0 ? <p className="text-muted-foreground text-center py-4">No IH samples logged. Click 'Log New IH Sample' to record exposure data.</p> : (
            <ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">
              {ihSamples.map(sample => (
                <Card key={sample.id} className="p-3 shadow-sm"><div className="flex justify-between items-start">
                  <div><h4 className="font-semibold">{sample.agent}{sample.specificAgentName ? ` (${sample.specificAgentName})` : ''} - {format(parseISO(sample.sampleDate), "PPP")}</h4>
                  <p className="text-xs text-muted-foreground">Level: {sample.exposureLevel} {sample.units} {sample.oel && `(OEL: ${sample.oel} ${sample.oelUnits || sample.units})`} | Location: {sample.location} | SEG: {getSegName(sample.segId)}</p>
                   {sample.oel !== undefined && sample.exposureLevel > sample.oel && <p className="text-xs font-bold text-red-500">EXPOSURE EXCEEDS OEL!</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setViewingIhSample(sample)}><Eye className="h-3 w-3"/></Button>
                    <Button variant="secondary" size="sm" onClick={() => { setEditingIhSample(sample); setIsIhSampleFormOpen(true);}}><Edit2 className="h-3 w-3"/></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete IH Sample?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteIhSample(sample.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                </div></div></Card>
              ))}
            </div></ScrollArea>
          )}
        </CardContent>
      </Card>
      {isIhSampleFormOpen && <Dialog open={isIhSampleFormOpen} onOpenChange={setIsIhSampleFormOpen}><IhSampleForm segs={segs} initialData={editingIhSample} onSave={handleSaveIhSample} onCancel={() => setIsIhSampleFormOpen(false)} /></Dialog>}
      {viewingIhSample && <IhSampleDetailsDialog sample={viewingIhSample} segName={getSegName(viewingIhSample.segId)} onClose={() => setViewingIhSample(null)} />}
      
      <Separator/>

      {/* Medical Test Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ClipboardPlus className="h-6 w-6 text-teal-500"/>Medical Surveillance Records</CardTitle>
            <CardDescription>Track employee medical tests, fitness-to-work status, and reference ranges.</CardDescription>
          </div>
          <Button onClick={() => { setEditingMedicalTest(null); setIsMedicalTestFormOpen(true); }} className="bg-teal-500 hover:bg-teal-600 text-white">
            <ShieldCheck className="mr-2 h-4 w-4" /> Log New Medical Test
          </Button>
        </CardHeader>
        <CardContent>
          {medicalTests.length === 0 ? <p className="text-muted-foreground text-center py-4">No medical tests recorded. Click 'Log New Medical Test' to add records.</p> : (
            <ScrollArea className="max-h-[400px] pr-3"><div className="space-y-3">
              {medicalTests.map(test => (
                <Card key={test.id} className="p-3 shadow-sm"><div className="flex justify-between items-start">
                  <div><h4 className="font-semibold">{test.employeeName} - {test.testType}{test.specificTestName ? ` (${test.specificTestName})` : ''}</h4>
                  <p className="text-xs text-muted-foreground">Date: {format(parseISO(test.testDate), "PPP")} | Fit to Work: {test.isFitForWork === undefined ? 'N/A' : test.isFitForWork ? 'Yes' : 'No'}</p></div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setViewingMedicalTest(test)}><Eye className="h-3 w-3"/></Button>
                    <Button variant="secondary" size="sm" onClick={() => { setEditingMedicalTest(test); setIsMedicalTestFormOpen(true);}}><Edit2 className="h-3 w-3"/></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Medical Test Record?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMedicalTest(test.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                </div></div></Card>
              ))}
            </div></ScrollArea>
          )}
        </CardContent>
      </Card>
      {isMedicalTestFormOpen && <Dialog open={isMedicalTestFormOpen} onOpenChange={setIsMedicalTestFormOpen}><MedicalTestForm segs={segs} initialData={editingMedicalTest} onSave={handleSaveMedicalTest} onCancel={() => setIsMedicalTestFormOpen(false)} /></Dialog>}
      {viewingMedicalTest && <MedicalTestDetailsDialog record={viewingMedicalTest} segName={getSegName(viewingMedicalTest.segId)} onClose={() => setViewingMedicalTest(null)} />}
      
      <Separator/>

      {/* Wellness Programs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users2Icon className="h-6 w-6 text-purple-500"/>Employee Wellness Programs</CardTitle>
            <CardDescription>Manage and track participation in wellness initiatives and their engagement.</CardDescription>
          </div>
          <Button onClick={() => { setEditingWellnessProgram(null); setIsWellnessProgramFormOpen(true); }} className="bg-purple-500 hover:bg-purple-600 text-white">
            <Award className="mr-2 h-4 w-4" /> Add Wellness Program
          </Button>
        </CardHeader>
        <CardContent>
          {wellnessPrograms.length === 0 ? <p className="text-muted-foreground text-center py-4">No wellness programs defined. Click 'Add Wellness Program' to create one.</p> : (
            <ScrollArea className="max-h-[300px] pr-3"><div className="space-y-3">
              {wellnessPrograms.map(program => (
                <Card key={program.id} className="p-3 shadow-sm"><div className="flex justify-between items-start">
                  <div><h4 className="font-semibold">{program.programName}</h4><p className="text-xs text-muted-foreground">Status: {program.status} | Start: {format(parseISO(program.startDate), "PPP")}</p></div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setViewingWellnessProgram(program)}><Eye className="h-3 w-3"/></Button>
                    <Button variant="secondary" size="sm" onClick={() => { setEditingWellnessProgram(program); setIsWellnessProgramFormOpen(true);}}><Edit2 className="h-3 w-3"/></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-3 w-3"/></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Wellness Program "{program.programName}"?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteWellnessProgram(program.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                </div></div></Card>
              ))}
            </div></ScrollArea>
          )}
        </CardContent>
      </Card>
      {isWellnessProgramFormOpen && <Dialog open={isWellnessProgramFormOpen} onOpenChange={setIsWellnessProgramFormOpen}><WellnessProgramForm initialData={editingWellnessProgram} onSave={handleSaveWellnessProgram} onCancel={() => setIsWellnessProgramFormOpen(false)} /></Dialog>}
      {viewingWellnessProgram && <WellnessProgramDetailsDialog program={viewingWellnessProgram} onClose={() => setViewingWellnessProgram(null)} />}

      <Separator/>
      {/* Placeholders for future features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-6 w-6 text-gray-500"/>Health Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Future: Visualize trends in exposure data, medical test results across SEGs, and identify potential health risks.
            </p>
            <div className="mt-4 h-40 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground" data-ai-hint="health data graph">
              (Trend Chart Placeholder)
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BellDot className="h-6 w-6 text-gray-500"/>Automated Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Future: Set up alerts for exceeding exposure limits, abnormal health results, or upcoming medical surveillance. (Requires backend integration)
            </p>
            <div className="mt-4 h-40 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground" data-ai-hint="alert notification bell">
              (Alerts System Placeholder)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
