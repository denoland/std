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
];

Deno.test("Base64DecoderStream decodes a base64-encoded stream", async () => {
  const tests = [];

  for (const [input, output] of testset) {
    tests.push(testDecoderStream(input, output));
  }

  await Promise.all(tests);
});

Deno.test("Base64DecoderStream decodes a base64-encoded stream that has been split into lines", async () => {
  await Promise.all([
    testDecoderStream(["aGVsb\r\nG8gd2\r\n9ybGQ\r\n="], "hello world"),
    testDecoderStream(
      [
        "TG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdCwg\r\n",
        "c2VkIGRvIGVpdXNtb2QgdGVtcG9yIGluY2lkaWR1bnQgdXQgbGFib3JlIGV0IGRvbG9yZSBtYWdu\r\n",
        "YSBhbGlxdWEuIE5ldHVzIGV0IG1hbGVzdWFkYSBmYW1lcyBhYyB0dXJwaXMgZWdlc3RhcyBtYWVj\r\n",
        "ZW5hcyBwaGFyZXRyYS4gSW4gaGFjIGhhYml0YXNzZSBwbGF0ZWEgZGljdHVtc3QgdmVzdGlidWx1\r\n",
        "bSByaG9uY3VzIGVzdCBwZWxsZW50ZXNxdWUgZWxpdC4=",
      ],
      [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod ",
        "tempor incididunt ut labore et dolore magna aliqua. Netus et malesuada ",
        "fames ac turpis egestas maecenas pharetra. In hac habitasse platea ",
        "dictumst vestibulum rhoncus est pellentesque elit.",
      ].join(""),
    ),
  ]);
});
