// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { stripe } from "@/utils/stripe.ts";
import { DashboardState } from "./_middleware.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, DashboardState> = {
  async GET(request, ctx) {
    const customer = await ctx.state.createOrGetCustomer();
    const { url } = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: new URL(request.url).origin + "/dashboard",
    });

    return new Response(null, {
      headers: {
        location: url,
      },
      status: 302,
    });
  },
};
