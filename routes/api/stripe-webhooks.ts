// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { stripe } from "@/utils/payments.ts";
import Stripe from "stripe";
import { getUserByStripeCustomer, updateUser } from "@/utils/db.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

export const handler: Handlers = {
  /**
   * This handler handles Stripe webhooks for the following events:
   * 1. customer.subscription.created (when a user subscribes to the premium plan)
   * 2. customer.subscription.deleted (when a user cancels the premium plan)
   */
  async POST(req, ctx) {
    if (stripe === undefined) return ctx.renderNotFound();

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
      console.error(error.message);
      return new Response(error.message, { status: 400 });
    }

    // @ts-ignore: Property 'customer' actually does exist on type 'Object'
    const { customer } = event.data.object;

    switch (event.type) {
      case "customer.subscription.created": {
        const user = await getUserByStripeCustomer(customer);
        if (!user) return new Response(null, { status: 400 });
        await updateUser({ ...user, isSubscribed: true });
        return new Response(null, { status: 201 });
      }
      case "customer.subscription.deleted": {
        const user = await getUserByStripeCustomer(customer);
        if (!user) return new Response(null, { status: 400 });
        await updateUser({ ...user, isSubscribed: false });
        return new Response(null, { status: 202 });
      }
      default: {
        const message = `Event type not supported: ${event.type}`;
        console.error(message);
        return new Response(message, { status: 400 });
      }
    }
  },
};
