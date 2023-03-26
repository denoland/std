import type { Database } from "./supabase_types.ts";
import { createServerSupabaseClient } from "@supabase/auth-helpers-shared";
import { getCookies, setCookie } from "std/http/cookie.ts";
import { createClient } from "@supabase/supabase-js";

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

export function createSupabaseClient(
  requestHeaders: Headers,
  responseHeaders?: Headers,
) {
  return createServerSupabaseClient<Database>({
    supabaseUrl: Deno.env.get("SUPABASE_URL")!,
    supabaseKey: Deno.env.get("SUPABASE_ANON_KEY")!,
    getRequestHeader: (key) => requestHeaders.get(key) ?? undefined,
    getCookie: (name) => {
      const cookie = getCookies(requestHeaders)[name] ?? "";
      return decodeURIComponent(cookie);
    },
    setCookie: (name, value, options) => {
      if (responseHeaders) {
        setCookie(responseHeaders, {
          name,
          value: encodeURIComponent(value),
          ...options,
          sameSite: "Lax",
          httpOnly: false,
        });
      }
    },
  });
}

// Required to bypass Row Level Security (RLS)
export const supabaseAdminClient = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABSE_SERVICE_KEY")!,
);
