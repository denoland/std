// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert/assert-equals";
import { toJson } from "./to_json.ts";

Deno.test("toJson()", async () => {
  const byteStream = ReadableStream.from(["[", "1, 2, 3, 4", "]"])
    .pipeThrough(new TextEncoderStream());
  assertEquals(await toJson(byteStream), [1, 2, 3, 4]);
});
