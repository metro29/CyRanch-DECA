"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  Calendar,
  FileText,
  Settings,
  Share2,
  Users,
  type LucideIcon,
} from "lucide-react";

const SHELL_ICONS = {
  book: BookOpen,
  calendar: Calendar,
  file: FileText,
  settings: Settings,
  share: Share2,
  users: Users,
} as const;

export type PageShellIcon = keyof typeof SHELL_ICONS;

interface PageShellProps {
  title: string;
  description?: string;
  icon?: PageShellIcon;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  description,
  icon,
  children,
  className,
}: PageShellProps) {
  const Icon: LucideIcon | null = icon ? SHELL_ICONS[icon] : null;

  return (
    <div className={cn("animate-fade-in", className)}>
      <div className="border-b border-deca-navy/10 bg-white dark:border-white/10 dark:bg-deca-navy-light">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-deca-navy dark:bg-deca-gold/20">
                <Icon className="h-6 w-6 text-deca-gold" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-deca-navy dark:text-white">
                {title}
              </h1>
              {description && (
                <p className="mt-2 max-w-2xl text-deca-navy/60 dark:text-white/60">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}
