import type { Handlers } from "$fresh/server.ts";
import { STRIPE_PRICES } from "@/constants.ts";
import { stripe } from "@/utils/stripe.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { assert } from "std/testing/asserts.ts";

export const handler: Handlers = {
  async POST(request) {
    const form = await request.formData();
    const email = form.get("email");
    const password = form.get("password");

    assert(typeof email === "string");
    assert(typeof password === "string");

    const headers = new Headers();
    const supabaseClient = createSupabaseClient(request.headers, headers);

    // 1. Create Stripe customer with the given email
    const { id } = await stripe.customers.create({ email });

    // 2. Get the URL for the initial Stripe billing session to redirect the user to
    const { url } = await stripe.checkout.sessions.create({
      success_url: new URL(request.url).origin + "/todos",
      customer: id,
      line_items: [
        {
          price: STRIPE_PRICES[0],
          quantity: 1,
        },
      ],
      mode: "subscription",
    });

    // 3. Signup the Supabse user with the Stripe customer ID as metadata
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { stripe_customer_id: id } },
    });

    const redirectUrl = error
      ? `/signup?error=${encodeURIComponent(error.message)}`
      : url!;
    headers.set("location", redirectUrl);

    return new Response(null, { headers, status: 302 });
  },
};
