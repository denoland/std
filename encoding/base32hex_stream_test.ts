// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { encodeBase32Hex } from "./base32hex.ts";
import {
  Base32HexDecoderStream,
  Base32HexEncoderStream,
} from "./base32hex_stream.ts";

Deno.test("Base32EncoderStream() encodes stream", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const i = Math.floor(Math.random() * chunk.length);
          controller.enqueue(chunk.slice(0, i));
          controller.enqueue(chunk.slice(i));
        },
      }),
    )
    .pipeThrough(new Base32HexEncoderStream());

  assertEquals(
    (await Array.fromAsync(readable)).join(""),
    encodeBase32Hex(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("Base32DecoderStream() decodes stream", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new Base32HexEncoderStream())
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const i = Math.floor(Math.random() * chunk.length);
          controller.enqueue(chunk.slice(0, i));
          controller.enqueue(chunk.slice(i));
        },
      }),
    )
    .pipeThrough(new Base32HexDecoderStream());

  assertEquals(
    Uint8Array.from(
      (await Array.fromAsync(readable)).map((x) => [...x]).flat(),
    ),
    await Deno.readFile("./deno.lock"),
  );
});
