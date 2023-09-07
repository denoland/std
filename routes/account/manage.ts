// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { stripe } from "@/utils/stripe.ts";
import type { SignedInState } from "@/middleware/session.ts";
import { redirect } from "@/utils/http.ts";
import { errors } from "std/http/http_errors.ts";

export default async function AccountManagePage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  if (stripe === undefined) throw new errors.NotFound();

  const { sessionUser } = ctx.state;
  if (sessionUser.stripeCustomerId === undefined) {
    throw new errors.NotFound("User does not have a Stripe customer ID");
  }

  const { url } = await stripe.billingPortal.sessions.create({
    customer: sessionUser.stripeCustomerId,
    return_url: ctx.url.origin + "/account",
  });
  return redirect(url);
}
