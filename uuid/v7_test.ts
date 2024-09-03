// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals, assertThrows } from "@std/assert";
import { extractTimestamp, generate, validate } from "./v7.ts";
import { stub } from "../testing/mock.ts";

Deno.test("generate() generates a non-empty string", () => {
  const u1 = generate();

  assertEquals(typeof u1, "string", "returns a string");
  assert(u1 !== "", "return string is not empty");
});

Deno.test("generate() generates UUIDs in version 7 format", () => {
  for (let i = 0; i < 10000; i++) {
    const u = generate();
    assert(validate(u), `${u} is not a valid uuid v7`);
  }
});

Deno.test("generate() generates a UUIDv7 matching the example test vector", () => {
  /**
   * Example test vector from the RFC:
   * {@see https://www.rfc-editor.org/rfc/rfc9562.html#appendix-A.6}
   */
  const timestamp = 0x017F22E279B0;
  const random = new Uint8Array([
    // rand_a = 0xCC3
    0xC,
    0xC3,
    // rand_b = 0b01, 0x8C4DC0C0C07398F
    0x18,
    0xC4,
    0xDC,
    0x0C,
    0x0C,
    0x07,
    0x39,
    0x8F,
  ]);
  using _getRandomValuesStub = stub(crypto, "getRandomValues", (array) => {
    for (let index = 0; index < (random.length); index++) {
      array[index] = random[index]!;
    }
    return random;
  });
  const u = generate({ timestamp });
  assertEquals(u, "017f22e2-79b0-7cc3-98c4-dc0c0c07398f");
});

Deno.test("generate() throws on invalid timestamp", () => {
  assertThrows(
    () => generate({ timestamp: -1 }),
    Error,
    "Cannot generate UUID as timestamp must be a non-negative integer: timestamp -1",
  );
  assertThrows(
    () => generate({ timestamp: NaN }),
    Error,
    "Cannot generate UUID as timestamp must be a non-negative integer: timestamp NaN",
  );
  assertThrows(
    () => generate({ timestamp: 2.3 }),
    Error,
    "Cannot generate UUID as timestamp must be a non-negative integer: timestamp 2.3",
  );
});

Deno.test("validate() checks if a string is a valid v7 UUID", () => {
  const u = generate();
  const t = "017f22e2-79b0-7cc3-98c4-dc0c0c07398f";
  assert(validate(u), `generated ${u} should be valid`);
  assert(validate(t), `${t} should be valid`);
});

Deno.test("extractTimestamp(uuid) extracts the timestamp from a UUIDv7", () => {
  const u = "017f22e2-79b0-7cc3-98c4-dc0c0c07398f";
  const now = Date.now();
  const u2 = generate({ timestamp: now });
  assertEquals(extractTimestamp(u), 1645557742000);
  assertEquals(extractTimestamp(u2), now);
});

Deno.test("extractTimestamp(uuid) throws on invalid UUID", () => {
  assertThrows(
    () => extractTimestamp("invalid-uuid"),
    Error,
    "Could not extract timestamp because the UUID was not a valid UUIDv7",
  );
  assertThrows(
    () => extractTimestamp(crypto.randomUUID()),
    Error,
    "Could not extract timestamp because the UUID was not a valid UUIDv7",
  );
});
