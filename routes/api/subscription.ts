// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { stripe } from "@/utils/stripe.ts";
import { Stripe } from "stripe";
import { supabaseAdminClient } from "@/utils/supabase.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/utils/supabase_types.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();

interface SetCustomerSubscriptionConfig {
  customer: string;
  isSubscribed: boolean;
}

export async function setCustomerSubscription(
  supabaseClient: SupabaseClient<Database>,
  { customer, isSubscribed }: SetCustomerSubscriptionConfig,
) {
  await supabaseClient
    .from("customers")
    .update({ is_subscribed: isSubscribed })
    .eq("stripe_customer_id", customer)
    .throwOnError();
}

export const handler: Handlers = {
  /**
   * This handler handles Stripe webhooks for the following events:
   * 1. customer.subscription.created (when a user subscribes to the premium plan)
   * 2. customer.subscription.deleted (when a user cancels the premium plan)
   */
  async POST(request) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;
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

    switch (event.type) {
      case "customer.subscription.created": {
        await setCustomerSubscription(
          supabaseAdminClient,
          {
            // @ts-ignore: Property 'customer' actually does exist on type 'Object'
            customer: event.data.object.customer,
            isSubscribed: true,
          },
        );
        return new Response(null, { status: 201 });
      }
      case "customer.subscription.deleted": {
        await setCustomerSubscription(
          supabaseAdminClient,
          {
            // @ts-ignore: Property 'customer' actually does exist on type 'Object'
            customer: event.data.object.customer,
            isSubscribed: false,
          },
        );
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
