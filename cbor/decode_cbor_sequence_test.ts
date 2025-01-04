// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { decodeCborSequence } from "./decode_cbor_sequence.ts";

Deno.test("decodeCborSequence() correctly decoding", () => {
  assertEquals(
    decodeCborSequence(Uint8Array.from([0b000_00000, 0b000_00000])),
    [0, 0],
  );
});
