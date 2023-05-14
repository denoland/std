// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import Stripe from "stripe";

/** This constant allows preview deployments to successfully start up, making everything outside of the dashboard viewable. */
const DUMMY_SECRET_KEY =
  "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

if (!Deno.env.get("STRIPE_SECRET_KEY")) {
  console.warn(
    "`STRIPE_SECRET_KEY` environment variable is not defined. Dummy Stripe API key is currently in use. Stripe functionality is now limited.",
  );
}

export const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY") ?? DUMMY_SECRET_KEY,
  {
    apiVersion: "2022-11-15",
    // Use the Fetch API instead of Node's HTTP client.
    httpClient: Stripe.createFetchHttpClient(),
  },
);

export function formatAmountForDisplay(
  amount: number,
  currency: string,
): string {
  const numberFormat = new Intl.NumberFormat(
    navigator.language,
    {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    },
  );
  const parts = numberFormat.formatToParts(amount);
  const amountToFormat = parts.some((part) => part.type === "decimal")
    ? amount / 100
    : amount;
  return numberFormat.format(amountToFormat);
}
