import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const starts_at = body.starts_at as string | undefined;

  if (!title || !starts_at) {
    return NextResponse.json(
      { error: "Title and start date are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("calendar_events")
    .insert({
      title,
      description: body.description?.trim() || null,
      location: body.location?.trim() || null,
      starts_at,
      ends_at: body.ends_at || null,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data });
}
