// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { stripe } from "@/utils/stripe.ts";
import { STRIPE_PREMIUM_PLAN_PRICE_ID } from "@/utils/constants.ts";
import type { AccountState } from "./_middleware.ts";

export const handler: Handlers<null, AccountState> = {
  async GET(req, ctx) {
    const customer = await ctx.state.createOrGetCustomer();
    const { url } = await stripe.checkout.sessions.create({
      success_url: new URL(req.url).origin + "/account",
      customer: customer.stripe_customer_id!,
      line_items: [
        {
          price: STRIPE_PREMIUM_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
    });

    return new Response(null, {
      headers: {
        location: url!,
      },
      status: 302,
    });
  },
};
