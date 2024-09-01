// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "@std/assert";
import { generate, validate } from "./v7.ts";

Deno.test("generate() generates a non-empty string", () => {
  const u1 = generate();

  assertEquals(typeof u1, "string", "returns a string");
  assert(u1 !== "", "return string is not empty");
});

Deno.test("generate() generates UUIDs in version 7 format", () => {
  for (let i = 0; i < 10000; i++) {
    const u = generate() as string;
    assert(validate(u), `${u} is not a valid uuid v7`);
  }
});

Deno.test("generate() generates a UUIDv7 matching the example test vector", () => {
  /**
   * Example test vector from the RFC:
   * {@see https://www.rfc-editor.org/rfc/rfc9562.html#appendix-A.6}
   */
  const u = generate({
    timestamp: 0x017F22E279B0,
    random: {
      // 0xCC3
      a: new Uint8Array([0xC, 0xC3]),
      // 0b01, 0x8C4DC0C0C07398F
      b: new Uint8Array([0x18, 0xC4, 0xDC, 0x0C, 0x0C, 0x07, 0x39, 0x8F]),
    },
  });
  assertEquals(u, "017f22e2-79b0-7cc3-98c4-dc0c0c07398f");
});

Deno.test("validate() checks if a string is a valid v5 UUID", () => {
  const u = generate();
  const t = "017f22e2-79b0-7cc3-98c4-dc0c0c07398f";
  assert(validate(u), `generated ${u} should be valid`);
  assert(validate(t), `${t} should be valid`);
});
