// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { encodeBase64Url } from "./base64url.ts";
import {
  Base64UrlDecoderStream,
  Base64UrlEncoderStream,
} from "./unstable_base64url_stream.ts";
import { RandomSliceStream } from "./_random_slice_stream.ts";
import { toText } from "@std/streams/to-text";
import { concat } from "@std/bytes/concat";

Deno.test("Base64UrlEncoderStream() encodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new Base64UrlEncoderStream());

  assertEquals(
    await toText(stream),
    encodeBase64Url(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("Base64UrlDecoderStream() decodes stream", async () => {
  const stream = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new Base64UrlEncoderStream())
    .pipeThrough(new RandomSliceStream())
    .pipeThrough(new Base64UrlDecoderStream());

  assertEquals(
    concat(await Array.fromAsync(stream)),
    await Deno.readFile("./deno.lock"),
  );
});
