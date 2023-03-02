// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { readableStreamFromIterable } from "./readable_stream_from_iterable.ts";

Deno.test("[streams] readableStreamFromIterable() array", async function () {
  const strings: string[] = ["hello", "deno", "land"];
  const encoder = new TextEncoder();
  const readableStream = readableStreamFromIterable(
    strings.map((s) => encoder.encode(s)),
  );

  const readStrings = [];
  const decoder = new TextDecoder();
  for await (const chunk of readableStream) {
    readStrings.push(decoder.decode(chunk));
  }

  assertEquals(readStrings, strings);
});

Deno.test("[streams] readableStreamFromIterable() generator", async function () {
  const strings: string[] = ["hello", "deno", "land"];
  const readableStream = readableStreamFromIterable((function* () {
    const encoder = new TextEncoder();
    for (const string of strings) {
      yield encoder.encode(string);
    }
  })());

  const readStrings = [];
  const decoder = new TextDecoder();
  for await (const chunk of readableStream) {
    readStrings.push(decoder.decode(chunk));
  }

  assertEquals(readStrings, strings);
});

Deno.test("[streams] readableStreamFromIterable() cancel", async function () {
  let generatorError = null;
  const readable = readableStreamFromIterable(async function* () {
    try {
      yield "foo";
    } catch (error) {
      generatorError = error;
    }
  }());
  const reader = readable.getReader();
  assertEquals(await reader.read(), { value: "foo", done: false });
  const cancelReason = new Error("Cancelled by consumer.");
  await reader.cancel(cancelReason);
  assertEquals(generatorError, cancelReason);
});
