import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const platform = String(body.platform ?? "").trim();
  const url = String(body.url ?? "").trim();

  if (!platform || !url) {
    return NextResponse.json(
      { error: "Platform and URL are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("club_socials")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  const maxOrder = existing?.[0]?.display_order ?? -1;

  const { data, error } = await admin
    .from("club_socials")
    .insert({
      platform,
      url,
      label: body.label?.trim() || null,
      display_order: maxOrder + 1,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ social: data });
}
