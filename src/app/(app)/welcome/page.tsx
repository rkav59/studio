
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Rocket, Sparkles, ArrowRight } from 'lucide-react';
import { SheiqproLogo } from '@/components/icons/sheiqpro-logo';
import { useAuth } from '@/contexts/auth-context';

export default function WelcomePage() {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <div className="flex items-center justify-center min-h-full bg-background p-4">
            <Card className="w-full max-w-2xl text-center shadow-2xl">
                <CardHeader className="items-center">
                    <SheiqproLogo className="h-20 w-20 text-primary mb-4" />
                    <CardTitle className="text-3xl font-bold font-headline">
                        Welcome to SHEiQpro, {user?.displayName || 'User'}!
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground pt-2">
                        Your account has been created and your 14-day free trial has started.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 bg-secondary/50 rounded-lg">
                        <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                            <Sparkles className="h-5 w-5 text-accent"/>
                            What's Included in Your Trial?
                        </h3>
                        <p className="text-muted-foreground mt-2 max-w-prose mx-auto">
                            For the next 14 days, you have full access to all Pro features, including unlimited risk assessments, AI-powered safety insights, contractor management, and more. Explore everything SHEiQpro has to offer to streamline your SHEQ processes.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Card className="flex-1 text-left p-4">
                            <h4 className="font-semibold">Ready to Dive In?</h4>
                            <p className="text-sm text-muted-foreground">Jump straight to your dashboard and start managing your safety program.</p>
                            <Button className="mt-4 w-full sm:w-auto" onClick={() => router.push('/dashboard')}>
                                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        </Card>
                         <Card className="flex-1 text-left p-4">
                            <h4 className="font-semibold">Want to Secure Your Plan?</h4>
                            <p className="text-sm text-muted-foreground">You can upgrade to our Pro plan at any time to ensure uninterrupted access.</p>
                            <Button className="mt-4 w-full sm:w-auto" variant="outline" onClick={() => router.push('/payments')}>
                                View Plans & Upgrade
                            </Button>
                        </Card>
                    </div>

                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground mx-auto">
                        Your trial will end in 14 days. We'll remind you before it expires.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
