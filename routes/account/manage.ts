// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { defineRoute } from "$fresh/server.ts";
import type { SignedInState } from "@/plugins/session.ts";
import { redirect } from "@/utils/http.ts";
import { isStripeEnabled, stripe } from "@/utils/stripe.ts";

export default defineRoute<SignedInState>(async (_req, ctx) => {
  const { sessionUser } = ctx.state;
  if (!isStripeEnabled() || sessionUser.stripeCustomerId === undefined) {
    return ctx.renderNotFound();
  }

  const { url } = await stripe.billingPortal.sessions.create({
    customer: sessionUser.stripeCustomerId,
    return_url: ctx.url.origin + "/account",
  });
  return redirect(url);
});
