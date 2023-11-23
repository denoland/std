// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/assert_equals.ts";
import { assertThrows } from "https://deno.land/std@$STD_VERSION/assert/assert_throws.ts";
import { MissingEnvVarError, x } from "./x.ts";

Deno.test("x() doesn't overwrite environment variable value if already set", () => {
  const key = crypto.randomUUID();
  const value = crypto.randomUUID();
  Deno.env.set(key, value);
  x({ key, defaultValue: "NOT_OVERWRITTEN" });

  assertEquals(Deno.env.get(key), value);
});

Deno.test("x() sets default environment variable value if not set", () => {
  const key = crypto.randomUUID();
  const defaultValue = crypto.randomUUID();
  x({ key, defaultValue });

  assertEquals(Deno.env.get(key), defaultValue);
});

Deno.test("x() throws if the required environment variable is not set", () => {
  const key = crypto.randomUUID();

  assertThrows(
    () => {
      x({ key, required: true });
    },
    MissingEnvVarError,
    `Missing environment variable: ${key}`,
  );
});

Deno.test("x() does not throw if the required environment variable is set", () => {
  const key = crypto.randomUUID();
  const value = crypto.randomUUID();
  Deno.env.set(key, value);

  x({ key, required: true });
});

Deno.test("x() sets default value for required environment variable if not set and therefore doesn't throw", () => {
  const key = crypto.randomUUID();
  const defaultValue = crypto.randomUUID();
  x({ key, defaultValue, required: true });

  assertEquals(Deno.env.get(key), defaultValue);
});
