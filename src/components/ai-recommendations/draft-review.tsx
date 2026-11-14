"use client";
import { createRoot } from 'react-dom/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function DraftContent({ value }: { value: unknown }) {
  if (Array.isArray(value)) return <ul className="list-disc space-y-2 pl-5">{value.map((item, i) => <li key={i}><DraftContent value={item} /></li>)}</ul>;
  if (value && typeof value === 'object') return <div className="space-y-4">{Object.entries(value).map(([key, item]) => <section key={key}>
    <h3 className="mb-1 font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3><DraftContent value={item} />
  </section>)}</div>;
  return <p className="whitespace-pre-wrap break-words text-sm">{String(value ?? '')}</p>;
}

/** Review before returning any generated data to a form or persistence handler. */
export function reviewAiDraft(value: unknown): Promise<boolean> {
  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const close = (accepted: boolean) => {
      resolve(accepted);
      setTimeout(() => { root.unmount(); host.remove(); if (previousFocus instanceof HTMLElement) previousFocus.focus(); }, 0);
    };
    root.render(<Dialog open onOpenChange={open => { if (!open) close(false); }}>
      <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col">
        <DialogHeader><DialogTitle>Review AI draft</DialogTitle>
          <DialogDescription>Check accuracy, site conditions and applicable requirements. This draft does not approve a safety decision or establish legal compliance.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-2"><DraftContent value={value} /></div>
        <DialogFooter><Button variant="outline" onClick={() => close(false)}>Discard draft</Button>
          <Button onClick={() => close(true)}>I have reviewed this draft</Button></DialogFooter>
      </DialogContent>
    </Dialog>);
  });
}
