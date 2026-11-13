import type { ReactNode } from "react";
import { SheiqproLogo } from "@/components/icons/sheiqpro-logo";
import { ShieldCheck, ChartNoAxesCombined, Workflow } from "lucide-react";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
    <aside className="relative hidden min-h-svh flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-16">
      <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="relative flex items-center gap-3"><SheiqproLogo className="h-10 w-10 text-sky-400" /><span className="text-2xl font-semibold tracking-tight">SHEiQpro</span></div>
      <div className="relative max-w-lg space-y-8">
        <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-sky-200">A smarter way to manage SHEQ</span>
        <h1 className="text-5xl font-semibold leading-tight tracking-tight xl:text-6xl">Safer workplaces. <span className="text-sky-400">Clearer decisions.</span></h1>
        <p className="max-w-md text-lg leading-relaxed text-slate-300">Bring risks, audits, incidents and compliance into one connected workspace.</p>
        <div className="grid gap-5 text-sm text-slate-200">
          <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-sky-400" />Organise risk and compliance records</div>
          <div className="flex items-center gap-3"><ChartNoAxesCombined className="h-5 w-5 text-sky-400" />See meaningful safety insights</div>
          <div className="flex items-center gap-3"><Workflow className="h-5 w-5 text-sky-400" />Keep your team working together</div>
        </div>
      </div>
      <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} SHEiQpro. Built for proactive safety management.</p>
    </aside>
    <main className="flex min-w-0 flex-col">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-5 pt-6 lg:hidden"><SheiqproLogo className="h-9 w-9 text-primary" /><span className="text-xl font-semibold">SHEiQpro</span></div>
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10"><div className="w-full max-w-md">{children}</div></div>
      <p className="px-5 pb-6 text-center text-xs text-muted-foreground">Secure access to your safety management workspace</p>
    </main>
  </div>;
}
