// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { Env, EnvObject, verify } from "./_util.ts";

Deno.test("verify allowEmptyValues", () => {
  const dotEnv: EnvObject = { env: { foo: "" }, exports: [] };
  const exampleEnv: Env = { foo: "bar" };
  assertEquals(verify(dotEnv, exampleEnv, { allowEmptyValues: true }), true);
});
Deno.test("verify allowEmptyValues throw", () => {
  const dotEnv: EnvObject = { env: { foo: "" }, exports: [] };
  const exampleEnv: Env = { foo: "bar" };
  assertThrows(() => verify(dotEnv, exampleEnv));
});
