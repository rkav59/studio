import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before using SHEiQpro.",
    );
  client = createClient(url, key, {
    auth: { flowType: "pkce", detectSessionInUrl: true },
  });
  return client;
}

// Lazy access permits builds without connecting to a project. No privileged key is used here.
export const db = {
  get client() {
    return getSupabase();
  },
};
export const storage = db;
