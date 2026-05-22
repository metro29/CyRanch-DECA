import { SuspendedCard } from "@/components/suspended/suspended-card";
import { getOwnProfile } from "@/lib/profile.server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SuspendedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await getOwnProfile(supabase, user, "status");

  if (profile?.status !== "suspended") redirect("/apply");

  return <SuspendedCard />;
}
