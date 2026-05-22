"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          padding: 40,
          background: "#f8f6f1",
          color: "#0a1628",
        }}
      >
        <h1 style={{ fontSize: "1.5rem" }}>Something went wrong</h1>
        <p style={{ color: "#666", maxWidth: 480 }}>
          {isDev
            ? "Stop the dev server, run npm run dev:clean, then reload."
            : "Refresh the page. If this persists, confirm Supabase env vars are set on Vercel and redeploy."}
        </p>
        {error?.message && (
          <pre
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#b91c1c",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.message}
          </pre>
        )}
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 16,
            padding: "10px 20px",
            background: "#0a1628",
            color: "#c9a227",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
