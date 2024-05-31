// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import {
  Base64UrlDecoderStream,
  Base64UrlEncoderStream,
  decodeBase64Url,
  encodeBase64Url,
} from "./base64url.ts";

const testsetString = [
  ["", ""],
  ["ß", "w58"],
  ["f", "Zg"],
  ["fo", "Zm8"],
  ["foo", "Zm9v"],
  ["foob", "Zm9vYg"],
  ["fooba", "Zm9vYmE"],
  ["foobar", "Zm9vYmFy"],
  [">?>d?ß", "Pj8-ZD_Dnw"],
];

const testsetBinary = testsetString.map(([str, b64]) => [
  new TextEncoder().encode(str),
  b64,
]) as Array<[Uint8Array, string]>;

const testsetInvalid = [
  "Pj8/ZD+Dnw",
  "PDw/Pz8+Pg",
  "Pj8/ZD+Dnw==",
  "PDw/Pz8+Pg==",
];

Deno.test("encodeBase64Url() encodes string", () => {
  for (const [input, output] of testsetString) {
    assertEquals(encodeBase64Url(input!), output);
  }
});

Deno.test("encodeBase64Url() encodes binary", () => {
  for (const [input, output] of testsetBinary) {
    assertEquals(encodeBase64Url(input), output);
  }
});

Deno.test("decodeBase64Url() decodes binary", () => {
  for (const [input, output] of testsetBinary) {
    assertEquals(decodeBase64Url(output), input);
  }
});

Deno.test("decodeBase64Url() throws on invalid input", () => {
  for (const invalidb64url of testsetInvalid) {
    assertThrows(
      () => decodeBase64Url(invalidb64url),
      TypeError,
      "invalid character",
    );
  }
});

Deno.test("decodeBase64Url() throws on illegal base64url string", () => {
  const testsetIllegalBase64url = [
    "w58De",
    "Zm9vYmFyy",
    "DPj8-ZD_DnwEg",
    "SGVsbG8gV29ybGQ-_",
  ];

  for (const illegalBase64url of testsetIllegalBase64url) {
    assertThrows(
      () => decodeBase64Url(illegalBase64url),
      TypeError,
      "Illegal base64url string!",
    );
  }
});

Deno.test("Base64UrlEncoderStream() encodes stream", async () => {
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
    .pipeThrough(new Base64UrlEncoderStream());

  assertEquals(
    (await Array.fromAsync(readable)).join(""),
    encodeBase64Url(await Deno.readFile("./deno.lock")),
  );
});

Deno.test("Base64UrlDecoderStream() decodes stream", async () => {
  const readable = (await Deno.open("./deno.lock"))
    .readable
    .pipeThrough(new Base64UrlEncoderStream())
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          const i = Math.floor(Math.random() * chunk.length);
          controller.enqueue(chunk.slice(0, i));
          controller.enqueue(chunk.slice(i));
        },
      }),
    )
    .pipeThrough(new Base64UrlDecoderStream());

  assertEquals(
    Uint8Array.from(
      (await Array.fromAsync(readable)).map((x) => [...x]).flat(),
    ),
    await Deno.readFile("./deno.lock"),
  );
});
