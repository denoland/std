// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertThrows } from "../assert/mod.ts";
import { assertEnvSet, MissingEnvVarError } from "./assert_env_set.ts";

Deno.test("assertEnvSet() throws if the required environment variable is not set", () => {
  const key = crypto.randomUUID();

  assertThrows(
    () => assertEnvSet(key),
    MissingEnvVarError,
    `Missing environment variable: ${key}`,
  );
});

Deno.test("assertEnvSet() does not throw if the required environment variable is set", () => {
  const key = crypto.randomUUID();
  const value = crypto.randomUUID();
  Deno.env.set(key, value);

  assertEnvSet(key);
});
