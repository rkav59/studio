

"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Dialog import as forms are now on separate pages
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit2, Trash2, BookOpen, UserCheck, CalendarClock, AlertTriangle, CheckCircle2, Loader2, BookUser, Search, XCircle, Briefcase } from "lucide-react"; // Added Briefcase
import type { TrainingCourse, TrainingRecord, TrainingRecordStatus, TrainingJobRoleMatrixEntry } from "@/lib/types"; // Added TrainingJobRoleMatrixEntry
// Removed CourseForm and TrainingRecordForm imports
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, isBefore, differenceInDays } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation'; // Added useRouter
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrainingJobRoleMatrixDetailsDialog } from '@/components/training-competence/training-job-role-matrix-details-dialog';


const COURSES_COLLECTION = 'trainingCourses';
const RECORDS_COLLECTION = 'trainingRecords';
const TRAINING_JOB_ROLE_MATRIX_COLLECTION = 'trainingJobRoleMatrix'; // New collection
const RENEWAL_WARNING_DAYS = 30;


export default function TrainingCompetencePage() {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter(); // Initialize useRouter

  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [recordSearchTerm, setRecordSearchTerm] = useState("");
  const [jobRoleSearchTerm, setJobRoleSearchTerm] = useState("");
  const [viewingJobRoleEntry, setViewingJobRoleEntry] = useState<TrainingJobRoleMatrixEntry | null>(null);

  const canManageCourses = useMemo(() => user?.email === 'sentriq263@gmail.com' || (userProfile && ['admin', 'she_officer'].includes(userProfile.role)), [user, userProfile]);
  const canManageRecords = useMemo(() => user?.email === 'sentriq263@gmail.com' || (userProfile && ['admin', 'she_officer', 'she_rep'].includes(userProfile.role)), [user, userProfile]);
  const disabledTooltipContent = "You do not have permission to perform this action.";

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
  
  // Fetch Training Job Role Matrix
  const { data: trainingJobRoleMatrix = [], isLoading: isLoadingJobRoleMatrix, error: jobRoleMatrixError } = useQuery<TrainingJobRoleMatrixEntry[]>({
    queryKey: [TRAINING_JOB_ROLE_MATRIX_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, TRAINING_JOB_ROLE_MATRIX_COLLECTION), where("userId", "==", user.uid), orderBy("jobRole"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingJobRoleMatrixEntry));
    },
    enabled: !!user?.uid,
  });


  // Course Deletion Mutation (remains here as it's triggered from the list)
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.uid) throw new Error("User not authenticated.");
      if (trainingRecords.some(record => record.courseId === courseId) || 
          trainingJobRoleMatrix.some(matrix => matrix.requiredCourseIds.includes(courseId))) {
        throw new Error("Cannot delete: This course is linked to training records or a job role matrix. Please remove associations first.");
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

  // Job Role Matrix Deletion Mutation
  const deleteJobRoleEntryMutation = useMutation({
    mutationFn: (entryId: string) => deleteDoc(doc(db, TRAINING_JOB_ROLE_MATRIX_COLLECTION, entryId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRAINING_JOB_ROLE_MATRIX_COLLECTION, user?.uid] });
      toast({ title: "Job Role Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error Deleting Job Role", description: e.message, variant: "destructive" }),
  });


  const getCourseName = (courseId: string) => courses.find(c => c.id === courseId)?.name || "Unknown Course";

  const filteredCourses = useMemo(() => {
    if (!courseSearchTerm) return courses;
    const lowercasedTerm = courseSearchTerm.toLowerCase();
    return courses.filter(c =>
      c.name.toLowerCase().includes(lowercasedTerm) ||
      (c.category && c.category.toLowerCase().includes(lowercasedTerm))
    );
  }, [courses, courseSearchTerm]);

  const filteredTrainingRecords = useMemo(() => {
    if (!recordSearchTerm) return trainingRecords;
    const lowercasedTerm = recordSearchTerm.toLowerCase();
    return trainingRecords.filter(r =>
      r.employeeName.toLowerCase().includes(lowercasedTerm) ||
      getCourseName(r.courseId).toLowerCase().includes(lowercasedTerm)
    );
  }, [trainingRecords, recordSearchTerm, courses]);
  
  const filteredJobRoleMatrix = useMemo(() => {
    if (!jobRoleSearchTerm) return trainingJobRoleMatrix;
    const lowercasedTerm = jobRoleSearchTerm.toLowerCase();
    return trainingJobRoleMatrix.filter(entry => entry.jobRole.toLowerCase().includes(lowercasedTerm));
  }, [trainingJobRoleMatrix, jobRoleSearchTerm]);


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
  
  const handleOpenNewJobRoleForm = () => {
    if (courses.length === 0) {
      toast({ title: "No Courses", description: "Please add courses before defining job roles.", variant: "destructive"});
      return;
    }
    router.push('/training-competence/job-role-matrix/new');
  };
  const handleEditJobRoleEntry = (entry: TrainingJobRoleMatrixEntry) => router.push(`/training-competence/job-role-matrix/edit/${entry.id}`);
  const handleDeleteJobRoleEntry = (entryId: string) => deleteJobRoleEntryMutation.mutate(entryId);
  
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
  
  const recordsRequiringAttention = useMemo(() => {
    return trainingRecords
      .map(record => ({ ...record, derivedStatus: getDerivedStatus(record) }))
      .filter(record => record.derivedStatus === 'Expired' || record.derivedStatus === 'Requires Renewal')
      .sort((a, b) => {
        // Sort by status first (Expired > Requires Renewal), then by date
        const statusOrder: Record<string, number> = { 'Expired': 1, 'Requires Renewal': 2 };
        const aStatus = statusOrder[a.derivedStatus] || 3;
        const bStatus = statusOrder[b.derivedStatus] || 3;
        if (aStatus !== bStatus) {
          return aStatus - bStatus;
        }
        const dateA = a.expiryDate ? parseISO(a.expiryDate).getTime() : 0;
        const dateB = b.expiryDate ? parseISO(b.expiryDate).getTime() : 0;
        return dateA - dateB;
      });
  }, [trainingRecords]);

  const getReminderStatusColor = (status: TrainingRecordStatus) => {
    switch (status) {
        case 'Expired': return 'text-red-600 dark:text-red-400';
        case 'Requires Renewal': return 'text-yellow-600 dark:text-yellow-400';
        default: return 'text-muted-foreground';
    }
  };

  const uniqueEmployees = useMemo(() => {
    const employeeSet = new Set(trainingRecords.map(r => r.employeeName));
    return Array.from(employeeSet).sort();
  }, [trainingRecords]);

  const trainingMatrixData = useMemo(() => {
    return uniqueEmployees.map(employeeName => {
      const employeeRecords = trainingRecords.filter(r => r.employeeName === employeeName);
      const courseStatuses: Record<string, TrainingRecord | undefined> = {};
      courses.forEach(course => {
        const recordsForCourse = employeeRecords
          .filter(r => r.courseId === course.id)
          .sort((a, b) => new Date(b.trainingDate).getTime() - new Date(a.trainingDate).getTime());
        courseStatuses[course.id] = recordsForCourse[0];
      });
      return {
        employeeName,
        courseStatuses
      };
    });
  }, [uniqueEmployees, courses, trainingRecords]);


  if (isLoadingCourses || isLoadingRecords || isLoadingJobRoleMatrix) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading training data...</p>
      </div>
    );
  }
  if (coursesError || recordsError || jobRoleMatrixError) {
    return <div className="text-red-500 text-center py-10">Error loading data: ${(coursesError || recordsError)?.message}</div>;
  }

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <BookUser className="h-8 w-8"/> Training & Competence
        </h1>
        <p className="text-muted-foreground mt-2">
            This module allows you to build a course catalog, define training needs by job role, and maintain training records for employees.
        </p>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link href="#reminders-section">Reminders</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="#training-matrix">Training Matrix</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="#job-role-matrix">Job Role Matrix</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="#course-catalog">Course Catalog</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="#training-records">Training Records</Link></Button>
        </CardContent>
      </Card>
      
      <Separator />

      {recordsRequiringAttention.length > 0 && (
        <Card id="reminders-section" className="border-orange-500/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-6 w-6"/> Training Reminders
            </CardTitle>
            <CardDescription>
              The following training records are expired or require renewal soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[250px] pr-3">
              <ul className="space-y-3">
                {recordsRequiringAttention.map(record => {
                  const derivedStatus = getDerivedStatus(record);
                  return (
                    <li key={record.id} className={`p-3 border rounded-md ${derivedStatus === 'Expired' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold">{record.employeeName}</p>
                          <p className="text-sm text-muted-foreground">{getCourseName(record.courseId)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-semibold ${getReminderStatusColor(derivedStatus)}`}>{derivedStatus}</p>
                          {record.expiryDate && (
                            <p className="text-xs text-muted-foreground">Expires: {format(parseISO(record.expiryDate), 'PPP')}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Separator />

      <Card id="training-matrix">
        <CardHeader>
          <CardTitle>Training Compliance Matrix</CardTitle>
          <CardDescription>
            An overview of training status for each employee across all available courses. Hover over a status for details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uniqueEmployees.length === 0 || courses.length === 0 ? (
             <p className="text-muted-foreground text-center py-4">No employee or course data available to build the matrix.</p>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10 font-semibold">Employee</TableHead>
                    {courses.map(course => (
                      <TableHead key={course.id} className="text-center">{course.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingMatrixData.map(({ employeeName, courseStatuses }) => (
                    <TableRow key={employeeName}>
                      <TableCell className="font-medium sticky left-0 bg-card z-10">{employeeName}</TableCell>
                      {courses.map(course => {
                        const record = courseStatuses[course.id];
                        const status: TrainingRecordStatus | 'Not Taken' = record ? getDerivedStatus(record) : 'Not Taken';
                        
                        const getCellContent = () => {
                            let colorClass: string;
                            let IconComponent: JSX.Element;

                            switch(status) {
                                case 'Planned': colorClass = getStatusColor('Planned'); IconComponent = <CalendarClock className="h-4 w-4" />; break;
                                case 'Completed': colorClass = getStatusColor('Completed'); IconComponent = <CheckCircle2 className="h-4 w-4" />; break;
                                case 'Requires Renewal': colorClass = getStatusColor('Requires Renewal'); IconComponent = <AlertTriangle className="h-4 w-4" />; break;
                                case 'Expired': colorClass = getStatusColor('Expired'); IconComponent = <AlertTriangle className="h-4 w-4" />; break;
                                case 'Not Taken':
                                default:
                                    colorClass = "bg-muted text-muted-foreground";
                                    IconComponent = <XCircle className="h-4 w-4" />;
                            }
                            return (
                                <div className={cn("px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 w-fit mx-auto", colorClass)}>
                                    {IconComponent}
                                    <span className="hidden sm:inline">{status}</span>
                                </div>
                            );
                        };
                        
                        return (
                          <TableCell key={course.id} className="text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild><div className="flex justify-center">{getCellContent()}</div></TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-sm space-y-1">
                                    <p className="font-semibold">{employeeName}</p>
                                    <p className="text-muted-foreground">{course.name}</p>
                                    <Separator/>
                                    {record ? (
                                      <>
                                        <p>Status: {status}</p>
                                        <p>Trained: {format(parseISO(record.trainingDate), 'PPP')}</p>
                                        {record.expiryDate && <p>Expires: {format(parseISO(record.expiryDate), 'PPP')}</p>}
                                      </>
                                    ) : (
                                      <p>No training record found.</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
           )}
        </CardContent>
      </Card>


      <Separator />

       <Card id="job-role-matrix">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-6 w-6 text-indigo-600"/>Job Role Training Matrix</CardTitle>
            <CardDescription>Define standard training requirements for different job roles (Training Needs Analysis).</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search job roles..." className="pl-8 w-full sm:w-[200px]" value={jobRoleSearchTerm} onChange={(e) => setJobRoleSearchTerm(e.target.value)} /></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div tabIndex={0} className={cn(!canManageCourses && "cursor-not-allowed")}>
                    <Button onClick={() => canManageCourses && handleOpenNewJobRoleForm()} disabled={!canManageCourses || courses.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <PlusCircle className="mr-2 h-4 w-4" /> Define Job Role
                    </Button>
                </div>
              </TooltipTrigger>
              {!canManageCourses && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 && <p className="text-center text-muted-foreground py-4">Please add courses to the catalog first to define job role requirements.</p>}
          {filteredJobRoleMatrix.length === 0 && courses.length > 0 && (
            <p className="text-muted-foreground text-center py-4">{jobRoleSearchTerm ? "No matching job roles found." : "No job role requirements defined yet."}</p>
          )}
          {filteredJobRoleMatrix.length > 0 && (
            <ScrollArea className="max-h-[300px] pr-3">
              <ul className="space-y-3">
                {filteredJobRoleMatrix.map(entry => (
                  <li key={entry.id} className="p-3 border rounded-md bg-secondary/30 flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{entry.jobRole}</h4>
                      <p className="text-xs text-muted-foreground">{entry.requiredCourseIds.length} course(s) required</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <Button variant="outline" size="sm" onClick={() => setViewingJobRoleEntry(entry)}>View</Button>
                      <Tooltip>
                          <TooltipTrigger asChild><div tabIndex={0} className={cn(!canManageCourses && "cursor-not-allowed")}><Button variant="secondary" size="sm" onClick={() => canManageCourses && handleEditJobRoleEntry(entry)} disabled={!canManageCourses}>Edit</Button></div></TooltipTrigger>
                          {!canManageCourses && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                      </Tooltip>
                      <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild><div tabIndex={0} className={cn(!canManageCourses && "cursor-not-allowed")}><AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={!canManageCourses || (deleteJobRoleEntryMutation.isPending && deleteJobRoleEntryMutation.variables === entry.id)}>Delete</Button></AlertDialogTrigger></div></TooltipTrigger>
                            {!canManageCourses && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete Job Role?</AlertDialogTitle><AlertDialogDescription>This will delete the training requirements for "{entry.jobRole}". It will not delete existing training records.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteJobRoleEntry(entry.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      {viewingJobRoleEntry && <TrainingJobRoleMatrixDetailsDialog entry={viewingJobRoleEntry} courses={courses} onClose={() => setViewingJobRoleEntry(null)} />}


      <Separator />

      <Card id="course-catalog">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary"/>Course Catalog</CardTitle>
            <CardDescription>Define and manage your organization's training courses.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search courses..." className="pl-8 w-full sm:w-[200px]" value={courseSearchTerm} onChange={(e) => setCourseSearchTerm(e.target.value)} /></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div tabIndex={0} className={cn(!canManageCourses && "cursor-not-allowed")}>
                    <Button onClick={() => canManageCourses && handleOpenNewCourseForm()} disabled={!canManageCourses} className="bg-primary hover:bg-primary/90">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Course
                    </Button>
                </div>
              </TooltipTrigger>
              {!canManageCourses && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{courseSearchTerm ? "No matching courses found." : "No courses defined yet."}</p>
          ) : (
            <ScrollArea className="max-h-[300px] pr-3">
              <ul className="space-y-3">
                {filteredCourses.map(course => (
                  <li key={course.id} className="p-3 border rounded-md bg-secondary/30 flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{course.name}</h4>
                      <p className="text-xs text-muted-foreground">{course.category || "Uncategorized"}</p>
                      <p className="text-sm text-muted-foreground mt-1 truncate max-w-md">{course.description || "No description."}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <div tabIndex={0} className={cn(!canManageCourses && "cursor-not-allowed")}>
                                  <Button variant="outline" size="sm" onClick={() => canManageCourses && handleEditCourse(course)} disabled={!canManageCourses}>
                                      <Edit2 className="mr-1 h-3 w-3" /> Edit
                                  </Button>
                              </div>
                          </TooltipTrigger>
                          {!canManageCourses && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                      </Tooltip>
                      <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div tabIndex={0} className={cn(!canManageCourses && "cursor-not-allowed")}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" onClick={(e) => !canManageCourses && e.preventDefault()} disabled={!canManageCourses || (deleteCourseMutation.isPending && deleteCourseMutation.variables === course.id)}>
                                            {deleteCourseMutation.isPending && deleteCourseMutation.variables === course.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Trash2 className="mr-1 h-3 w-3" />} Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                </div>
                            </TooltipTrigger>
                            {!canManageCourses && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete the course "{course.name}"? This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      <Separator />

      <Card id="training-records">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><UserCheck className="h-6 w-6 text-accent"/>Training Records</CardTitle>
            <CardDescription>Log and track employee training. Status is automatically updated based on expiry dates.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search records..." className="pl-8 w-full sm:w-[200px]" value={recordSearchTerm} onChange={(e) => setRecordSearchTerm(e.target.value)} /></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div tabIndex={0} className={cn(!canManageRecords && "cursor-not-allowed")}>
                    <Button onClick={() => canManageRecords && handleOpenNewRecordForm()} disabled={!canManageRecords || courses.length === 0} className="bg-accent hover:bg-accent/90">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add New Record
                    </Button>
                </div>
              </TooltipTrigger>
              {!canManageRecords && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 && <p className="text-center text-muted-foreground py-4">Please add courses to the catalog first to log training records.</p>}
          {filteredTrainingRecords.length === 0 && courses.length > 0 && (
            <p className="text-muted-foreground text-center py-4">{recordSearchTerm ? "No matching records found." : "No training records logged yet."}</p>
          )}
          {filteredTrainingRecords.length > 0 && (
            <ScrollArea className="max-h-[500px] pr-3">
              <div className="space-y-3">
                {filteredTrainingRecords.map(record => {
                  const derivedStatus = getDerivedStatus(record);
                  return (
                    <Card key={record.id} className="p-4 shadow-sm border">
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div className="mb-2 sm:mb-0">
                          <h4 className="font-semibold text-lg">{record.employeeName}</h4>
                          <p className="text-sm text-primary">{getCourseName(record.courseId)}</p>
                        </div>
                        <div className="flex gap-2 self-start sm:self-center shrink-0">
                           <Tooltip>
                              <TooltipTrigger asChild>
                                <div tabIndex={0} className={cn(!canManageRecords && "cursor-not-allowed")}>
                                  <Button variant="outline" size="sm" onClick={() => canManageRecords && handleEditRecord(record)} disabled={!canManageRecords}>
                                    <Edit2 className="mr-1 h-3 w-3" /> Edit
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {!canManageRecords && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                            </Tooltip>
                          <AlertDialog>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                  <div tabIndex={0} className={cn(!canManageRecords && "cursor-not-allowed")}>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm" disabled={!canManageRecords || (deleteRecordMutation.isPending && deleteRecordMutation.variables === record.id)}>
                                        {deleteRecordMutation.isPending && deleteRecordMutation.variables === record.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Trash2 className="mr-1 h-3 w-3" />} Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                  </div>
                                </TooltipTrigger>
                                {!canManageRecords && <TooltipContent><p>{disabledTooltipContent}</p></TooltipContent>}
                            </Tooltip>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete this training record for {record.employeeName}?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteRecord(record.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </TooltipProvider>
  );
}
