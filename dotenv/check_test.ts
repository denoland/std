// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../assert/mod.ts";
import { check, MissingEnvVarError } from "./check.ts";

Deno.test("check() doesn't overwrite environment variable value if already set", () => {
  const key = crypto.randomUUID();
  const value = crypto.randomUUID();
  Deno.env.set(key, value);
  check({ key, defaultValue: "NOT_OVERWRITTEN" });

  assertEquals(Deno.env.get(key), value);
});

Deno.test("check() sets default environment variable value if not set", () => {
  const key = crypto.randomUUID();
  const defaultValue = crypto.randomUUID();
  check({ key, defaultValue });

  assertEquals(Deno.env.get(key), defaultValue);
});

Deno.test("check() throws if the required environment variable is not set", () => {
  const key = crypto.randomUUID();

  assertThrows(
    () => {
      check({ key, required: true });
    },
    MissingEnvVarError,
    `Missing environment variable: ${key}`,
  );
});

Deno.test("check() does not throw if the required environment variable is set", () => {
  const key = crypto.randomUUID();
  const value = crypto.randomUUID();
  Deno.env.set(key, value);

  check({ key, required: true });
});

Deno.test("check() sets default value for required environment variable if not set and therefore doesn't throw", () => {
  const key = crypto.randomUUID();
  const defaultValue = crypto.randomUUID();
  check({ key, defaultValue, required: true });

  assertEquals(Deno.env.get(key), defaultValue);
});
