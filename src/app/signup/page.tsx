"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveUserHomePath } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { GRADES } from "@/types/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (!grade) {
      setError("Please select your grade.");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, grade },
      },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      toast.error(authError.message);
      return;
    }

    if (data.user && !data.session) {
      setSuccess(true);
      toast.success("Check your email to confirm your account");
      return;
    }

    toast.success("Account created");
    const [{ data: settings }, { data: application }] = await Promise.all([
      supabase
        .from("app_settings")
        .select("applications_open")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("applications")
        .select("status")
        .eq("user_id", data.user!.id)
        .maybeSingle(),
    ]);

    router.push(
      resolveUserHomePath({
        role: "user",
        applicationStatus: (application?.status as ApplicationStatus) ?? null,
        applicationsOpen: settings?.applications_open ?? false,
      })
    );
    router.refresh();
  };

  if (success) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
        <Card className="w-full text-center animate-slide-up">
          <h1 className="text-xl font-bold text-deca-navy">Check your email</h1>
          <p className="mt-2 text-sm text-deca-navy/60">
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account, then sign in to apply.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button>Go to login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full animate-slide-up shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-deca-navy">Create account</h1>
          <p className="mt-1 text-sm text-deca-navy/60">
            All new accounts are assigned the <strong>user</strong> role. Admins
            are promoted manually in the database.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Input
            id="fullName"
            label="Full name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jordan Smith"
          />
          <Input
            id="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-deca-navy">
              Grade
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={cn(
                    "rounded-lg border-2 py-2 text-sm font-semibold transition-all",
                    grade === g
                      ? "border-deca-gold bg-deca-gold/10"
                      : "border-deca-navy/10"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <Input
            id="password"
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-deca-navy/60">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-deca-gold-muted hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
