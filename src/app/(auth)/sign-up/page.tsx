
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
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Loader2, Mail, Lock, User as UserIcon, Globe } from "lucide-react";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/ui/combobox";
import { countries } from "@/lib/countries";


const signUpFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  country: z.string({ required_error: "Country is required." }).min(2, { message: "Country is required."}),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], 
});

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      country: "",
    },
  });

  async function onSubmit(data: SignUpFormValues) {
    setLoading(true);
    try {
      await signUp(data.email, data.password, data.fullName, data.country);
      router.push("/welcome"); 
    } catch (error: any) {
      // Error toast is handled by context now
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-center text-foreground">Create Your Account</h2>
      <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
        Join SHEiQpro to manage your safety, health, and environment data.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Full Name</FormLabel>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input placeholder="Full Name" {...field} className="pl-10" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="country"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Country of Operation</FormLabel>
                <Combobox
                  options={countries}
                  value={field.value}
                  onChange={(value) => form.setValue("country", value)}
                  placeholder="Select your country..."
                  searchPlaceholder="Search for a country..."
                />
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
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Confirm Password</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input type="password" placeholder="Confirm Password" {...field} className="pl-10" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account & Start Trial
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or sign up with
          </span>
        </div>
      </div>

      <SocialButtons isSignUp={true} />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
