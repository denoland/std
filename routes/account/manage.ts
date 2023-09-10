// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import type { SignedInState } from "@/middleware/session.ts";
import { redirect } from "@/utils/http.ts";
import { isStripeEnabled, stripe } from "@/utils/stripe.ts";

export default async function AccountManagePage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  const { sessionUser } = ctx.state;
  if (!isStripeEnabled() || sessionUser.stripeCustomerId === undefined) {
    return ctx.renderNotFound();
  }

  const { url } = await stripe.billingPortal.sessions.create({
    customer: sessionUser.stripeCustomerId,
    return_url: ctx.url.origin + "/account",
  });
  return redirect(url);
}
