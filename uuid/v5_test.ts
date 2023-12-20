// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../assert/mod.ts";
import { generate, validate } from "./v5.ts";

const NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

Deno.test("generate() generates a non-empty string", async () => {
  const u = await generate(NAMESPACE, new Uint8Array());
  assertEquals(typeof u, "string", "returns a string");
  assert(u !== "", "return string is not empty");
});

Deno.test("generate() generates UUIDs in version 5 format", async () => {
  for (let i = 0; i < 10000; i++) {
    const u = await generate(
      NAMESPACE,
      new TextEncoder().encode(i.toString()),
    ) as string;
    assert(validate(u), `${u} is not a valid uuid v5`);
  }
});

Deno.test("generate() generates a name-based UUID using SHA-1 hash", async () => {
  const u = await generate(NAMESPACE, new TextEncoder().encode("Hello, World"));
  assertEquals(u, "4b4f2adc-5b27-57b5-8e3a-c4c4bcf94f05");
});

Deno.test("validate() checks if a string is a valid v5 UUID", async () => {
  const u = await generate(
    "1b671a64-40d5-491e-99b0-da01ff1f3341",
    new TextEncoder().encode("Hello, World"),
  );
  const t = "4b4f2adc-5b27-57b5-8e3a-c4c4bcf94f05";
  const n = "4b4f2adc-5b27-17b5-8e3a-c4c4bcf94f05";

  assert(validate(u), `generated ${u} should be valid`);
  assert(validate(t), `${t} should be valid`);
  assert(!validate(n), `${n} should not be valid`);
});
