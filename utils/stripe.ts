import Stripe from "stripe";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
  // Use the Fetch API instead of Node's HTTP client.
  httpClient: Stripe.createFetchHttpClient(),
});

export function formatAmountForDisplay(
  amount: number,
  currency: string,
): string {
  const numberFormat = new Intl.NumberFormat(
    navigator.language,
    {
      style: "currency",
      currency: currency,
      currencyDisplay: "symbol",
    },
  );
  const parts = numberFormat.formatToParts(amount);
  const amountToFormat = parts.some((part) => part.type === "decimal")
    ? amount / 100
    : amount;
  return numberFormat.format(amountToFormat);
}
