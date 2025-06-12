
"use client";

import { useFieldArray, Controller } from "react-hook-form";
import type { Control, UseFormWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import type { InvestigationFormValues, FishboneCategory as FishboneCategoryFormType } from "./investigation-form";

interface FishboneCategoryItemProps {
  categoryIndex: number;
  control: Control<InvestigationFormValues>;
  removeCategory: (index: number) => void;
  watch: UseFormWatch<InvestigationFormValues>;
}

const getDefaultFishboneCause = () => ({ id: crypto.randomUUID(), causeText: "" });

export function FishboneCategoryItem({ categoryIndex, control, removeCategory, watch }: FishboneCategoryItemProps) {
  const categoryNamePath = `fishboneCategories.${categoryIndex}.categoryName` as const;
  const causesPath = `fishboneCategories.${categoryIndex}.causes` as const;
  
  const { fields: causeFields, append: causeAppend, remove: causeRemove } = useFieldArray({
    control: control,
    name: causesPath,
  });

  const categoryName = watch(categoryNamePath);

  return (
    <Card className="p-4 bg-background shadow-md">
      <div className="flex justify-between items-center mb-3">
        <FormField
          control={control}
          name={categoryNamePath}
          render={({ field }) => (
            <FormItem className="flex-grow mr-2">
              <FormLabel className="text-sm font-medium text-primary">Category #{categoryIndex + 1}</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Equipment, People, Process" {...field} className="text-base"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(categoryIndex)} className="text-destructive hover:bg-destructive/10 shrink-0 mt-6">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove Category</span>
        </Button>
      </div>

      <FormLabel className="text-xs font-medium text-muted-foreground">
        Potential Causes for "{categoryName || 'this category'}"
      </FormLabel>
      <div className="space-y-2 mt-1 pl-4 border-l-2 border-primary/30">
        {causeFields.map((causeItem, causeIndex) => (
          <div key={causeItem.id} className="flex items-center gap-2 py-1">
            <span className="text-primary">-&gt;</span>
            <FormField
              control={control}
              name={`fishboneCategories.${categoryIndex}.causes.${causeIndex}.causeText`}
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel className="sr-only">Cause {causeIndex + 1}</FormLabel>
                  <FormControl>
                    <Input placeholder={`Cause ${causeIndex + 1}`} {...field} className="h-9 text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => causeRemove(causeIndex)} className="text-destructive hover:bg-destructive/10 shrink-0">
              <Trash2 className="h-3 w-3" />
              <span className="sr-only">Remove Cause</span>
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => causeAppend(getDefaultFishboneCause())} className="text-xs">
          <PlusCircle className="mr-1 h-3 w-3" /> Add Cause to this Category
        </Button>
        <Controller
            name={`fishboneCategories.${categoryIndex}.causes`}
            control={control}
            render={({ fieldState }) => fieldState.error ? <FormMessage>{fieldState.error.message || fieldState.error.root?.message}</FormMessage> : null}
        />
      </div>
    </Card>
  );
}
