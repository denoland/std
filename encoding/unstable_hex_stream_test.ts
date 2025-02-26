// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toText } from "@std/streams";
import { toBytes } from "@std/streams/unstable-to-bytes";
import { FixedChunkStream } from "@std/streams/unstable-fixed-chunk-stream";
import { encodeHex, type HexFormat } from "./unstable_hex.ts";
import { HexDecoderStream, HexEncoderStream } from "./unstable_hex_stream.ts";

Deno.test("HexEncoderStream() with normal format", async () => {
  for (const format of ["Hex"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new HexEncoderStream(format));

    assertEquals(
      await toText(readable),
      encodeHex(await Deno.readFile("./deno.lock"), format),
      format,
    );
  }
});

Deno.test("HexEncoderStream() with raw format", async () => {
  for (const format of ["Raw-Hex"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new HexEncoderStream(format));

    assertEquals(
      await toBytes(readable),
      new TextEncoder().encode(
        encodeHex(
          await Deno.readFile("./deno.lock"),
          format.slice(4) as HexFormat,
        ),
      ),
      format,
    );
  }
});

Deno.test("HexDecoderStream() with normal format", async () => {
  for (const format of ["Hex"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new HexEncoderStream(format))
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new HexDecoderStream(format));

    assertEquals(
      await toBytes(readable),
      await Deno.readFile("./deno.lock"),
    );
  }
});

Deno.test("HexDecoderStream() with raw format", async () => {
  for (const format of ["Raw-Hex"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new HexEncoderStream(format))
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new HexDecoderStream(format));

    assertEquals(
      await toBytes(readable),
      await Deno.readFile("./deno.lock"),
    );
  }
});
