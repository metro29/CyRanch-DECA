import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getOwnProfile, resolveIsAdmin } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard");

  const { data: profile } = await getOwnProfile(
    supabase,
    user,
    "role, status, full_name, email"
  );

  if (profile?.status === "suspended") redirect("/suspended");

  if (!resolveIsAdmin(profile?.role, user.email)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto bg-deca-cream/40">
        <div className="border-b border-deca-navy/10 bg-white px-4 py-3 sm:px-6">
          <p className="text-xs text-deca-navy/50">Signed in as admin</p>
          <p className="text-sm font-medium text-deca-navy">
            {profile?.full_name ?? profile?.email}
            <span className="ml-2 text-xs font-normal text-emerald-600">
              · {profile?.role}
            </span>
          </p>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
