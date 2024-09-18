// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { CborSequenceDecoderStream, CborSequenceEncoderStream } from "./mod.ts";

function random(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start) + start);
}

Deno.test("CborSequenceDecoderStream()", async () => {
  const input = [
    undefined,
    null,
    true,
    false,
    random(0, 24),
    BigInt(random(0, 24)),
    "a".repeat(random(0, 24)),
    new Uint8Array(random(0, 24)),
    new Date(),
  ];

  assertEquals(
    await Array.fromAsync(
      ReadableStream.from(input).pipeThrough(new CborSequenceEncoderStream())
        .pipeThrough(new CborSequenceDecoderStream()),
    ),
    input.map((x) => typeof x === "bigint" && x < 2n ** 32n ? Number(x) : x),
  );
});
