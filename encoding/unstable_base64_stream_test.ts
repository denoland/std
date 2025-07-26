// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toText } from "@std/streams";
import { toBytes } from "@std/streams/unstable-to-bytes";
import { FixedChunkStream } from "@std/streams/unstable-fixed-chunk-stream";
import { encodeBase64 } from "./unstable_base64.ts";
import {
  Base64DecoderStream,
  Base64EncoderStream,
} from "./unstable_base64_stream.ts";

Deno.test("Base64EncoderStream() with normal format", async () => {
  for (const alphabet of ["base64", "base64url"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new Base64EncoderStream({ alphabet, output: "string" }));

    assertEquals(
      await toText(readable),
      encodeBase64(await Deno.readFile("./deno.lock"), { alphabet }),
      alphabet,
    );
  }
});

Deno.test("Base64EncoderStream() with raw format", async () => {
  for (const alphabet of ["base64", "base64url"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new Base64EncoderStream({ alphabet, output: "bytes" }));

    assertEquals(
      await toBytes(readable),
      new TextEncoder().encode(
        encodeBase64(
          await Deno.readFile("./deno.lock"),
          { alphabet },
        ),
      ),
      alphabet,
    );
  }
});

Deno.test("Base64DecoderStream() with normal format", async () => {
  for (const alphabet of ["base64", "base64url"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new Base64EncoderStream({ alphabet, output: "string" }))
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new Base64DecoderStream({ alphabet, input: "string" }));

    assertEquals(
      await toBytes(readable),
      await Deno.readFile("./deno.lock"),
    );
  }
});

Deno.test("Base64DecoderStream() with raw format", async () => {
  for (const alphabet of ["base64", "base64url"] as const) {
    const readable = (await Deno.open("./deno.lock"))
      .readable
      .pipeThrough(new Base64EncoderStream({ alphabet, output: "bytes" }))
      .pipeThrough(new FixedChunkStream(1021))
      .pipeThrough(new Base64DecoderStream({ alphabet, input: "bytes" }));

    assertEquals(
      await toBytes(readable),
      await Deno.readFile("./deno.lock"),
    );
  }
});

Deno.test("Base64DecoderStream() allows white space", async () => {
  const text = await Deno.readTextFile("./deno.lock");

  const encoded = encodeBase64(text).replaceAll(/.{76}/g, `$&\r\n`);

  const stream = new Blob([encoded]).stream()
    .pipeThrough(new FixedChunkStream(1021))
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new Base64DecoderStream());

  assertEquals(await toText(stream), text);
});
