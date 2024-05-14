// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertEquals } from "@std/assert/assert-equals";
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
