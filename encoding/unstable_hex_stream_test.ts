// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { encodeHex } from "./hex.ts";
import { HexDecoderStream, HexEncoderStream } from "./unstable_hex_stream.ts";
import { toText } from "@std/streams/to-text";
import { concat } from "@std/bytes/concat";
import { RandomSliceStream } from "./_random_slice_stream.ts";

Deno.test("HexEncoderStream() encodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new HexEncoderStream());

  assertEquals(
    await toText(stream),
    encodeHex(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("HexDecoderStream() decodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new HexEncoderStream())
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new HexDecoderStream());

  assertEquals(
    concat(await Array.fromAsync(stream)),
    await Deno.readFile("./deno.lock"),
  );
});
