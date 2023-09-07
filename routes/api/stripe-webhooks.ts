// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Handlers, Status } from "$fresh/server.ts";
import { isStripeEnabled, stripe } from "@/utils/stripe.ts";
import Stripe from "stripe";
import { getUserByStripeCustomer, updateUser } from "@/utils/db.ts";
import { errors } from "std/http/http_errors.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

export const handler: Handlers = {
  /**
   * This handler handles Stripe webhooks for the following events:
   * 1. customer.subscription.created (when a user subscribes to the premium plan)
   * 2. customer.subscription.deleted (when a user cancels the premium plan)
   */
  async POST(req) {
    if (!isStripeEnabled()) throw new errors.NotFound();

    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;
    const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

    let event!: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        signingSecret,
        undefined,
        cryptoProvider,
      );
    } catch (error) {
      console.error(error);
      throw new errors.BadRequest();
    }

    // @ts-ignore: Property 'customer' actually does exist on type 'Object'
    const { customer } = event.data.object;

    switch (event.type) {
      case "customer.subscription.created": {
        const user = await getUserByStripeCustomer(customer);
        if (user === null) throw new errors.NotFound("User not found");
        await updateUser({ ...user, isSubscribed: true });
        return new Response(null, { status: Status.Created });
      }
      case "customer.subscription.deleted": {
        const user = await getUserByStripeCustomer(customer);
        if (user === null) throw new errors.NotFound("User not found");
        await updateUser({ ...user, isSubscribed: false });
        return new Response(null, { status: Status.Accepted });
      }
      default: {
        throw new errors.BadRequest("Event type not supported");
      }
    }
  },
};
