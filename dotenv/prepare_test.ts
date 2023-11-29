// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../assert/mod.ts";
import { MissingEnvVarError, prepare } from "./prepare.ts";

Deno.test("prepare() doesn't overwrite environment variable value if already set", () => {
  const key = crypto.randomUUID();
  const value = crypto.randomUUID();
  Deno.env.set(key, value);
  prepare({ key, defaultValue: "NOT_OVERWRITTEN" });

  assertEquals(Deno.env.get(key), value);
});

Deno.test("prepare() sets default environment variable value if not set", () => {
  const key = crypto.randomUUID();
  const defaultValue = crypto.randomUUID();
  prepare({ key, defaultValue });

  assertEquals(Deno.env.get(key), defaultValue);
});

Deno.test("prepare() throws if the required environment variable is not set", () => {
  const key = crypto.randomUUID();

  assertThrows(
    () => {
      prepare({ key, required: true });
    },
    MissingEnvVarError,
    `Missing environment variable: ${key}`,
  );
});

Deno.test("prepare() does not throw if the required environment variable is set", () => {
  const key = crypto.randomUUID();
  const value = crypto.randomUUID();
  Deno.env.set(key, value);

  prepare({ key, required: true });
});

Deno.test("prepare() sets default value for required environment variable if not set and therefore doesn't throw", () => {
  const key = crypto.randomUUID();
  const defaultValue = crypto.randomUUID();
  prepare({ key, defaultValue, required: true });

  assertEquals(Deno.env.get(key), defaultValue);
});
