// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../assert/mod.ts";
import { concatStreams } from "./concat_streams.ts";

Deno.test("concatStreams(streams)", async function () {
  const readable1 = ReadableStream.from([1, 2, 3]);
  const readable2 = ReadableStream.from([4, 5, 6]);
  const readable3 = ReadableStream.from([7, 8, 9]);

  assertEquals(
    await Array.fromAsync(concatStreams([readable1, readable2, readable3])),
    [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ],
  );
});

Deno.test("concatStreams(streams) with empty streams", async function () {
  const readable1 = ReadableStream.from([]);
  const readable2 = ReadableStream.from([]);
  const readable3 = ReadableStream.from([]);

  assertEquals(
    await Array.fromAsync(concatStreams([readable1, readable2, readable3])),
    [],
  );
});

Deno.test("concatStreams(streams) with one empty stream", async function () {
  const readable1 = ReadableStream.from([1, 2, 3]);
  const readable2 = ReadableStream.from([]);
  const readable3 = ReadableStream.from([7, 8, 9]);

  assertEquals(
    await Array.fromAsync(concatStreams([readable1, readable2, readable3])),
    [
      1,
      2,
      3,
      7,
      8,
      9,
    ],
  );
});

Deno.test("concatStreams(streams) handles errors", async () => {
  const readable1 = ReadableStream.from([1, 2, 3]);
  const readable2 = ReadableStream.from(async function* () {
    yield 4;
    yield 5;
    yield 6;
    throw new TypeError("I am an error!");
  }());
  const readable3 = ReadableStream.from([7, 8, 9]);

  const results: number[] = [];
  await assertRejects(
    async () => {
      for await (
        const value of concatStreams([readable1, readable2, readable3])
      ) {
        results.push(value);
      }
    },
    TypeError,
    "I am an error!",
  );
  assertEquals(
    results,
    [
      1,
      2,
      3,
      4,
      5,
      6,
    ],
  );
});
