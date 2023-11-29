// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { setEnvDefault } from "./set_env_default.ts";

Deno.test("setEnvDefault() doesn't overwrite environment variable value if already set", () => {
  const key = crypto.randomUUID();
  const value = crypto.randomUUID();
  Deno.env.set(key, value);
  setEnvDefault(key, "NOT_OVERWRITTEN");

  assertEquals(Deno.env.get(key), value);
});

Deno.test("setEnvDefault() sets default environment variable value if not set", () => {
  const key = crypto.randomUUID();
  const defaultValue = crypto.randomUUID();
  setEnvDefault(key, defaultValue);

  assertEquals(Deno.env.get(key), defaultValue);
});
