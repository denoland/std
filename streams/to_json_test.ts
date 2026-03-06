// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toJson } from "./to_json.ts";

Deno.test("toJson()", async () => {
  const strings = [
    "[",
    "1, 2, 3, 4,",
    '{ "a": 2,',
    ' "b": 3,',
    ' "c": 4 }',
    "]",
  ];
  const expected = [1, 2, 3, 4, {
    a: 2,
    b: 3,
    c: 4,
  }];

  const byteStream = ReadableStream.from(strings)
    .pipeThrough(new TextEncoderStream());
  assertEquals(await toJson(byteStream), expected);

  const stringStream = ReadableStream.from(strings);
  assertEquals(await toJson(stringStream), expected);
});
