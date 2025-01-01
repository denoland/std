// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { encodeBase32 } from "./base32.ts";
import {
  Base32DecoderStream,
  Base32EncoderStream,
} from "./unstable_base32_stream.ts";
import { RandomSliceStream } from "./_random_slice_stream.ts";
import { toText } from "../streams/to_text.ts";
import { concat } from "@std/bytes/concat";

Deno.test("Base32EncoderStream() encodes stream", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new Base32EncoderStream());

  assertEquals(
    await toText(readable),
    encodeBase32(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("Base32DecoderStream() decodes stream", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new Base32EncoderStream())
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new Base32DecoderStream());

  assertEquals(
    concat(await Array.fromAsync(readable)),
    await Deno.readFile("./deno.lock"),
  );
});
