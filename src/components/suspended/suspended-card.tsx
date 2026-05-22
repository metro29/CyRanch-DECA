"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserX } from "lucide-react";
import Link from "next/link";

export function SuspendedCard() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-16">
      <Card className="w-full text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <UserX className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-deca-navy dark:text-white">
          Account suspended
        </h1>
        <p className="mt-2 text-sm text-deca-navy/60 dark:text-white/60">
          Your access to the DECA portal has been suspended by an administrator.
          Contact your chapter advisor if you believe this is an error.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button variant="outline">Back to home</Button>
        </Link>
      </Card>
    </div>
  );
}
