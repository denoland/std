// Copyright 2023 the Deno authors. All rights reserved. MIT license.

// Default types for Stripe don't yet work: https://github.com/stripe-samples/stripe-node-deno-samples/issues/2
// @deno-types="npm:stripe@12.6.0"
import Stripe from "https://esm.sh/stripe@12.6.0";

export default Stripe;
