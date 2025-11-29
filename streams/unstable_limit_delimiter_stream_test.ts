// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { LimitDelimiterStream } from "./unstable_limit_delimiter_stream.ts";

Deno.test("LimitDelimiterStream matching", async function () {
  const input = Uint8Array.from(
    [0, 0, 1, 1, 1, 0, 0, 0, 0, 5, 5, 5, 5, 5, 2, 3, 3, 4, 6, 0, 0, 2, 3, 3],
  );
  const expected = [
    { match: true, value: Uint8Array.from([]) },
    { match: true, value: Uint8Array.from([1, 1, 1]) },
    { match: true, value: Uint8Array.from([]) },
    { match: false, value: Uint8Array.from([5, 5, 5, 5, 5]) },
    { match: true, value: Uint8Array.from([2, 3, 3, 4, 6]) },
    { match: false, value: Uint8Array.from([2, 3, 3]) },
  ];

  const actual = await Array.fromAsync(
    ReadableStream
      .from([input])
      .pipeThrough(
        new LimitDelimiterStream({ delimiter: new Uint8Array(2), limit: 5 }),
      ),
  );

  assertEquals(actual, expected);
});

Deno.test("LimitDelimiterStream splitting", async function () {
  const input = Uint8Array.from(
    [1, 1, 1, 0, 0, 0, 0, 5, 5, 5, 5, 5, 2, 3, 3, 4, 6, 0, 0, 2, 0, 0, 0, 0],
  );
  const expected = [
    { match: true, value: Uint8Array.from([1, 1, 1]) },
    { match: true, value: Uint8Array.from([]) },
    { match: false, value: Uint8Array.from([5, 5, 5, 5, 5]) },
    { match: true, value: Uint8Array.from([2, 3, 3, 4, 6]) },
    { match: true, value: Uint8Array.from([2]) },
    { match: true, value: Uint8Array.from([]) },
  ];

  const actual = await Array.fromAsync(
    ReadableStream
      .from([input])
      .pipeThrough(
        new LimitDelimiterStream({ delimiter: new Uint8Array(2), limit: 5 }),
      ),
  );

  assertEquals(actual, expected);
});
