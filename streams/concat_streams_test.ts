// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import { ConcatStreams } from "./concat_streams.ts";

Deno.test("ConcatStreams()", async () => {
  const stream1 = ReadableStream.from([1, 2, 3]);
  const stream2 = ReadableStream.from([4, 5, 6]);
  const stream3 = ReadableStream.from([7, 8, 9]);
  const concatStream = ReadableStream
    .from([stream1, stream2, stream3])
    .pipeThrough(new ConcatStreams());
  const result = await Array.fromAsync(concatStream);
  assertEquals(result, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

Deno.test("ConcatStreams() with empty streams", async () => {
  const stream1 = ReadableStream.from([]);
  const stream2 = ReadableStream.from([]);
  const stream3 = ReadableStream.from([]);
  const concatStream = ReadableStream
    .from([stream1, stream2, stream3])
    .pipeThrough(new ConcatStreams());
  const result = await Array.fromAsync(concatStream);
  assertEquals(result, []);
});

Deno.test("ConcatStreams() with one empty stream", async () => {
  const stream1 = ReadableStream.from([1, 2, 3]);
  const stream2 = ReadableStream.from([]);
  const stream3 = ReadableStream.from([7, 8, 9]);
  const concatStream = ReadableStream
    .from([stream1, stream2, stream3])
    .pipeThrough(new ConcatStreams());
  const result = await Array.fromAsync(concatStream);
  assertEquals(result, [1, 2, 3, 7, 8, 9]);
});

Deno.test("ConcatStreams() handles errors", async () => {
  const stream1 = ReadableStream.from([1, 2, 3]);
  const stream2 = ReadableStream.from({
    async *[Symbol.asyncIterator]() {
      yield 4;
      yield 5;
      throw new TypeError("I am an error.");
    },
  });
  const stream3 = ReadableStream.from([7, 8, 9]);
  const concatStream = ReadableStream
    .from([stream1, stream2, stream3])
    .pipeThrough(new ConcatStreams());
  const results: number[] = [];
  await assertRejects(
    async () => {
      for await (const value of concatStream) {
        results.push(value);
      }
    },
    TypeError,
    "I am an error.",
  );
  assertEquals(results, [1, 2, 3, 4, 5]);
});
