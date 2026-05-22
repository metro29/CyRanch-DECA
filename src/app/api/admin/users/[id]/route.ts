import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id: targetId } = await params;

  if (targetId === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: files } = await admin.storage.from("resumes").list(targetId);
    if (files?.length) {
      const paths = files.map((f) => `${targetId}/${f.name}`);
      await admin.storage.from("resumes").remove(paths);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(targetId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
