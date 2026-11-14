import Link from "next/link";
import { RecommendationGenerator } from "@/components/ai-recommendations/recommendation-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ClipboardCheck, HardHat, ShieldAlert, Sparkles, Siren } from "lucide-react";

const capabilities = [
  { name: "Hazards & risk assessments", description: "Identify hazards and suggest practical controls.", href: "/risk-management", icon: ShieldAlert },
  { name: "SHEQ audits", description: "Review findings, nonconformances and corrective actions.", href: "/sheq-audit", icon: ClipboardCheck },
  { name: "Contractor safety", description: "Evaluate contractor history and vetting recommendations.", href: "/contractor-safety", icon: HardHat },
  { name: "Emergency preparedness", description: "Build realistic emergency drill scenarios.", href: "/emergency-preparedness", icon: Siren },
] as const;

export default function AiRecommendationsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Gemini-powered assistance</p>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Sparkles className="h-7 w-7 text-primary" aria-hidden="true" /> AI Safety Hub
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          One place for SHEQ assistance. Each specialist tool opens in its existing workflow,
          so your records, reviews and approvals remain in their proper modules.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Specialist AI tools">
        {capabilities.map(({ name, description, href, icon: Icon }) => (
          <Link href={href} key={href} className="group rounded-2xl bg-card p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-xl bg-blue-50 p-2.5 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-semibold">{name}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Generate safety recommendations</CardTitle>
          <CardDescription>Provide incident and inspection summaries for contextual, actionable suggestions.</CardDescription>
        </CardHeader>
        <CardContent>
          <RecommendationGenerator />
        </CardContent>
      </Card>
      <p className="text-xs leading-relaxed text-muted-foreground">
        AI-generated guidance is advisory, not a substitute for qualified SHEQ judgement, site verification
        or applicable regulations. Remove unnecessary personal or medical information before submitting reports.
      </p>
    </div>
  );
}
