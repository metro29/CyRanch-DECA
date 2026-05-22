"use client";

/**
 * Root error UI — must define its own <html> and <body>.
 * Keep this file minimal to avoid RSC client manifest issues on Windows.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          Stop the dev server, run{" "}
          <strong>npm run dev:clean</strong>, then reload.
        </p>
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
