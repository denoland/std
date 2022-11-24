// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { MultiReader } from "./multi_reader.ts";
import { StringReader } from "./string_reader.ts";
import { StringWriter } from "./string_writer.ts";
import { copyN } from "./util.ts";
import { copy } from "../streams/conversion.ts";

Deno.test("ioMultiReader", async function () {
  const r = new MultiReader([new StringReader("abc"), new StringReader("def")]);
  const w = new StringWriter();
  const n = await copyN(r, w, 4);
  assertEquals(n, 4);
  assertEquals(w.toString(), "abcd");
  await copy(r, w);
  assertEquals(w.toString(), "abcdef");
});
