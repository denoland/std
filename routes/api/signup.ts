import type { Handlers } from "$fresh/server.ts";
import { AUTHENTICATED_REDIRECT_PATH } from "@/constants.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { assert } from "std/testing/asserts.ts";
import { stripe } from "@/utils/stripe.ts";

export const handler: Handlers = {
  async POST(request) {
    const form = await request.formData();
    const email = form.get("email");
    const password = form.get("password");

    assert(typeof email === "string");
    assert(typeof password === "string");

    const headers = new Headers();

    // 1. Create a Stripe account ready for a billing session later.
    const { id } = await stripe.customers.create({ email });

    // 2. Create a Supabase user with the Stripe customer ID as metadata
    const supabaseClient = createSupabaseClient(request.headers, headers);
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { stripe_customer_id: id } },
    });

    let redirectUrl = new URL(request.url).searchParams.get("redirect_url") ??
      AUTHENTICATED_REDIRECT_PATH;
    if (error) {
      redirectUrl = `/signup?error=${encodeURIComponent(error.message)}`;
    }

    headers.set("location", redirectUrl);

    return new Response(null, { headers, status: 302 });
  },
};
