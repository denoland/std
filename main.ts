// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import { isStripeEnabled } from "@/utils/stripe.ts";

console.log(
  isStripeEnabled()
    ? "`STRIPE_SECRET_KEY` environment variable is defined. Stripe is enabled."
    : "`STRIPE_SECRET_KEY` environment variable is not defined. Stripe is disabled.\n" +
      "For more information on how to set up Stripe, see https://github.com/denoland/saaskit#set-up-stripe-optional",
);

await start(manifest, config);
