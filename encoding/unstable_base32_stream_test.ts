// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toText } from "@std/streams";
import { toBytes } from "@std/streams/unstable-to-bytes";
import { FixedChunkStream } from "@std/streams/unstable-fixed-chunk-stream";
import { encodeBase32 } from "./unstable_base32.ts";
import {
  Base32DecoderStream,
  Base32EncoderStream,
} from "./unstable_base32_stream.ts";

Deno.test("Base32EncoderStream() with normal format", async () => {
  for (const alphabet of ["base32", "base32hex", "base32crockford"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new Base32EncoderStream({ alphabet, output: "string" }));

    assertEquals(
      await toText(readable),
      encodeBase32(await Deno.readFile("./deno.lock"), { alphabet }),
      alphabet,
    );
  }
});

Deno.test("Base32EncoderStream() with raw format", async () => {
  for (
    const alphabet of [
      "base32",
      "base32hex",
      "base32crockford",
    ] as const
  ) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new Base32EncoderStream({ alphabet, output: "bytes" }));

    assertEquals(
      await toBytes(readable),
      new TextEncoder().encode(
        encodeBase32(
          await Deno.readFile("./deno.lock"),
          { alphabet },
        ),
      ),
      alphabet,
    );
  }
});

Deno.test("Base32DecoderStream() with normal format", async () => {
  for (const alphabet of ["base32", "base32hex", "base32crockford"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new Base32EncoderStream({ alphabet, output: "string" }))
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new Base32DecoderStream({ alphabet, input: "string" }));

    assertEquals(
      await toBytes(readable),
      await Deno.readFile("./deno.lock"),
    );
  }
});

Deno.test("Base32DecoderStream() with raw format", async () => {
  for (
    const alphabet of [
      "base32",
      "base32hex",
      "base32crockford",
    ] as const
  ) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new Base32EncoderStream({ alphabet, output: "bytes" }))
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new Base32DecoderStream({ alphabet, input: "bytes" }));

    assertEquals(
      await toBytes(readable),
      await Deno.readFile("./deno.lock"),
    );
  }
});
