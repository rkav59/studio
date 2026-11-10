"use client";
import { useState, type ReactNode } from "react";
import { getDownloadURL } from "@/lib/supabase/storage";
import { useToast } from "@/hooks/use-toast";
export function DocumentLink({
  path,
  children,
  className,
}: {
  path: string;
  children: ReactNode;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const url = await getDownloadURL({ path });
          // Download through a temporary anchor: object URLs are short lived and never stored in records.
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.click();
        } catch (error) {
          toast({
            title: "Document unavailable",
            description: (error as Error).message,
            variant: "destructive",
          });
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Opening…" : children}
    </button>
  );
}
