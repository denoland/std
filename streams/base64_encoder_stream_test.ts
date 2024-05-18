// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { Base64EncoderStream } from "./base64_encoder_stream.ts";

const encoder = new TextEncoder();

async function testEncoderStream(
  input: string[],
  output: string,
) {
  const stream = ReadableStream.from(input.map((v) => encoder.encode(v)))
    .pipeThrough(new Base64EncoderStream());

  const chunks = await Array.fromAsync(stream);
  assertEquals(chunks.join(""), output);
}

const testset: [string[], string][] = [
  [[""], ""],
  [["ß"], "w58="],
  [["f"], "Zg=="],
  [["fo"], "Zm8="],
  [["foo"], "Zm9v"],
  [["foob"], "Zm9vYg=="],
  [["fooba"], "Zm9vYmE="],
  [["foobar"], "Zm9vYmFy"],
  [["fo", "o", "bar"], "Zm9vYmFy"],
  [["deno"], "ZGVubw=="],
  [["d", "e", "n", "o"], "ZGVubw=="],
  [["hello world"], "aGVsbG8gd29ybGQ="],
  [["hello", " ", "world"], "aGVsbG8gd29ybGQ="],
];

Deno.test("Base64EncoderStream encodes a stream of binary data", async () => {
  const tests = [];

  for (const [input, output] of testset) {
    tests.push(testEncoderStream(input, output));
  }

  await Promise.all(tests);
});
