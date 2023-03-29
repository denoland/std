import type { Handlers } from "$fresh/server.ts";
import { stripe } from "@/utils/stripe.ts";
import { Stripe } from "stripe";
import { supabaseAdminClient } from "@/utils/supabase.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

async function changeCustomerSubscription(
  customer: string,
  isSubscribed: boolean,
) {
  await supabaseAdminClient
    .from("subscriptions")
    .update({ is_subscribed: isSubscribed })
    .eq("stripe_customer_id", customer)
    .throwOnError();
}

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

    switch (event.type) {
      case "customer.subscription.created": {
        // @ts-ignore: Property 'customer' actually does exist on type 'Object'
        await changeCustomerSubscription(event.data.object.customer, true);
        return new Response(null, { status: 201 });
      }
      case "customer.subscription.deleted": {
        // @ts-ignore: Property 'customer' actually does exist on type 'Object'
        await changeCustomerSubscription(event.data.object.customer, false);
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
