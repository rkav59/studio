import "server-only";
import { createClient } from "@supabase/supabase-js";
export async function verifiedClient(accessToken: string) {
  if (!accessToken) throw new Error("Sign in to continue.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user)
    throw new Error("Your session has expired. Sign in again.");
  return { client, user: data.user };
}
