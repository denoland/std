// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { stripe } from "@/utils/payments.ts";
import type { SignedInState } from "@/utils/middleware.ts";
import { redirect } from "@/utils/http.ts";

const STRIPE_PREMIUM_PLAN_PRICE_ID = Deno.env.get(
  "STRIPE_PREMIUM_PLAN_PRICE_ID",
);

export default async function AccountUpgradePage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  if (
    !STRIPE_PREMIUM_PLAN_PRICE_ID || !ctx.state.sessionId ||
    stripe === undefined
  ) {
    return await ctx.renderNotFound();
  }

  const { url } = await stripe.checkout.sessions.create({
    success_url: ctx.url.origin + "/account",
    customer: ctx.state.user.stripeCustomerId,
    line_items: [
      {
        price: STRIPE_PREMIUM_PLAN_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "subscription",
  });
  if (url === null) return await ctx.renderNotFound();

  return redirect(url);
}
