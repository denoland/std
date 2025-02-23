// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { encodeBase32Crockford } from "./unstable_base32crockford.ts";
import {
  Base32CrockfordDecoderStream,
  Base32CrockfordEncoderStream,
} from "./unstable_base32crockford_stream.ts";
import { RandomSliceStream } from "./_random_slice_stream.ts";
import { toText } from "@std/streams/to-text";
import { concat } from "@std/bytes/concat";

Deno.test("Base32EncoderStream() encodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new Base32CrockfordEncoderStream());

  assertEquals(
    await toText(stream),
    encodeBase32Crockford(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("Base32DecoderStream() decodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new Base32CrockfordEncoderStream())
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new Base32CrockfordDecoderStream());

  assertEquals(
    concat(await Array.fromAsync(stream)),
    await Deno.readFile("./deno.lock"),
  );
});
