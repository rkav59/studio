
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
import type { TrainingJobRoleMatrixEntry, TrainingCourse } from "@/lib/types";
import { Briefcase, BookOpen } from "lucide-react";

interface TrainingJobRoleMatrixDetailsDialogProps {
  entry: TrainingJobRoleMatrixEntry;
  courses: TrainingCourse[];
  onClose: () => void;
}

export function TrainingJobRoleMatrixDetailsDialog({ entry, courses, onClose }: TrainingJobRoleMatrixDetailsDialogProps) {
  
  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? `${course.name}` : "Unknown Course";
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-600">
            <Briefcase className="h-6 w-6" /> Training Requirements for: {entry.jobRole}
          </DialogTitle>
          <DialogDescription>
            Standard training courses required for this job role.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4 my-4">
            <div className="space-y-4 text-sm">
                <div>
                    <strong className="text-muted-foreground">Job Role:</strong>
                    <p className="font-semibold text-base">{entry.jobRole}</p>
                </div>
                
                <Separator/>
                
                <div>
                    <strong className="text-muted-foreground flex items-center gap-1 mb-1"><BookOpen className="h-4 w-4"/>Required Courses:</strong>
                    {entry.requiredCourseIds.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 pl-4 bg-muted/30 p-3 rounded-md">
                            {entry.requiredCourseIds.map(courseId => (
                                <li key={courseId}>{getCourseName(courseId)}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic text-muted-foreground">No specific courses listed for this role.</p>
                    )}
                </div>
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
