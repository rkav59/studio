
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function ContractorSafetyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Contractor Safety Management</h1>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-60 w-full">
            <Image 
                src="https://placehold.co/1200x400.png" 
                alt="Contractors working safely on site" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="construction safety"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
                <h2 className="text-2xl font-semibold text-white font-headline">Manage Third-Party Risk</h2>
                <p className="text-sm text-neutral-300">Oversee contractor safety from vetting to on-site work.</p>
            </div>
        </div>
        <CardContent className="pt-6">
            <p className="text-muted-foreground">
                This module facilitates the management of contractor safety, including pre-qualification/vetting, induction training, on-site supervision, and a permit-to-work system. 
                Ensure contractors adhere to your safety standards.
            </p>
            <div className="mt-6 p-6 border rounded-lg bg-secondary/30">
                <h3 className="font-semibold text-lg">Contractor Lifecycle Management</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Future enhancements will provide:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Contractor pre-qualification portal with document management (insurance, certifications).</li>
                    <li>Online safety induction training module with completion tracking.</li>
                    <li>Digital Permit-to-Work (PTW) system: generation, approval, and tracking.</li>
                    <li>On-site supervision checklists and performance monitoring tools.</li>
                    <li>Contractor incident logging and investigation linkage.</li>
                    <li>Contractor performance reviews and scoring.</li>
                    <li>AI-assisted vetting based on historical safety data (potential).</li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
