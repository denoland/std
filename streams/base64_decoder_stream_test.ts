// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { Base64DecoderStream } from "./base64_decoder_stream.ts";

const testset = [
  ["", ""],
  ["ß", "w58="],
  ["f", "Zg=="],
  ["fo", "Zm8="],
  ["foo", "Zm9v"],
  ["foob", "Zm9vYg=="],
  ["fooba", "Zm9vYmE="],
  ["foobar", "Zm9vYmFy"],
] as const;

async function testDecoderStream(
  input: string[],
  output: string,
) {
  const stream = ReadableStream.from(input)
    .pipeThrough(new Base64DecoderStream());

  const chunks = await Array.fromAsync(stream);
  assertEquals(chunks.join(""), output);
}
