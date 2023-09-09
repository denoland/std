// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { isStripeEnabled, stripe } from "@/utils/stripe.ts";
import type { SignedInState } from "@/middleware/session.ts";
import { redirect } from "@/utils/http.ts";
import { createHttpError } from "std/http/http_errors.ts";
import { Status } from "std/http/http_status.ts";

const STRIPE_PREMIUM_PLAN_PRICE_ID = Deno.env.get(
  "STRIPE_PREMIUM_PLAN_PRICE_ID",
);

export default async function AccountUpgradePage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  if (!isStripeEnabled()) throw createHttpError(Status.NotFound);
  if (STRIPE_PREMIUM_PLAN_PRICE_ID === undefined) {
    throw new Error(
      '"STRIPE_PREMIUM_PLAN_PRICE_ID" environment variable not set',
    );
  }

  const { url } = await stripe.checkout.sessions.create({
    success_url: ctx.url.origin + "/account",
    customer: ctx.state.sessionUser.stripeCustomerId,
    line_items: [
      {
        price: STRIPE_PREMIUM_PLAN_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "subscription",
  });
  if (url === null) throw createHttpError(Status.NotFound);

  return redirect(url);
}
