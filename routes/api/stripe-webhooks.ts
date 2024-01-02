// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { type Handlers } from "$fresh/server.ts";
import { STATUS_CODE } from "std/http/status.ts";
import { isStripeEnabled, stripe } from "@/utils/stripe.ts";
import Stripe from "stripe";
import { getUserByStripeCustomer, updateUser } from "@/utils/db.ts";
import { BadRequestError } from "@/utils/http.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();
export const handler: Handlers = {
  /**
   * Handles Stripe webhooks requests when a user subscribes
   * (`customer.subscription.created`) or cancels
   * (`customer.subscription.deleted`) the "Premium Plan".
   *
   * @see {@link https://github.com/stripe-samples/stripe-node-deno-samples/blob/2d571b20cd88f1c1f02185483729a37210484c68/webhook-signing/main.js}
   */
  async POST(req) {
    if (!isStripeEnabled()) throw new Deno.errors.NotFound("Not Found");

    /** @see {@link https://stripe.com/docs/webhooks#verify-events} */
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (signature === null) {
      throw new BadRequestError("`Stripe-Signature` header is missing");
    }
    const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (signingSecret === undefined) {
      throw new Error(
        "`STRIPE_WEBHOOK_SECRET` environment variable is not set",
      );
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        signingSecret,
        undefined,
        cryptoProvider,
      );
    } catch (error) {
      throw new BadRequestError(error.message);
    }

    // @ts-ignore: Property 'customer' actually does exist on type 'Object'
    const { customer } = event.data.object;

    switch (event.type) {
      case "customer.subscription.created": {
        const user = await getUserByStripeCustomer(customer);
        if (user === null) {
          throw new Deno.errors.NotFound("User not found");
        }

        await updateUser({ ...user, isSubscribed: true });
        return new Response(null, { status: STATUS_CODE.Created });
      }
      case "customer.subscription.deleted": {
        const user = await getUserByStripeCustomer(customer);
        if (user === null) {
          throw new Deno.errors.NotFound("User not found");
        }

        await updateUser({ ...user, isSubscribed: false });
        return new Response(null, { status: STATUS_CODE.Accepted });
      }
      default: {
        throw new BadRequestError("Event type not supported");
      }
    }
  },
};
