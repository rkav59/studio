
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit2, Trash2, Copy, Eye, Library, Lock } from "lucide-react";
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

const USER_TEMPLATES_STORAGE_KEY = 'sheild-user-checklist-templates-v1';

export default function ChecklistTemplatesPage() {
  const { toast } = useToast();
  const [userTemplates, setUserTemplates] = useState<ChecklistTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [templateToCopy, setTemplateToCopy] = useState<ChecklistTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<ChecklistTemplate | null>(null);

  useEffect(() => {
    try {
      const storedUserTemplates = localStorage.getItem(USER_TEMPLATES_STORAGE_KEY);
      if (storedUserTemplates) {
        setUserTemplates(JSON.parse(storedUserTemplates));
      }
    } catch (error) {
        console.error("Error loading user checklist templates from localStorage:", error);
        toast({ title: "Error", description: "Could not load custom templates.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_TEMPLATES_STORAGE_KEY, JSON.stringify(userTemplates));
    } catch (error) {
        console.error("Error saving user checklist templates to localStorage:", error);
        toast({ title: "Error", description: "Could not save custom templates.", variant: "destructive" });
    }
  }, [userTemplates, toast]);

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
      name: `${template.name} (Copy)`, // Pre-fill name for copy
      id: '', // ID will be generated on save
      isSystemDefault: false,
    });
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleDelete = (templateId: string) => {
    setUserTemplates(prev => prev.filter(t => t.id !== templateId));
    toast({ title: "Template Deleted", description: "The custom checklist template has been deleted." });
  };

  const handleSaveTemplate = (data: { name: string; items: ChecklistItemTemplate[] }) => {
    if (editingTemplate && !editingTemplate.isSystemDefault) {
      // Editing existing user template
      setUserTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id ? { ...t, name: data.name, items: data.items.map(item => ({...item, id: item.id || crypto.randomUUID()})) } : t
      ));
      toast({ title: "Template Updated", description: `Template "${data.name}" has been updated.` });
    } else {
      // Creating new template (either from scratch or from copy)
      const newTemplate: ChecklistTemplate = {
        id: crypto.randomUUID(),
        name: data.name,
        items: data.items.map(item => ({...item, id: item.id || crypto.randomUUID()})),
        isSystemDefault: false,
      };
      setUserTemplates(prev => [newTemplate, ...prev]);
      toast({ title: "Template Created", description: `New template "${data.name}" has been created.` });
    }
    setIsFormOpen(false);
    setEditingTemplate(null);
    setTemplateToCopy(null);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    setTemplateToCopy(null);
  };
  
  const handleViewTemplate = (template: ChecklistTemplate) => {
    setViewingTemplate(template);
  };


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
            Manage your reusable checklist templates. System templates can be copied to create custom versions.
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
                  {template.isSystemDefault && <Lock className="h-4 w-4 text-muted-foreground shrink-0" titleAccess="System Default Template (Read-Only)" />}
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
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
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
