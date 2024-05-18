// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { Base64DecoderStream } from "./base64_decoder_stream.ts";

async function testDecoderStream(
  input: string[],
  output: string,
) {
  const stream = ReadableStream.from(input)
    .pipeThrough(new Base64DecoderStream())
    .pipeThrough(new TextDecoderStream());

  const chunks = await Array.fromAsync(stream);
  assertEquals(chunks.join(""), output);
}

const testset: [string[], string][] = [
  [[""], ""],
  [["w58="], "ß"],
  [["Zg=="], "f"],
  [["Zm8="], "fo"],
  [["Zm9v"], "foo"],
  [["Zm9vYg=="], "foob"],
  [["Zm9vYmE="], "fooba"],
  [["Zm9vYmFy"], "foobar"],
  [["aGVs", "bG8g", "d29y", "bGQ="], "hello world"],
  [["aG", "VsbG8g", "d29", "ybG", "Q="], "hello world"],
];

Deno.test("Base64DecoderStream decodes a base64-encoded stream", async () => {
  const tests = [];

  for (const [input, output] of testset) {
    tests.push(testDecoderStream(input, output));
  }

  await Promise.all(tests);
});
