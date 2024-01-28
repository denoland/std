// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import type Stripe from "stripe";
import { SITE_DESCRIPTION } from "@/utils/constants.ts";
import { isStripeEnabled, stripe } from "@/utils/stripe.ts";

async function createPremiumTierProduct(stripe: Stripe) {
  /**
   * These values provide a set of default values for the demo.
   * However, these can be adjusted to fit your use case.
   */
  return await stripe.products.create({
    name: "Premium",
    description: "Unlock premium features like flair and more.",
    default_price_data: {
      unit_amount: 500,
      currency: "usd",
      recurring: {
        interval: "month",
      },
    },
  });
}

async function createDefaultPortalConfiguration(
  stripe: Stripe,
  product:
    Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.Product,
) {
  return await stripe.billingPortal.configurations.create({
    features: {
      payment_method_update: {
        enabled: true,
      },
      customer_update: {
        allowed_updates: ["email", "name"],
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: "immediately",
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        products: [product],
      },
      invoice_history: { enabled: true },
    },
    business_profile: {
      headline: SITE_DESCRIPTION,
    },
  });
}

async function main() {
  if (!isStripeEnabled()) throw new Error("Stripe is disabled.");

  const product = await createPremiumTierProduct(stripe);

  if (typeof product.default_price !== "string") return;

  await createDefaultPortalConfiguration(stripe, {
    prices: [product.default_price],
    product: product.id,
  });

  console.log(
    "Please copy and paste this value into the `STRIPE_PREMIUM_PLAN_PRICE_ID` variable in `.env`: " +
      product.default_price,
  );
}

if (import.meta.main) {
  await main();
}
