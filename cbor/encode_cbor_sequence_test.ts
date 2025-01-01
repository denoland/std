// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { encodeCborSequence } from "./encode_cbor_sequence.ts";

Deno.test("encodeCborSequence() correctly encoding", () => {
  assertEquals(
    encodeCborSequence([0, 0]),
    Uint8Array.from([0b000_00000, 0b000_00000]),
  );
});
