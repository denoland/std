// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { stripe } from "@/utils/payments.ts";
import type { AccountState } from "./_middleware.ts";
import { redirect } from "@/utils/redirect.ts";

const STRIPE_PREMIUM_PLAN_PRICE_ID = Deno.env.get(
  "STRIPE_PREMIUM_PLAN_PRICE_ID",
);

export const handler: Handlers<null, AccountState> = {
  async GET(req, ctx) {
    if (!STRIPE_PREMIUM_PLAN_PRICE_ID || !ctx.state.sessionId) {
      return ctx.renderNotFound();
    }

    const { url } = await stripe.checkout.sessions.create({
      success_url: new URL(req.url).origin + "/account",
      customer: ctx.state.user.stripeCustomerId,
      line_items: [
        {
          price: STRIPE_PREMIUM_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
    });

    return redirect(url!);
  },
};
