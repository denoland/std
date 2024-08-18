// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { fnv } from "./mod.ts";

Deno.test("fnv()", function () {
  const encoder = new TextEncoder();
  const input = encoder.encode("a");
  const fixtures = [
    ["FNV32", new ArrayBuffer(4)],
    ["FNV32A", new ArrayBuffer(4)],
    ["FNV64", new ArrayBuffer(8)],
    ["FNV64A", new ArrayBuffer(8)],
  ] as const;
  for (const [name, expected] of fixtures) {
    assertEquals(fnv(name, input), expected);
  }
});

Deno.test("fnv() throws when an unsupported digest is provided", function () {
  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => fnv("FNV128" as any, new Uint8Array()),
    TypeError,
    "unsupported fnv digest: FNV128",
  );
});
