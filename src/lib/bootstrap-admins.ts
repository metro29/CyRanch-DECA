/** Emails that must always be treated as admin (fixes broken profile/RLS). */
const DEFAULT_BOOTSTRAP = ["armaan.belani@gmail.com"];

function bootstrapSet(): Set<string> {
  const fromEnv = (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_BOOTSTRAP, ...fromEnv].map((e) => e.toLowerCase()));
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return bootstrapSet().has(email.trim().toLowerCase());
}
