"use client";

import { useRouter } from 'next/navigation';
import { CourseForm, type CourseFormValues } from "@/components/training-competence/course-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TrainingCourse } from '@/lib/types';
import { ArrowLeft, BookOpen } from 'lucide-react';

const COURSES_COLLECTION = 'trainingCourses';

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addCourseMutation = useMutation({
    mutationFn: async (newCourseData: CourseFormValues) => { // CourseFormValues is Omit<TrainingCourse, 'id' | 'userId'>
      if (!user?.uid) throw new Error("User not authenticated.");
      return addDoc(collection(db, COURSES_COLLECTION), { ...newCourseData, userId: user.uid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COURSES_COLLECTION, user?.uid] });
      toast({ title: "Course Created", description: "The new training course has been added." });
      router.push('/training-competence');
    },
    onError: (e: Error) => toast({ title: "Error Creating Course", description: e.message, variant: "destructive" }),
  });

  const handleSaveCourse = (data: CourseFormValues) => {
    addCourseMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/training-competence');
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleCancel} aria-label="Back to Training & Competence">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                 <BookOpen className="h-6 w-6 text-primary" /> Add New Training Course
            </h1>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardDescription>
            Define the details for the new training course below.
          </CardDescription>
        </CardHeader>
        <CourseForm 
          onSave={handleSaveCourse} 
          onCancel={handleCancel} 
          isSubmitting={addCourseMutation.isPending}
        />
      </Card>
    </div>
  );
}
