// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import {
  Base64DecoderStream,
  Base64EncoderStream,
  decodeBase64,
  encodeBase64,
} from "./base64.ts";

const testsetString = [
  ["", ""],
  ["ß", "w58="],
  ["f", "Zg=="],
  ["fo", "Zm8="],
  ["foo", "Zm9v"],
  ["foob", "Zm9vYg=="],
  ["fooba", "Zm9vYmE="],
  ["foobar", "Zm9vYmFy"],
] as const;

const testsetBinary = testsetString.map(([str, b64]) => [
  new TextEncoder().encode(str),
  b64,
]) as Array<[Uint8Array, string]>;

Deno.test("encodeBase64() encodes string", () => {
  for (const [input, output] of testsetString) {
    assertEquals(encodeBase64(input), output);
  }
});

Deno.test("encodeBase64() encodes binary", () => {
  for (const [input, output] of testsetBinary) {
    assertEquals(encodeBase64(input), output);
  }
});

Deno.test("encodeBase64() encodes binary buffer", () => {
  for (const [input, output] of testsetBinary) {
    assertEquals(encodeBase64(input.buffer), output);
  }
});

Deno.test("decodeBase64() decodes binary", () => {
  for (const [input, output] of testsetBinary) {
    const outputBinary = decodeBase64(output);
    assertEquals(outputBinary, input);
  }
});

Deno.test("Base64EncoderStream() encodes stream", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const i = Math.floor(Math.random() * chunk.length);
          controller.enqueue(chunk.slice(0, i));
          controller.enqueue(chunk.slice(i));
        },
      }),
    )
    .pipeThrough(new Base64EncoderStream());

  assertEquals(
    (await Array.fromAsync(readable)).join(""),
    encodeBase64(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("Base64DecoderStream() decodes stream", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new Base64EncoderStream())
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const i = Math.floor(Math.random() * chunk.length);
          controller.enqueue(chunk.slice(0, i));
          controller.enqueue(chunk.slice(i));
        },
      }),
    )
    .pipeThrough(new Base64DecoderStream());

  assertEquals(
    Uint8Array.from(
      (await Array.fromAsync(readable)).map((x) => [...x]).flat(),
    ),
    await Deno.readFile("./deno.lock"),
  );
});
