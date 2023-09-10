// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import type { SignedInState } from "@/middleware/session.ts";
import { redirect } from "@/utils/http.ts";
import {
  getStripePremiumPlanPriceId,
  isStripeEnabled,
  stripe,
} from "@/utils/stripe.ts";

export default async function AccountUpgradePage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
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
}
