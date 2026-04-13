// Copyright 2018-2026 the Deno authors. MIT license.
import { assert, assertEquals, assertThrows } from "@std/assert";
import { generate, type GenerateOptions, validate } from "./unstable_v6.ts";

Deno.test("validate() checks if a string is a valid v6 UUID", () => {
  const u = generate();
  const t = "1efed67d-d966-6490-8b9a-755015853480";
  const n = "1efed67d-d966-1490-8b9a-755015853480";

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

Deno.test("generate() generates UUIDs in version 6 format", () => {
  for (let i = 0; i < 10000; i++) {
    const u = generate() as string;
    assert(validate(u), `${u} is not a valid uuid v6`);
  }
});

Deno.test("generate() can generate a static v6 UUID", () => {
  const v6options = {
    node: [0x01, 0x23, 0x45, 0x67, 0x89, 0xab],
    clockseq: 0x385c,
    msecs: new Date("2011-11-18T21:25:33.573+00:00").getTime(),
    nsecs: 5442,
  };
  const u = generate(v6options);
  assertEquals(u, "1e1122bd-9428-6892-b85c-0123456789ab");
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
    "Cannot create more than 10M uuids/sec",
  );
});

Deno.test("generate() uses provided rng function", () => {
  const v6options: GenerateOptions = {
    msecs: new Date("2011-11-18T21:25:33.573+00:00").getTime(),
    nsecs: 5442,
    rng: () => [0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0x2d, 0xef],
  };
  const u = generate(v6options);
  assertEquals(u, "1e1122bd-9428-6892-adef-0123456789ab");
});

Deno.test("generate() uses provided random data", () => {
  const v6options: GenerateOptions = {
    msecs: new Date("2011-11-18T21:25:33.573+00:00").getTime(),
    nsecs: 5442,
    random: [0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0x2d, 0xef],
  };
  const u = generate(v6options);
  assertEquals(u, "1e1122bd-9428-6892-adef-0123456789ab");
});

Deno.test("generate() defaults to random node and clock sequence", () => {
  const numGenerate = 1_000;
  const v6options: GenerateOptions = {
    msecs: new Date("2011-11-18T21:25:33.573+00:00").getTime(),
    nsecs: 5342,
  };
  const uuids: string[] = [];

  for (let i = 0; i < numGenerate; i++) {
    const u = generate(v6options);
    assert(!uuids.includes(u), "Duplicate random data detected");
    uuids.push(u);
  }
});
