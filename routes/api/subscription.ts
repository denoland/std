import type { Handlers } from "$fresh/server.ts";
import { stripe } from "@/utils/stripe.ts";
import { Stripe } from "stripe";
import { supabaseAdminClient } from "@/utils/supabase.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

export const handler: Handlers = {
  /**
   * This handler handles Stripe webhooks for the following events:
   * 1. customer.subscription.created (when a user subscribes to the premium plan)
   * 2. customer.subscription.deleted (when a user cancels the premium plan)
   *
   * @todo Create another subscription plan and implement `customer.subscription.deleted` event type.
   */
  async POST(request) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;
    const signingSecret = Deno.env.get("STRIPE_SIGNING_SECRET")!;

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      signingSecret,
      undefined,
      cryptoProvider,
    );

    switch (event.type) {
      case "customer.subscription.created": {
        await supabaseAdminClient
          .from("users_subscriptions")
          .update({ is_subscribed: true })
          // @ts-ignore: Property 'customer' actually does exist on type 'Object'
          .eq("stripe_customer_id", event.data.object.customer)
          .throwOnError();
        return new Response(null, { status: 201 });
      }
      case "customer.subscription.deleted": {
        await supabaseAdminClient
          .from("users_subscriptions")
          .update({ is_subscribed: false })
          // @ts-ignore: Property 'customer' actually does exist on type 'Object'
          .eq("stripe_customer_id", event.data.object.customer)
          .throwOnError();
        return new Response(null, { status: 202 });
      }
      default: {
        console.error(`Event type not supported: ${event.type}`);
        return new Response(null, { status: 400 });
      }
    }
  },
};
