import type { Handlers } from "$fresh/server.ts";
import { stripe } from "@/utils/stripe.ts";
import { supabaseAdminClient } from "@/utils/supabase.ts";
import { assert } from "std/testing/asserts.ts";

/**
 * Ensures that the Supabase request is authenticated based on the `API_ROUTE_SECRET` header.
 *
 * This function can be reused where in other Supabase webhook handlers.
 */
function isSupabaseRequestAuthenticated(request: Request) {
  return new URL(request.url).searchParams.get("API_ROUTE_SECRET") ===
    Deno.env.get("API_ROUTE_SECRET");
}

export const handler: Handlers = {
  /**
   * This handler handles Supabase webhook when an insert event is triggered on the `users_customers` table.
   * A HTTP parameter of key `API_ROUTE_SECRET` and value of that in the `.env` file must be set.
   */
  async POST(request) {
    if (!isSupabaseRequestAuthenticated(request)) {
      await request.body?.cancel();
      return new Response(null, { status: 401 });
    }

    const { record: { user_id } } = await request.json();
    const { data } = await supabaseAdminClient.auth.admin.getUserById(user_id);
    assert(data.user?.email);

    const customer = await stripe.customers.create({
      email: data.user?.email,
    });

    await supabaseAdminClient
      .from("users_subscriptions")
      .update({ stripe_customer_id: customer.id })
      .eq("user_id", user_id)
      .throwOnError();

    return Response.json(null, { status: 201 });
  },
};
