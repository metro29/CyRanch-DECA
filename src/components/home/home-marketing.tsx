"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

interface HomeMarketingProps {
  seasonLabel: string;
  applicationsOpen: boolean;
  closedMessage: string;
  ctaHref: string;
  ctaLabel: string;
  showLoginButton: boolean;
}

export function HomeMarketing({
  seasonLabel,
  applicationsOpen,
  closedMessage,
  ctaHref,
  ctaLabel,
  showLoginButton,
}: HomeMarketingProps) {
  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden bg-deca-navy">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-deca-gold)_0%,_transparent_50%)] opacity-10" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-deca-gold/40 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-deca-gold/30 bg-deca-gold/10 px-4 py-1.5 text-sm text-deca-gold-light">
              <Sparkles className="h-4 w-4" />
              {applicationsOpen
                ? `${seasonLabel} — Now open`
                : `${seasonLabel} — Closed`}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Lead Your Chapter.
              <span className="mt-2 block text-gradient-gold">
                Shape DECA&apos;s Future.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              {applicationsOpen
                ? "Submit your yearly officer application through our secure portal."
                : closedMessage}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href={ctaHref}>
                <Button size="lg" className="min-w-[160px]">
                  {ctaLabel}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              {showLoginButton && (
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                  >
                    Log in
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Secure",
              desc: "Your data is protected with authentication and row-level security.",
            },
            {
              icon: Award,
              title: "Once per year",
              desc: "One application per member when your chapter opens the window.",
            },
            {
              icon: Sparkles,
              title: "Track status",
              desc: "See under review, accepted, or rejected after you submit.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-deca-navy/8 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-deca-navy-light"
            >
              <f.icon className="mb-3 h-6 w-6 text-deca-gold" />
              <h3 className="font-semibold text-deca-navy dark:text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-deca-navy/60 dark:text-white/60">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
