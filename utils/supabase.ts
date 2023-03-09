import type { Database } from "./supabase_types.ts";
import { createServerSupabaseClient } from "@supabase/auth-helpers-shared";
import { getCookies, setCookie } from "std/http/cookie.ts";

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

export function hasSupabaseAuthToken(headers: Headers) {
  return Boolean(getCookies(headers)["supabase-auth-token"]);
}

export function createSupabaseClient(
  requestHeaders: Headers,
  responseHeaders?: Headers,
) {
  return createServerSupabaseClient<Database>({
    supabaseUrl: Deno.env.get("SUPABASE_URL")!,
    supabaseKey: Deno.env.get("SUPABASE_ANON_KEY")!,
    getRequestHeader: (key) => requestHeaders.get(key) ?? undefined,
    getCookie: (name) =>
      decodeURIComponent(getCookies(requestHeaders)[name] ?? ""),
    setCookie: (name, value, options) => {
      if (responseHeaders) {
        setCookie(responseHeaders, {
          name,
          value: encodeURIComponent(value),
          ...options,
          sameSite: "Lax",
          httpOnly: true,
        });
      }
    },
  });
}
