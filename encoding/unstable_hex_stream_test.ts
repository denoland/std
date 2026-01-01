// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toText } from "@std/streams";
import { toBytes } from "@std/streams/unstable-to-bytes";
import { FixedChunkStream } from "@std/streams/unstable-fixed-chunk-stream";
import { encodeHex } from "./unstable_hex.ts";
import { HexDecoderStream, HexEncoderStream } from "./unstable_hex_stream.ts";

Deno.test("HexEncoderStream() with normal format", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new FixedChunkStream(1021))
    .pipeThrough(new HexEncoderStream({ output: "string" }));

  assertEquals(
    await toText(readable),
    encodeHex(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("HexEncoderStream() with raw format", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new FixedChunkStream(1021))
    .pipeThrough(new HexEncoderStream({ output: "bytes" }));

  assertEquals(
    await toBytes(readable),
    new TextEncoder().encode(encodeHex(await Deno.readFile("./deno.lock"))),
  );
});

Deno.test("HexDecoderStream() with normal format", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new HexEncoderStream({ output: "string" }))
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(new FixedChunkStream(1021))
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new HexDecoderStream({ input: "string" }));

  assertEquals(
    await toBytes(readable),
    await Deno.readFile("./deno.lock"),
  );
});

Deno.test("HexDecoderStream() with raw format", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new HexEncoderStream({ output: "bytes" }))
    .pipeThrough(new FixedChunkStream(1021))
    .pipeThrough(new HexDecoderStream({ input: "bytes" }));

  assertEquals(
    await toBytes(readable),
    await Deno.readFile("./deno.lock"),
  );
});
