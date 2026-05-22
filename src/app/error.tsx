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

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-deca-navy">Something went wrong</h1>
      <p className="mt-2 text-sm text-deca-navy/60">
        {isDev ? (
          <>
            Try refreshing. For local dev cache issues, run{" "}
            <code className="text-deca-gold-muted">npm run dev:clean</code>.
          </>
        ) : (
          <>
            Try refreshing the page. If it keeps happening, check Vercel env vars
            (Supabase URL, anon key, service role key) and redeploy.
          </>
        )}
      </p>
      {isDev && error.message && (
        <p className="mt-3 max-w-full break-words text-left text-xs text-red-600">
          {error.message}
        </p>
      )}
      <Button className="mt-6" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
