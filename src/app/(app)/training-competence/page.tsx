"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Dialog import as forms are now on separate pages
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, BookOpen, UserCheck, CalendarClock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { TrainingCourse, TrainingRecord, TrainingRecordStatus } from "@/lib/types";
// Removed CourseForm and TrainingRecordForm imports
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInDays, isValid, isBefore } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation'; // Added useRouter

const COURSES_COLLECTION = 'trainingCourses';
const RECORDS_COLLECTION = 'trainingRecords';
const RENEWAL_WARNING_DAYS = 30;


export default function TrainingCompetencePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter(); // Initialize useRouter

  // Removed useState for form dialogs and editing states

  // Fetch Courses
  const { data: courses = [], isLoading: isLoadingCourses, error: coursesError } = useQuery<TrainingCourse[]>({
    queryKey: [COURSES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, COURSES_COLLECTION), where("userId", "==", user.uid), orderBy("name"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingCourse));
    },
    enabled: !!user?.uid,
  });

  // Fetch Training Records
  const { data: trainingRecords = [], isLoading: isLoadingRecords, error: recordsError } = useQuery<TrainingRecord[]>({
    queryKey: [RECORDS_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, RECORDS_COLLECTION), where("userId", "==", user.uid), orderBy("trainingDate", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          trainingDate: (data.trainingDate as Timestamp)?.toDate().toISOString(),
          expiryDate: (data.expiryDate as Timestamp)?.toDate().toISOString() || null,
        } as TrainingRecord;
      });
    },
    enabled: !!user?.uid,
  });

  // Course Deletion Mutation (remains here as it's triggered from the list)
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      if (trainingRecords.some(record => record.courseId === courseId)) {
        throw new Error("This course is linked to training records. Delete records first.");
      }
      await deleteDoc(doc(db, COURSES_COLLECTION, courseId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COURSES_COLLECTION, user?.uid] });
      toast({ title: "Course Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Course", description: e.message, variant: "destructive" }),
  });

  // Training Record Deletion Mutation (remains here)
  const deleteRecordMutation = useMutation({
    mutationFn: (recordId: string) => deleteDoc(doc(db, RECORDS_COLLECTION, recordId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECORDS_COLLECTION, user?.uid] });
      toast({ title: "Training Record Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Record", description: e.message, variant: "destructive" }),
  });


  // Navigation handlers
  const handleOpenNewCourseForm = () => router.push('/training-competence/courses/new');
  const handleEditCourse = (course: TrainingCourse) => router.push(`/training-competence/courses/edit/${course.id}`);
  const handleDeleteCourse = (courseId: string) => deleteCourseMutation.mutate(courseId);

  const handleOpenNewRecordForm = () => {
    if (courses.length === 0) {
        toast({ title: "No Courses", description: "Please add a course to the catalog first.", variant: "destructive"});
        return;
    }
    router.push('/training-competence/records/new');
  };
  const handleEditRecord = (record: TrainingRecord) => router.push(`/training-competence/records/edit/${record.id}`);
  const handleDeleteRecord = (recordId: string) => deleteRecordMutation.mutate(recordId);
  
  const getCourseName = (courseId: string) => courses.find(c => c.id === courseId)?.name || "Unknown Course";
  const getDerivedStatus = (record: TrainingRecord): TrainingRecordStatus => {
    if (record.status === 'Planned') return 'Planned';
    if (!record.expiryDate || !isValid(parseISO(record.expiryDate))) return 'Completed';

    const today = new Date(); today.setHours(0,0,0,0);
    const expiry = parseISO(record.expiryDate);
    
    if (isBefore(expiry, today)) return 'Expired';
    if (differenceInDays(expiry, today) <= RENEWAL_WARNING_DAYS) return 'Requires Renewal';
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

  if (isLoadingCourses || isLoadingRecords) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading training data...</p>
      </div>
    );
  }
  if (coursesError || recordsError) {
    return <div className="text-red-500 text-center py-10">Error loading data: {(coursesError || recordsError)?.message}</div>;
  }

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
                <p className="text-sm text-neutral-300">Manage courses and track employee training records effectively. Data stored in Firestore.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module allows you to build a course catalog and maintain training records for employees. 
                Track completion dates, expiry dates, and overall training status to ensure workforce competence.
                All data is now stored securely in Firebase Firestore.
            </p>
        </CardContent>
      </Card>

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
            <p className="text-muted-foreground text-center py-4">No courses defined yet.</p>
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
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCourse(course.id)} disabled={deleteCourseMutation.isPending && deleteCourseMutation.variables === course.id}>
                         {deleteCourseMutation.isPending && deleteCourseMutation.variables === course.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Trash2 className="mr-1 h-3 w-3" />} Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><UserCheck className="h-6 w-6 text-accent"/>Training Records</CardTitle>
            <CardDescription>Log and track employee training. Status is automatically updated based on expiry dates.</CardDescription>
          </div>
          <Button onClick={handleOpenNewRecordForm} className="bg-accent hover:bg-accent/90" disabled={courses.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Record
          </Button>
        </CardHeader>
        <CardContent>
          {courses.length === 0 && <p className="text-center text-muted-foreground py-4">Please add courses to the catalog first to log training records.</p>}
          {trainingRecords.length === 0 && courses.length > 0 && (
            <p className="text-muted-foreground text-center py-4">No training records logged yet.</p>
          )}
          {trainingRecords.length > 0 && (
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
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteRecord(record.id)} disabled={deleteRecordMutation.isPending && deleteRecordMutation.variables === record.id}>
                            {deleteRecordMutation.isPending && deleteRecordMutation.variables === record.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Trash2 className="mr-1 h-3 w-3" />} Delete
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
    </div>
  );
}
