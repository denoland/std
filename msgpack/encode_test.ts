// Copyright 2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { decode, encode } from "./mod.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("testdata", () => {
  const one = Deno.readTextFileSync(path.join(testdataDir, "1.json"));
  assertEquals(decode(encode(one)), one);

  const two = Deno.readTextFileSync(path.join(testdataDir, "2.json"));
  assertEquals(decode(encode(two)), two);

  const three = Deno.readTextFileSync(path.join(testdataDir, "3.json"));
  assertEquals(decode(encode(three)), three);

  const four = Deno.readTextFileSync(path.join(testdataDir, "4.json"));
  assertEquals(decode(encode(four)), four);

  const five = Deno.readTextFileSync(path.join(testdataDir, "5.json"));
  assertEquals(decode(encode(five)), five);
});
