import { UsersPanel } from "@/components/dashboard/users-panel";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <UsersPanel
      users={(users ?? []).map((u) => ({
        ...u,
        status: u.status ?? "active",
      }))}
      currentAdminId={user!.id}
    />
  );
}
