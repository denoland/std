// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { deepAssign } from "./deep_assign.ts";

test(function deepAssignTest() {
  const obj1 = { deno: { bar: { deno: ["is", "not", "node"] } } };
  const obj2 = { foo: { deno: new Date("1979-05-27T07:32:00Z") } };
  const obj3 = { foo: { bar: "deno" }, reg: RegExp(/DENOWOWO/) };
  const actual = deepAssign(obj1, obj2, obj3);
  const expected = {
    foo: {
      deno: new Date("1979-05-27T07:32:00Z"),
      bar: "deno"
    },
    deno: { bar: { deno: ["is", "not", "node"] } },
    reg: RegExp(/DENOWOWO/)
  };
  assertEquals(actual, expected);
});
