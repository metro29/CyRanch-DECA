import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { asHeaderProfile, getOwnProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
import type { Metadata } from "next";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: ReturnType<typeof asHeaderProfile> = null;
  let applicationStatus: string | null = null;
  let applicationsOpen = false;

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
