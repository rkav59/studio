
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Loader2, Mail, Lock } from "lucide-react";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Separator } from "@/components/ui/separator";

const signInFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type SignInFormValues = z.infer<typeof signInFormSchema>;

export default function SignInPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);


  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInFormValues) {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Signed In Successfully",
        description: "Welcome back!",
      });
      router.push("/dashboard"); // Redirect to dashboard after successful login
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({ title: "Email Required", description: "Please enter your email address to reset password.", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({ title: "Password Reset Email Sent", description: "Check your inbox for password reset instructions." });
    } catch (error: any) {
      toast({ title: "Error Sending Reset Email", description: error.message, variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };


  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-center text-foreground">Welcome Back</h2>
      <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
        Sign in to access your SHEiQpro dashboard.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Email</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input type="email" placeholder="Email address" {...field} className="pl-10" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Password</FormLabel>
                 <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-right">
        <Input 
            type="email" 
            placeholder="Enter email for password reset" 
            value={resetEmail} 
            onChange={(e) => setResetEmail(e.target.value)} 
            className="text-sm mb-2"
        />
        <Button variant="link" onClick={handlePasswordReset} className="text-sm px-0" disabled={resetLoading}>
            {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Forgot Password?
        </Button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <SocialButtons />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
