"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-deca-navy">Something went wrong</h1>
      <p className="mt-2 text-sm text-deca-navy/60">
        Try refreshing the page. If the problem continues, stop the dev server,
        delete the <code className="text-deca-gold-muted">.next</code> folder, and
        run <code className="text-deca-gold-muted">npm run dev:clean</code>.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
