import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileStatus } from "@/types/database";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id: targetId } = await params;
  const body = await request.json();
  const status = body.status as ProfileStatus;

  if (status !== "active" && status !== "suspended") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (targetId === auth.user.id && status === "suspended") {
    return NextResponse.json(
      { error: "You cannot suspend your own account" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status })
    .eq("id", targetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status });
}
