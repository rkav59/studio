
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit2, Trash2, Copy, Eye, Library, Lock, Loader2 } from "lucide-react";
import type { ChecklistTemplate, ChecklistItemTemplate } from "@/lib/types";
import { TemplateForm } from "@/components/checklist-templates/template-form";
import { defaultChecklistTemplates } from '@/lib/checklist-templates';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const USER_TEMPLATES_COLLECTION = 'userChecklistTemplates';

export default function ChecklistTemplatesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [templateToCopy, setTemplateToCopy] = useState<ChecklistTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<ChecklistTemplate | null>(null);

  const { data: userTemplates = [], isLoading: isLoadingTemplates, error: templatesError } = useQuery<ChecklistTemplate[]>({
    queryKey: [USER_TEMPLATES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, USER_TEMPLATES_COLLECTION), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistTemplate));
    },
    enabled: !!user?.uid,
  });

  const addTemplateMutation = useMutation({
    mutationFn: async (newTemplateData: Omit<ChecklistTemplate, 'id' | 'userId'>) => {
      if (!user?.uid) throw new Error("User not authenticated");
      return addDoc(collection(db, USER_TEMPLATES_COLLECTION), { ...newTemplateData, userId: user.uid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_TEMPLATES_COLLECTION, user?.uid] });
      toast({ title: "Template Created", description: "New template has been created." });
      setIsFormOpen(false);
      setEditingTemplate(null);
      setTemplateToCopy(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error Creating Template", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (templateToUpdate: ChecklistTemplate) => {
      if (!user?.uid || !templateToUpdate.id) throw new Error("User not authenticated or template ID missing");
      const { id, ...dataToUpdate } = templateToUpdate;
      const templateRef = doc(db, USER_TEMPLATES_COLLECTION, id);
      // Ensure userId is part of the data to prevent accidental updates by other users if rules are loose
      await updateDoc(templateRef, { ...dataToUpdate, userId: user.uid });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [USER_TEMPLATES_COLLECTION, user?.uid] });
      toast({ title: "Template Updated", description: `Template "${variables.name}" has been updated.` });
      setIsFormOpen(false);
      setEditingTemplate(null);
      setTemplateToCopy(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error Updating Template", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const templateRef = doc(db, USER_TEMPLATES_COLLECTION, templateId);
      // Add check here: query the doc first to ensure it belongs to the user before deleting, if rules are not strict enough
      await deleteDoc(templateRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_TEMPLATES_COLLECTION, user?.uid] });
      toast({ title: "Template Deleted", description: "The custom checklist template has been deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error Deleting Template", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    },
  });


  const allTemplates = useMemo(() => {
    const systemTemplates = defaultChecklistTemplates.map(t => ({ ...t, isSystemDefault: true }));
    const customTemplates = userTemplates.map(t => ({ ...t, isSystemDefault: false }));
    return [...systemTemplates, ...customTemplates];
  }, [userTemplates]);

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setTemplateToCopy(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template: ChecklistTemplate) => {
    if (template.isSystemDefault) {
        toast({ title: "System Template", description: "System templates cannot be directly edited. Please copy it to create a new custom template.", variant: "default"});
        return;
    }
    setEditingTemplate(template);
    setTemplateToCopy(null);
    setIsFormOpen(true);
  };

  const handleCopy = (template: ChecklistTemplate) => {
    setTemplateToCopy({
      ...template,
      name: `${template.name} (Copy)`,
      id: '', 
      isSystemDefault: false,
    });
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleDelete = (templateId: string) => {
    deleteTemplateMutation.mutate(templateId);
  };

  const handleSaveTemplate = (data: { name: string; items: ChecklistItemTemplate[] }) => {
    if (editingTemplate && !editingTemplate.isSystemDefault && editingTemplate.id) {
      updateTemplateMutation.mutate({
        ...editingTemplate,
        name: data.name,
        items: data.items.map(item => ({...item, id: item.id || crypto.randomUUID()})),
      });
    } else {
      const newTemplateData = {
        name: data.name,
        items: data.items.map(item => ({...item, id: item.id || crypto.randomUUID()})),
        isSystemDefault: false, 
        // userId will be added by the mutation
      };
      addTemplateMutation.mutate(newTemplateData);
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    setTemplateToCopy(null);
  };
  
  const handleViewTemplate = (template: ChecklistTemplate) => {
    setViewingTemplate(template);
  };

  if (isLoadingTemplates) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="text-red-500 text-center py-8">
        Error loading templates. Please try again later.
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <TemplateForm
        initialData={editingTemplate || templateToCopy}
        onSave={handleSaveTemplate}
        onCancel={handleCancelForm}
        isEditing={!!editingTemplate}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Library className="h-8 w-8" /> Checklist Template Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your reusable checklist templates. System templates can be copied. Custom templates are stored in Firestore.
          </p>
        </div>
        <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Template
        </Button>
      </div>
      
      <Separator />

      {allTemplates.length === 0 && !defaultChecklistTemplates.length ? (
        <p className="text-muted-foreground text-center py-8">No checklist templates available. Click "Create New Template" to start.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTemplates.map(template => (
            <Card key={template.id} className="shadow-lg flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate mr-2">{template.name}</span>
                  {template.isSystemDefault && <Lock className="h-4 w-4 text-muted-foreground shrink-0" title="System Default Template (Read-Only)" />}
                </CardTitle>
                <CardDescription>{template.items.length} item(s)</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <ScrollArea className="h-[100px] text-xs text-muted-foreground border rounded-md p-2 bg-secondary/30">
                    <ul className="list-disc list-inside pl-2 space-y-1">
                        {template.items.slice(0, 5).map(item => (
                            <li key={item.id} className="truncate">{item.text}</li>
                        ))}
                        {template.items.length > 5 && <li>...and {template.items.length - 5} more.</li>}
                    </ul>
                 </ScrollArea>
              </CardContent>
              <CardContent className="pt-0 flex flex-wrap gap-2 justify-start border-t mt-auto pt-4">
                <Button variant="outline" size="sm" onClick={() => handleViewTemplate(template)}>
                  <Eye className="mr-1 h-3 w-3" /> View
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCopy(template)}>
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
                {!template.isSystemDefault && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(template)}>
                      <Edit2 className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deleteTemplateMutation.isPending}>
                          {deleteTemplateMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Trash2 className="mr-1 h-3 w-3" />} Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the template "{template.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(template.id)}>
                            Delete Template
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    {viewingTemplate && (
        <AlertDialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
          <AlertDialogContent className="sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {viewingTemplate.isSystemDefault && <Lock className="h-5 w-5 text-muted-foreground" />}
                {viewingTemplate.name}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {viewingTemplate.items.length} item(s). {viewingTemplate.isSystemDefault ? "(System Default Template)" : "(Custom Template)"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ScrollArea className="max-h-[60vh] my-4 pr-3">
              <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {viewingTemplate.items.map(item => (
                  <li key={item.id}>{item.text}</li>
                ))}
              </ul>
            </ScrollArea>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setViewingTemplate(null)}>Close</AlertDialogCancel>
               <Button onClick={() => { handleCopy(viewingTemplate); setViewingTemplate(null); }}>
                  <Copy className="mr-2 h-4 w-4" /> Copy as New Template
                </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
