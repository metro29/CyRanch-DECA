import { getOwnProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await getOwnProfile(supabase, user, "role");

  if (profile?.role === "admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot be deleted from settings. Contact another admin." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: files } = await admin.storage.from("resumes").list(user.id);
    if (files?.length) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from("resumes").remove(paths);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
