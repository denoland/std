// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toText } from "@std/streams";
import { toBytes } from "@std/streams/unstable-to-bytes";
import { FixedChunkStream } from "@std/streams/unstable-fixed-chunk-stream";
import { type Base64Format, encodeBase64 } from "./unstable_base64.ts";
import {
  Base64DecoderStream,
  Base64EncoderStream,
} from "./unstable_base64_stream.ts";

Deno.test("Base64EncoderStream() with normal format", async () => {
  for (const format of ["Base64", "Base64Url"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new Base64EncoderStream(format));

    assertEquals(
      await toText(readable),
      encodeBase64(await Deno.readFile("./deno.lock"), format),
      format,
    );
  }
});

Deno.test("Base64EncoderStream() with raw format", async () => {
  for (const format of ["Raw-Base64", "Raw-Base64Url"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new Base64EncoderStream(format));

    assertEquals(
      await toBytes(readable),
      new TextEncoder().encode(
        encodeBase64(
          await Deno.readFile("./deno.lock"),
          format.slice(4) as Base64Format,
        ),
      ),
      format,
    );
  }
});

Deno.test("Base64DecoderStream() with normal format", async () => {
  for (const format of ["Base64", "Base64Url"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new Base64EncoderStream(format))
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new Base64DecoderStream(format));

    assertEquals(
      await toBytes(readable),
      await Deno.readFile("./deno.lock"),
    );
  }
});

Deno.test("Base64DecoderStream() with raw format", async () => {
  for (const format of ["Raw-Base64", "Raw-Base64Url"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new Base64EncoderStream(format))
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new Base64DecoderStream(format));

    assertEquals(
      await toBytes(readable),
      await Deno.readFile("./deno.lock"),
    );
  }
});
