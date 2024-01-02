// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import Stripe from "stripe";
import { AssertionError } from "std/assert/assertion_error.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

export function isStripeEnabled() {
  return Deno.env.has("STRIPE_SECRET_KEY");
}

export function getStripePremiumPlanPriceId() {
  return Deno.env.get(
    "STRIPE_PREMIUM_PLAN_PRICE_ID",
  );
}

export const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
  // Use the Fetch API instead of Node's HTTP client.
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * Asserts that the value is strictly a {@linkcode Stripe.Price} object.
 *
 * @example
 * ```ts
 * import { assertIsPrice } from "@/utils/stripe.ts";
 *
 * assertIsPrice(undefined); // Throws AssertionError
 * assertIsPrice(null); // Throws AssertionError
 * assertIsPrice("not a price"); // Throws AssertionError
 * ```
 */
export function assertIsPrice(value: unknown): asserts value is Stripe.Price {
  if (value === undefined || value === null || typeof value === "string") {
    throw new AssertionError(
      "Default price must be of type `Stripe.Price`. Please run the `deno task init:stripe` as the README instructs.",
    );
  }
}
