"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveUserHomePath } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus } from "@/types/database";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      toast.error(authError.message);
      return;
    }

    const userId = authData.user?.id ?? "";

    try {
      await fetch("/api/profile/sync", { method: "POST" });
    } catch {
      /* sync optional if service role missing */
    }

    const [{ data: profile }, { data: settings }, { data: application }] =
      await Promise.all([
        supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
        supabase
          .from("app_settings")
          .select("applications_open")
          .eq("id", 1)
          .maybeSingle(),
        supabase
          .from("applications")
          .select("status")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    const dest =
      redirectParam && profile?.role === "admin"
        ? redirectParam.startsWith("/dashboard")
          ? redirectParam
          : "/dashboard"
        : redirectParam && profile?.role !== "admin"
          ? redirectParam
          : resolveUserHomePath({
              role: profile?.role,
              applicationStatus:
                (application?.status as ApplicationStatus) ?? null,
              applicationsOpen: settings?.applications_open ?? false,
            });

    setLoading(false);
    await fetch("/api/profile/sync", { method: "POST" }).catch(() => null);
    toast.success("Signed in");
    router.push(dest);
    router.refresh();
  };

  return (
    <Card className="w-full animate-slide-up shadow-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-deca-navy">Welcome back</h1>
        <p className="mt-1 text-sm text-deca-navy/60">
          Sign in to your DECA portal account
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
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
        <Input
          id="password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-deca-navy/60">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-deca-gold-muted hover:underline"
        >
          Create one
        </Link>
      </p>
    </Card>
  );
}
