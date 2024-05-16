// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { Base64EncoderStream } from "./base64_encoder_stream.ts";

const encoder = new TextEncoder();

async function testEncoderStream(
  input: string[],
  output: string,
  lineLength?: number,
) {
  const stream = ReadableStream.from(input.map((v) => encoder.encode(v)))
    .pipeThrough(new Base64EncoderStream({ lineLength }));

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

Deno.test("Base64EncoderStream divides the encoded strings into lines", async () => {
  await Promise.all([
    testEncoderStream(["hello world"], "aGVsb\r\nG8gd2\r\n9ybGQ\r\n=", 5),
    testEncoderStream(
      [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod ",
        "tempor incididunt ut labore et dolore magna aliqua. Netus et malesuada ",
        "fames ac turpis egestas maecenas pharetra. In hac habitasse platea ",
        "dictumst vestibulum rhoncus est pellentesque elit.",
      ],
      [
        "TG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNlY3RldHVyIGFkaXBpc2NpbmcgZWxpdCwg",
        "c2VkIGRvIGVpdXNtb2QgdGVtcG9yIGluY2lkaWR1bnQgdXQgbGFib3JlIGV0IGRvbG9yZSBtYWdu",
        "YSBhbGlxdWEuIE5ldHVzIGV0IG1hbGVzdWFkYSBmYW1lcyBhYyB0dXJwaXMgZWdlc3RhcyBtYWVj",
        "ZW5hcyBwaGFyZXRyYS4gSW4gaGFjIGhhYml0YXNzZSBwbGF0ZWEgZGljdHVtc3QgdmVzdGlidWx1",
        "bSByaG9uY3VzIGVzdCBwZWxsZW50ZXNxdWUgZWxpdC4=",
      ].join("\r\n"),
      76,
    ),
  ]);
});

Deno.test("Base64EncoderStream throws if lineLength is not a positive integer", () => {
  const stream1 = ReadableStream.from([
    new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]),
  ]);

  assertThrows(
    () => stream1.pipeThrough(new Base64EncoderStream({ lineLength: -1 })),
  );

  const stream2 = ReadableStream.from([
    new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]),
  ]);

  assertThrows(
    () => stream2.pipeThrough(new Base64EncoderStream({ lineLength: 0 })),
  );
});
