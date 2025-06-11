
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, BookOpen, UserCheck, CalendarClock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { TrainingCourse, TrainingRecord, TrainingRecordStatus } from "@/lib/types";
import { CourseForm } from "@/components/training-competence/course-form";
import { TrainingRecordForm } from "@/components/training-competence/training-record-form";
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const COURSES_STORAGE_KEY = 'sheild-training-courses-v1';
const RECORDS_STORAGE_KEY = 'sheild-training-records-v1';
const RENEWAL_WARNING_DAYS = 30;


export default function TrainingCompetencePage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);

  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null);

  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);

  // Load data from localStorage
  useEffect(() => {
    try {
      const storedCourses = localStorage.getItem(COURSES_STORAGE_KEY);
      if (storedCourses) setCourses(JSON.parse(storedCourses));

      const storedRecords = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (storedRecords) setTrainingRecords(JSON.parse(storedRecords));
    } catch (error) {
      console.error("Error loading training data from localStorage:", error);
      toast({ title: "Error", description: "Could not load training data.", variant: "destructive" });
    }
  }, [toast]);

  // Save courses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    } catch (error) {
      console.error("Error saving courses to localStorage:", error);
    }
  }, [courses]);

  // Save training records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(trainingRecords));
    } catch (error) {
      console.error("Error saving training records to localStorage:", error);
    }
  }, [trainingRecords]);

  // Course Management
  const handleOpenNewCourseForm = () => {
    setEditingCourse(null);
    setIsCourseFormOpen(true);
  };

  const handleEditCourse = (course: TrainingCourse) => {
    setEditingCourse(course);
    setIsCourseFormOpen(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (trainingRecords.some(record => record.courseId === courseId)) {
      toast({
        title: "Cannot Delete Course",
        description: "This course is linked to existing training records. Please remove those records first.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    setCourses(prev => prev.filter(c => c.id !== courseId));
    toast({ title: "Course Deleted", description: "The training course has been deleted." });
  };

  const handleSaveCourse = (data: Omit<TrainingCourse, 'id'>) => {
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...editingCourse, ...data } : c));
      toast({ title: "Course Updated", description: `Course "${data.name}" has been updated.` });
    } else {
      const newCourse: TrainingCourse = { id: crypto.randomUUID(), ...data };
      setCourses(prev => [newCourse, ...prev]);
      toast({ title: "Course Created", description: `New course "${data.name}" has been created.` });
    }
    setIsCourseFormOpen(false);
    setEditingCourse(null);
  };

  // Training Record Management
  const handleOpenNewRecordForm = () => {
    setEditingRecord(null);
    setIsRecordFormOpen(true);
  };

  const handleEditRecord = (record: TrainingRecord) => {
    setEditingRecord(record);
    setIsRecordFormOpen(true);
  };

  const handleDeleteRecord = (recordId: string) => {
    setTrainingRecords(prev => prev.filter(r => r.id !== recordId));
    toast({ title: "Training Record Deleted", description: "The training record has been deleted." });
  };

  const handleSaveRecord = (data: Omit<TrainingRecord, 'id' | 'status'>, currentStatus: TrainingRecordStatus) => {
     // Retain the user-set status ('Planned' or 'Completed')
     // 'Expired' and 'Requires Renewal' are derived for display only
    const baseStatus = currentStatus === 'Expired' || currentStatus === 'Requires Renewal' 
        ? 'Completed' // If it was derived as expired, its base must have been Completed
        : currentStatus;


    if (editingRecord) {
      setTrainingRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...editingRecord, ...data, status: baseStatus } : r));
      toast({ title: "Record Updated", description: "Training record has been updated." });
    } else {
      const newRecord: TrainingRecord = { id: crypto.randomUUID(), ...data, status: baseStatus };
      setTrainingRecords(prev => [newRecord, ...prev]);
      toast({ title: "Record Created", description: "New training record has been created." });
    }
    setIsRecordFormOpen(false);
    setEditingRecord(null);
  };
  
  const getCourseName = (courseId: string) => courses.find(c => c.id === courseId)?.name || "Unknown Course";

  const getDerivedStatus = (record: TrainingRecord): TrainingRecordStatus => {
    if (record.status === 'Planned') return 'Planned';
    if (!record.expiryDate || !isValid(parseISO(record.expiryDate))) return 'Completed'; // No expiry or invalid date means completed indefinitely

    const today = new Date();
    const expiry = parseISO(record.expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= RENEWAL_WARNING_DAYS) return 'Requires Renewal';
    return 'Completed';
  };

  const getStatusColor = (status: TrainingRecordStatus) => {
    switch (status) {
      case 'Planned': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'Requires Renewal': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Expired': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  const StatusIcon = ({ status }: { status: TrainingRecordStatus }) => {
    switch (status) {
      case 'Planned': return <CalendarClock className="h-4 w-4 text-blue-500" />;
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Requires Renewal': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'Expired': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Training session in progress" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="classroom training"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Training &amp; Competence</h1>
                <p className="text-sm text-neutral-300">Manage courses and track employee training records effectively.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module allows you to build a course catalog and maintain training records for employees. 
                Track completion dates, expiry dates, and overall training status to ensure workforce competence.
                All data is stored locally in your browser.
            </p>
        </CardContent>
      </Card>

      {/* Course Catalog Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary"/>Course Catalog</CardTitle>
            <CardDescription>Define and manage your organization's training courses.</CardDescription>
          </div>
          <Button onClick={handleOpenNewCourseForm} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Course
          </Button>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No courses defined yet. Click "Add New Course" to start.</p>
          ) : (
            <ScrollArea className="max-h-[300px] pr-3">
              <ul className="space-y-3">
                {courses.map(course => (
                  <li key={course.id} className="p-3 border rounded-md bg-secondary/30 flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{course.name}</h4>
                      <p className="text-xs text-muted-foreground">{course.category || "Uncategorized"}</p>
                      <p className="text-sm text-muted-foreground mt-1 truncate max-w-md">{course.description || "No description."}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleEditCourse(course)}>
                        <Edit2 className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {isCourseFormOpen && (
        <Dialog open={isCourseFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsCourseFormOpen(false); setEditingCourse(null); }}}>
          <CourseForm
            initialData={editingCourse}
            onSave={handleSaveCourse}
            onCancel={() => { setIsCourseFormOpen(false); setEditingCourse(null); }}
          />
        </Dialog>
      )}

      <Separator />

      {/* Training Records Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><UserCheck className="h-6 w-6 text-accent"/>Training Records</CardTitle>
            <CardDescription>Log and track employee training. Status is automatically updated based on expiry dates.</CardDescription>
          </div>
          <Button onClick={handleOpenNewRecordForm} className="bg-accent hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Record
          </Button>
        </CardHeader>
        <CardContent>
          {trainingRecords.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No training records logged yet.</p>
          ) : (
            <ScrollArea className="max-h-[500px] pr-3">
              <div className="space-y-3">
                {trainingRecords.map(record => {
                  const derivedStatus = getDerivedStatus(record);
                  return (
                    <Card key={record.id} className="p-4 shadow-sm border">
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div className="mb-2 sm:mb-0">
                          <h4 className="font-semibold text-lg">{record.employeeName}</h4>
                          <p className="text-sm text-primary">{getCourseName(record.courseId)}</p>
                        </div>
                        <div className="flex gap-2 self-start sm:self-center shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleEditRecord(record)}>
                            <Edit2 className="mr-1 h-3 w-3" /> Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteRecord(record.id)}>
                            <Trash2 className="mr-1 h-3 w-3" /> Delete
                          </Button>
                        </div>
                      </div>
                      <Separator className="my-3"/>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                            <p className="font-medium">Training Date:</p>
                            <p>{record.trainingDate ? format(parseISO(record.trainingDate), "PPP") : "N/A"}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="font-medium">Expiry Date:</p>
                            <p>{record.expiryDate ? format(parseISO(record.expiryDate), "PPP") : "No Expiry"}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="font-medium">Status:</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusColor(derivedStatus)}`}>
                                <StatusIcon status={derivedStatus} />
                                {derivedStatus}
                            </span>
                        </div>
                         <div className="space-y-0.5">
                            <p className="font-medium">Trainer:</p>
                            <p>{record.trainer || "N/A"}</p>
                        </div>
                      </div>
                      {record.certificateUrl && (
                        <p className="text-xs mt-2">
                          <a href={record.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Certificate
                          </a>
                        </p>
                      )}
                       {record.notes && (
                        <div className="mt-2 pt-2 border-t border-dashed">
                            <p className="text-xs font-medium text-muted-foreground">Notes:</p>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{record.notes}</p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {isRecordFormOpen && (
        <Dialog open={isRecordFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setIsRecordFormOpen(false); setEditingRecord(null); }}}>
          <TrainingRecordForm
            courses={courses}
            initialData={editingRecord}
            onSave={handleSaveRecord}
            onCancel={() => { setIsRecordFormOpen(false); setEditingRecord(null); }}
          />
        </Dialog>
      )}

      <Card className="mt-8 shadow-lg">
        <CardHeader>
            <CardTitle>Future Enhancements Considered</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                While this module provides core training record management, future enhancements could include features like:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                <li>Training needs analysis and skills gap identification.</li>
                <li>Direct certificate/document uploads.</li>
                <li>Automated email reminders for training expiry.</li>
                <li>Detailed competency assessment frameworks and tracking.</li>
                <li>Advanced reporting and analytics on training compliance and effectiveness.</li>
                <li>Integration with e-learning platforms.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
