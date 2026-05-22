import { Card } from "@/components/ui/card";
import type { AppSettings } from "@/types/database";
import { CalendarOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ApplicationsClosed({
  settings,
  hasSubmitted,
}: {
  settings: AppSettings;
  hasSubmitted?: boolean;
}) {
  return (
    <div className="mx-auto max-w-lg animate-fade-in py-16 text-center">
      <Card className="p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-deca-navy/5">
          <CalendarOff className="h-7 w-7 text-deca-navy/50" />
        </div>
        <h1 className="text-xl font-bold text-deca-navy">Applications closed</h1>
        <p className="mt-3 text-sm leading-relaxed text-deca-navy/60">
          {settings.closed_message}
        </p>
        {hasSubmitted && (
          <Link href="/status" className="mt-6 inline-block">
            <Button>View your application status</Button>
          </Link>
        )}
      </Card>
    </div>
  );
}
