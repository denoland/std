// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { encodeCborSequence } from "./encode_cbor_sequence.ts";
import type { CborType } from "./types.ts";

Deno.test("encodeCborSequence() correctly encoding", () => {
  assertEquals(
    encodeCborSequence([0, 0]),
    Uint8Array.from([0b000_00000, 0b000_00000]),
  );
});

Deno.test("encodeCborSequence() accepting readonly array input", () => {
  const values = [1, "two", { three: 3n }] as const;
  const mutable: CborType[] = [1, "two", { three: 3n }];
  assertEquals(
    encodeCborSequence(values),
    encodeCborSequence(mutable),
  );
});
