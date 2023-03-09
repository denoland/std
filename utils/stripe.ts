import Stripe from "stripe";

export const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")!, {
  apiVersion: "2022-11-15",
  /** Use the Fetch API instead of Node's HTTP client */
  httpClient: Stripe.createFetchHttpClient(),
});
