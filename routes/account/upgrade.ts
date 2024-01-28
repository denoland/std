// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { defineRoute } from "$fresh/server.ts";
import type { SignedInState } from "@/plugins/session.ts";
import { redirect } from "@/utils/http.ts";
import {
  getStripePremiumPlanPriceId,
  isStripeEnabled,
  stripe,
} from "@/utils/stripe.ts";

export default defineRoute<SignedInState>(async (_req, ctx) => {
  if (!isStripeEnabled()) return ctx.renderNotFound();
  const stripePremiumPlanPriceId = getStripePremiumPlanPriceId();
  if (stripePremiumPlanPriceId === undefined) {
    throw new Error(
      '"STRIPE_PREMIUM_PLAN_PRICE_ID" environment variable not set',
    );
  }

  const { url } = await stripe.checkout.sessions.create({
    success_url: ctx.url.origin + "/account",
    customer: ctx.state.sessionUser.stripeCustomerId,
    line_items: [
      {
        price: stripePremiumPlanPriceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
  });
  if (url === null) return ctx.renderNotFound();

  return redirect(url);
});
