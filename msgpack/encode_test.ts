// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import * as path from "../path/mod.ts";
import { decode, encode } from "./mod.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("testdata", () => {
  const one = JSON.parse(
    Deno.readTextFileSync(path.join(testdataDir, "1.json")),
  );
  assertEquals(decode(encode(one)), one);

  const two = JSON.parse(
    Deno.readTextFileSync(path.join(testdataDir, "2.json")),
  );
  assertEquals(decode(encode(two)), two);

  const three = JSON.parse(
    Deno.readTextFileSync(path.join(testdataDir, "3.json")),
  );
  assertEquals(decode(encode(three)), three);

  const four = JSON.parse(
    Deno.readTextFileSync(path.join(testdataDir, "4.json")),
  );
  assertEquals(decode(encode(four)), four);

  const five = JSON.parse(
    Deno.readTextFileSync(path.join(testdataDir, "5.json")),
  );
  assertEquals(decode(encode(five)), five);
});

Deno.test("positive numbers", () => {
  assertEquals(encode(1), new Uint8Array([1]));
  assertEquals(decode(encode(1)), 1);

  assertEquals(encode(255), new Uint8Array([0xcc, 255]));
  assertEquals(decode(encode(255)), 255);

  assertEquals(encode(2000), new Uint8Array([0xcd, 7, 208]));
  assertEquals(decode(encode(2000)), 2000);

  assertEquals(encode(70000), new Uint8Array([0xce, 0, 1, 17, 112]));
  assertEquals(decode(encode(70000)), 70000);

  assertEquals(
    encode(20000000000),
    new Uint8Array([0xcf, 0, 0, 0, 4, 168, 23, 200, 0]),
  );
  assertEquals(decode(encode(20000000000)), 20000000000n); // just a technicality of the decoder
});

Deno.test("negative numbers", () => {
  assertEquals(encode(-1), new Uint8Array([255]));
  assertEquals(decode(encode(-1)), -1);

  assertEquals(encode(-127), new Uint8Array([0xd0, 129]));
  assertEquals(decode(encode(-127)), -127);

  assertEquals(encode(-1000), new Uint8Array([0xd1, 252, 24]));
  assertEquals(decode(encode(-1000)), -1000);

  assertEquals(encode(-60000), new Uint8Array([0xd2, 255, 255, 21, 160]));
  assertEquals(decode(encode(-60000)), -60000);

  assertEquals(
    encode(-600000000000),
    new Uint8Array([0xd3, 255, 255, 255, 116, 77, 54, 144, 0]),
  );
  assertEquals(decode(encode(-600000000000)), -600000000000n); // see above
});

Deno.test("floats", () => {
  assertEquals(
    encode(0.3),
    new Uint8Array([0xcb, 63, 211, 51, 51, 51, 51, 51, 51]),
  );
  assertEquals(decode(encode(0.3)), 0.3);
});

Deno.test("strings", () => {
  assertEquals(
    encode("hello world"),
    new Uint8Array([171, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]),
  );
  assertEquals(decode(encode("hello world")), "hello world");

  const mediumString = "a".repeat(255);
  assertEquals(
    encode(mediumString),
    new Uint8Array([0xd9, 255, ...new Array(mediumString.length).fill(97)]),
  );
  assertEquals(decode(encode(mediumString)), mediumString);

  const longString = "a".repeat(256);
  assertEquals(
    encode(longString),
    new Uint8Array([0xda, 1, 0, ...new Array(longString.length).fill(97)]),
  );
  assertEquals(decode(encode(longString)), longString);

  const reallyLongString = "a".repeat(65536);
  assertEquals(
    encode(reallyLongString),
    new Uint8Array([
      0xdb,
      0,
      1,
      0,
      0,
      ...new Array(reallyLongString.length).fill(97),
    ]),
  );
  assertEquals(decode(encode(reallyLongString)), reallyLongString);
});

Deno.test("arrays", () => {
  const arr0: never[] = [];
  assertEquals(decode(encode(arr0)), arr0);

  const arr1 = [1, 2, 3, 4, 5, 6];
  assertEquals(decode(encode(arr1)), arr1);

  const arr2 = new Array(256).fill(0);
  assertEquals(decode(encode(arr2)), arr2);

  const nestedArr = [[1, 2, 3], [1, 2], 5];
  assertEquals(decode(encode(nestedArr)), nestedArr);
});

Deno.test("maps", () => {
  const map0 = {};
  assertEquals(decode(encode(map0)), map0);

  const map1 = { "a": 0, "b": 2, "c": "three", "d": null };
  assertEquals(decode(encode(map1)), map1);

  const nestedMap = { "a": -1, "b": 2, "c": "three", "d": null, "e": map1 };
  assertEquals(decode(encode(nestedMap)), nestedMap);
});
