import type { Handlers } from "$fresh/server.ts";
import { stripe } from "@/utils/stripe.ts";
import { supabaseAdminClient } from "@/utils/supabase.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/utils/supabase_types.ts";

/**
 * Ensures that the Supabase request is authenticated based on the `API_ROUTE_SECRET` header.
 *
 * This function can be reused where in other Supabase webhook handlers.
 */
function hasRouteSecret(request: Request) {
  return new URL(request.url).searchParams.get("API_ROUTE_SECRET") ===
    Deno.env.get("API_ROUTE_SECRET");
}

interface SetStripeCustomerIdConfig {
  userId: string;
  stripeCustomerId: string;
}

export async function setStripeCustomerId(
  supabaseClient: SupabaseClient<Database>,
  { userId, stripeCustomerId }: SetStripeCustomerIdConfig,
) {
  await supabaseClient
    .from("customers")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("user_id", userId)
    .throwOnError();
}

export const handler: Handlers = {
  /**
   * This handler handles Supabase webhook when an insert event is triggered on the `users_customers` table.
   * A HTTP parameter of key `API_ROUTE_SECRET` and value of that in the `.env` file must be set.
   */
  async POST(request) {
    if (!hasRouteSecret(request)) {
      await request.body?.cancel();
      return new Response(null, { status: 401 });
    }

    const { record: { user_id } } = await request.json();
    const { data } = await supabaseAdminClient.auth.admin.getUserById(user_id);

    const customer = await stripe.customers.create({
      email: data.user!.email,
    });

    await setStripeCustomerId(supabaseAdminClient, {
      userId: user_id,
      stripeCustomerId: customer.id,
    });

    return Response.json(null, { status: 201 });
  },
};
