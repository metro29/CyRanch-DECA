import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { asHeaderProfile, getOwnProfile } from "@/lib/profile.server";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DECA Officer Application Portal",
  description:
    "Apply for DECA chapter officer positions. Professional application system for emerging leaders.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user: { id: string; email?: string | null } | null = null;
  let profile: ReturnType<typeof asHeaderProfile> = null;
  let applicationStatus: string | null = null;
  let applicationsOpen = false;

  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    user = auth.user;

    if (user) {
      const [{ data: p }, { data: app }, settings] = await Promise.all([
        getOwnProfile(supabase, user, "role, full_name"),
        supabase
          .from("applications")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle(),
        getAppSettings(supabase),
      ]);
      profile = asHeaderProfile(p);
      applicationStatus = app?.status ?? null;
      applicationsOpen = settings.applications_open;
    }
  } catch (err) {
    console.error("[layout] init failed:", err);
  }

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('deca-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <Header
            user={user ? { email: user.email ?? "" } : null}
            profile={profile}
            applicationStatus={applicationStatus}
            applicationsOpen={applicationsOpen}
          />
          <main>{children}</main>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
