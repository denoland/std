// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import { random } from "./_common_test.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborMapEncoderStream } from "./map_encoder_stream.ts";
import type { CborMapStreamInput, CborType } from "./types.ts";

Deno.test("CborMapEncoderStream() correctly encoding", async () => {
  const maps: CborMapStreamInput[] = [["a", random(0, 2 ** 32)]];

  const expectedOutput = concat([
    new Uint8Array([0b101_11111]),
    ...maps.map(([k, v]) => [encodeCbor(k), encodeCbor(v as CborType)]).flat(),
    new Uint8Array([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      ReadableStream.from(maps).pipeThrough(new CborMapEncoderStream()),
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborMapEncoderStream.from() correctly encoding", async () => {
  const maps: CborMapStreamInput[] = [["a", random(0, 2 ** 32)]];

  const expectedOutput = concat([
    new Uint8Array([0b101_11111]),
    ...maps.map(([k, v]) => [encodeCbor(k), encodeCbor(v as CborType)]).flat(),
    new Uint8Array([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      CborMapEncoderStream.from(maps).readable,
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});
