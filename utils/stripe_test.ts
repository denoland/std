// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { AssertionError, assertThrows } from "std/assert/mod.ts";
import { assertIsPrice } from "./stripe.ts";

Deno.test("[stripe] assertIsPrice()", () => {
  const message =
    "Default price must be of type `Stripe.Price`. Please run the `deno task init:stripe` as the README instructs.";
  assertThrows(() => assertIsPrice(undefined), AssertionError, message);
  assertThrows(() => assertIsPrice(null), AssertionError, message);
  assertThrows(() => assertIsPrice("not a price"), AssertionError, message);
});
