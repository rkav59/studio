
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

interface PasswordChangeSectionProps {
    currentEmail: string;
}

export function PasswordChangeSection({ currentEmail }: PasswordChangeSectionProps) {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // Email state could be added if we want to allow changing it, but for password reset it's usually fixed.
  // const [emailForReset, setEmailForReset] = useState(currentEmail);

  const handlePasswordReset = async () => {
    setIsLoading(true);
    try {
      await resetPassword(currentEmail);
      // Toast is handled within resetPassword context function
    } catch (error: any) {
      // Error toast also handled within context, but can add specific here if needed
      console.error("Password reset request failed on page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="reset-email" className="text-sm text-muted-foreground">Password Reset Email</Label>
        <Input id="reset-email" value={currentEmail} readOnly disabled className="mt-1 bg-muted/50" />
        <p className="text-xs text-muted-foreground mt-1">
          A password reset link will be sent to this email address.
        </p>
      </div>
      <Button onClick={handlePasswordReset} disabled={isLoading} className="w-full sm:w-auto">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Send className="mr-2 h-4 w-4" /> Send Password Reset Email
      </Button>
    </div>
  );
}
