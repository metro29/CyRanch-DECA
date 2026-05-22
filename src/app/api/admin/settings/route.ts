import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const applications_open = Boolean(body.applications_open);

  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .update({
      applications_open,
      updated_at: new Date().toISOString(),
      updated_by: auth.user.id,
    })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, applications_open });
}
