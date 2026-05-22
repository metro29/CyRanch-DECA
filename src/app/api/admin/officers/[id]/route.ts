import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: officer } = await admin
    .from("officers")
    .select("image_path")
    .eq("id", id)
    .single();

  if (officer?.image_path) {
    await admin.storage.from("officer-photos").remove([officer.image_path]);
  }

  const { error } = await admin.from("officers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
