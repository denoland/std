// Copyright 2018-2025 the Deno authors. MIT license.
import { assert, assertEquals, assertThrows } from "@std/assert";
import { generate, validate } from "./v1.ts";

Deno.test("validate() checks if a string is a valid v1 UUID", () => {
  const u = generate();
  const t = "63655efa-7ee6-11ea-bc55-0242ac130003";
  const n = "63655efa-7ee6-11eg-bc55-0242ac130003";

  assert(validate(u as string), `generated ${u} should be valid`);
  assert(validate(t), `${t} should be valid`);
  assert(!validate(n), `${n} should not be valid`);
});

Deno.test("generate() generates a non-empty string", () => {
  const u1 = generate();
  const u2 = generate({
    msecs: new Date("2011-11-01").getTime(),
    nsecs: 10000,
  });

  assertEquals(typeof u1, "string", "returns a string");
  assert(u1 !== "", "return string is not empty");
  assertEquals(typeof u2, "string", "returns a string");
  assert(u2 !== "", "return string is not empty");
});

Deno.test("generate() generates UUIDs in version 1 format", () => {
  for (let i = 0; i < 10000; i++) {
    const u = generate() as string;
    assert(validate(u), `${u} is not a valid uuid v1`);
  }
});

Deno.test("generate() can generate a static v1 UUID", () => {
  const v1options = {
    node: [0x01, 0x23, 0x45, 0x67, 0x89, 0xab],
    clockseq: 0x1234,
    msecs: new Date("2011-11-01").getTime(),
    nsecs: 5678,
  };
  const u = generate(v1options);
  assertEquals(u, "710b962e-041c-11e1-9234-0123456789ab");
});

Deno.test("generate() throws when node is passed with less than 6 numbers", () => {
  assertThrows(
    () => {
      generate({ node: [0x01, 0x23, 0x45, 0x67, 0x89] });
    },
    Error,
    "Cannot create UUID: the node option must be an array of 6 bytes",
  );
});

Deno.test("generate() throws when node is passed with more than 6 numbers", () => {
  assertThrows(
    () => {
      generate({ node: [0x01, 0x23, 0x45, 0x67, 0x89, 0x89, 0x89] });
    },
    Error,
    "Cannot create UUID: the node option must be an array of 6 bytes",
  );
});

Deno.test("generate() throws when create more than 10M uuids/sec", () => {
  assertThrows(
    () => {
      generate({ nsecs: 10001 });
    },
    Error,
    "Can't create more than 10M uuids/sec",
  );
});
