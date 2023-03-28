import Stripe from "stripe";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
  // Use the Fetch API instead of Node's HTTP client.
  httpClient: Stripe.createFetchHttpClient(),
});

const isClient = typeof window === "object";

export function formatAmountForDisplay(
  amount: number,
  currency: string,
): string {
  const numberFormat = new Intl.NumberFormat(
    isClient ? navigator.language : "en-US",
    {
      style: "currency",
      currency: currency,
      currencyDisplay: "symbol",
    },
  );
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  for (const part of parts) {
    if (part.type === "decimal") {
      zeroDecimalCurrency = false;
    }
  }
  const amountToFormat = zeroDecimalCurrency ? amount : amount / 100;
  return numberFormat.format(amountToFormat);
}
