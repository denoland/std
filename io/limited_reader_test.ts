// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { LimitedReader, StringReader } from "./readers.ts";
import { StringWriter } from "./writers.ts";
import { copy, readAll } from "../streams/conversion.ts";

Deno.test("ioLimitedReader", async function () {
  const decoder = new TextDecoder();
  let sr = new StringReader("abc");
  let r = new LimitedReader(sr, 2);
  let buffer = await readAll(r);
  assertEquals(decoder.decode(buffer), "ab");
  assertEquals(decoder.decode(await readAll(sr)), "c");
  sr = new StringReader("abc");
  r = new LimitedReader(sr, 3);
  buffer = await readAll(r);
  assertEquals(decoder.decode(buffer), "abc");
  assertEquals((await readAll(r)).length, 0);
  sr = new StringReader("abc");
  r = new LimitedReader(sr, 4);
  buffer = await readAll(r);
  assertEquals(decoder.decode(buffer), "abc");
  assertEquals((await readAll(r)).length, 0);
});

Deno.test("ioLimitedReader", async function () {
  const rb = new StringReader("abc");
  const wb = new StringWriter();
  await copy(new LimitedReader(rb, -1), wb);
  assertEquals(wb.toString(), "");
});
