import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | undefined;
// Bound network waits, propagate unmount/selection cancellation, and never retry
// mutations automatically. The UI offers an explicit retry for failed reads.
const boundedFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const upstream = init?.signal;
  upstream?.addEventListener("abort", cancel, { once: true });
  if (upstream?.aborted) cancel();
  const timeout = setTimeout(cancel, 15000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    upstream?.removeEventListener("abort", cancel);
  }
};
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  const unavailable =
    "The data service is not configured yet. Please try again later.";
  if (!url || !key) throw new Error(unavailable);
  try {
    client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: boundedFetch },
    });
    return client;
  } catch {
    throw new Error(unavailable);
  }
}
