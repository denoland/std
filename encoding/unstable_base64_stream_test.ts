// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { encodeBase64 } from "./base64.ts";
import {
  Base64DecoderStream,
  Base64EncoderStream,
} from "./unstable_base64_stream.ts";
import { RandomSliceStream } from "./_random_slice_stream.ts";
import { toText } from "@std/streams/to-text";
import { concat } from "@std/bytes/concat";

Deno.test("Base64EncoderStream() encodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new Base64EncoderStream());

  assertEquals(
    await toText(stream),
    encodeBase64(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("Base64DecoderStream() decodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new Base64EncoderStream())
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new Base64DecoderStream());

  assertEquals(
    concat(await Array.fromAsync(stream)),
    await Deno.readFile("./deno.lock"),
  );
});
