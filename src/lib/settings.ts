import type { AppSettings } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  applications_open: false,
  season_label: "Officer Applications",
  closed_message:
    "Applications are not open at this time. Check back when your chapter announces the next officer cycle.",
  updated_at: new Date().toISOString(),
  updated_by: null,
};

export async function getAppSettings(
  supabase: SupabaseClient
): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;
  return data as AppSettings;
}
