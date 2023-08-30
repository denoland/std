// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { stripe } from "@/utils/payments.ts";
import type { SignedInState } from "@/utils/middleware.ts";
import { redirect } from "@/utils/http.ts";

export default async function AccountManagePage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  if (stripe === undefined || ctx.state.user.stripeCustomerId === undefined) {
    return await ctx.renderNotFound();
  }

  const { url } = await stripe.billingPortal.sessions.create({
    customer: ctx.state.user.stripeCustomerId,
    return_url: ctx.url.origin + "/account",
  });

  return redirect(url);
}
