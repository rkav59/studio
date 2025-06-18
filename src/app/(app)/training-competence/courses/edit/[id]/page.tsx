"use client";

import { useRouter, useParams } from 'next/navigation';
import { CourseForm, type CourseFormValues } from "@/components/training-competence/course-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TrainingCourse } from '@/lib/types';
import { ArrowLeft, BookOpen } from 'lucide-react';

const COURSES_COLLECTION = 'trainingCourses';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const courseId = params.id as string;

  const { data: courseToEdit, isLoading: isLoadingCourse, error: courseError } = useQuery<TrainingCourse | null>({
    queryKey: [COURSES_COLLECTION, courseId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !courseId) return null;
      const courseRef = doc(db, COURSES_COLLECTION, courseId);
      const courseSnap = await getDoc(courseRef);
      if (courseSnap.exists() && courseSnap.data().userId === user.uid) {
        return { id: courseSnap.id, ...courseSnap.data() } as TrainingCourse;
      }
      return null;
    },
    enabled: !!user?.uid && !!courseId,
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (updatedCourseData: TrainingCourse) => { // Accepts full TrainingCourse with id
      if (!user?.uid || !updatedCourseData.id) throw new Error("User or course ID missing.");
      const { id, ...dataToUpdate } = updatedCourseData; // separate id
      const courseRef = doc(db, COURSES_COLLECTION, id);
      await updateDoc(courseRef, { ...dataToUpdate, userId: user.uid }); // ensure userId is part of update
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [COURSES_COLLECTION, user?.uid] });
      queryClient.invalidateQueries({ queryKey: [COURSES_COLLECTION, variables.id, user?.uid] });
      toast({ title: "Course Updated", description: `Course "${variables.name}" has been updated.` });
      router.push('/training-competence');
    },
    onError: (e: Error) => toast({ title: "Error Updating Course", description: e.message, variant: "destructive" }),
  });

  const handleSaveCourse = (formData: CourseFormValues) => {
    if (!courseToEdit) return;
    // Construct the full TrainingCourse object for the mutation
    const courseDataToSave: TrainingCourse = {
      ...courseToEdit, // Spread existing data like id and userId
      ...formData,     // Spread form values
    };
    updateCourseMutation.mutate(courseDataToSave);
  };

  const handleCancel = () => {
    router.push('/training-competence');
  };

  if (isLoadingCourse) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="p-0"> {/* CourseForm has its own padding now */}
            <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (courseError || !courseToEdit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={handleCancel}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Card>
          <CardHeader><CardTitle>Course Not Found</CardTitle></CardHeader>
          <CardContent><p>{courseError ? courseError.message : "The course could not be found or you don't have permission to edit it."}</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Training & Competence">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <BookOpen className="h-6 w-6 text-primary" /> Edit Course: {courseToEdit.name}
            </h1>
        </div>
      <Card className="shadow-lg">
         <CardHeader>
          <CardDescription>
            Modify the details for the training course below.
          </CardDescription>
        </CardHeader>
        <CourseForm 
            initialData={courseToEdit} 
            onSave={handleSaveCourse} 
            onCancel={handleCancel}
            isSubmitting={updateCourseMutation.isPending}
        />
      </Card>
    </div>
  );
}
