// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Database } from "./supabase_types.ts";
import { createServerSupabaseClient } from "@supabase/auth-helpers-shared";
import { getCookies, setCookie } from "std/http/cookie.ts";
import { createClient } from "@supabase/supabase-js";
import type { Stripe } from "stripe";

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

export function createSupabaseClient(
  requestHeaders: Headers,
  responseHeaders?: Headers,
) {
  return createServerSupabaseClient<Database>({
    supabaseUrl: Deno.env.get("SUPABASE_API_URL")!,
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
  Deno.env.get("SUPABASE_API_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function getCustomer(
  supabaseClient: SupabaseClient,
) {
  const { data } = await supabaseClient
    .from("customers")
    .select()
    .single();
  return data;
}

async function createCustomer(
  supabaseClient: SupabaseClient,
  customer: Database["public"]["Tables"]["customers"]["Insert"],
) {
  const { data } = await supabaseClient
    .from("customers")
    .insert(customer)
    .select()
    .single()
    .throwOnError();
  return data!;
}

export async function createOrGetCustomer(
  supabaseClient: SupabaseClient,
  stripeClient: Stripe,
) {
  const customer = await getCustomer(supabaseClient);
  if (customer) return customer;

  const { data: { user } } = await supabaseClient.auth.getUser();
  const { id } = await stripeClient.customers.create({ email: user!.email });
  return await createCustomer(supabaseClient, {
    stripe_customer_id: id,
    is_subscribed: false,
  });
}
