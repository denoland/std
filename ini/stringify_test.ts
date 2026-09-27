// Copyright 2018-2026 the Deno authors. MIT license.

import { parse, stringify } from "./mod.ts";
import { assertEquals } from "@std/assert";

Deno.test({
  name: "stringify()",
  fn() {
    assertEquals(stringify({ a: "b" }), "a=b");
    assertEquals(stringify({ a: "b" }, { pretty: true }), "a = b");
    assertEquals(
      stringify({ a: "b", section: { c: "d" }, e: "f" }),
      "a=b\ne=f\n[section]\nc=d",
    );
    assertEquals(
      stringify(
        { dates: { a: new Date("1977-05-25") } },
        { replacer: (_, val) => val?.toJSON() },
      ),
      "[dates]\na=1977-05-25T00:00:00.000Z",
    );
    assertEquals(
      stringify(
        { a: new Date("1977-05-25") },
        { replacer: (_, val) => val?.toJSON() },
      ),
      "a=1977-05-25T00:00:00.000Z",
    );
    assertEquals(
      stringify({ keyA: "1977-05-25", section1: { keyA: 100 } }),
      "keyA=1977-05-25\n[section1]\nkeyA=100",
    );

    assertEquals(stringify({ a: 100 }), "a=100");
    assertEquals(stringify({ a: 100 }, { pretty: true }), "a = 100");
    assertEquals(stringify({ a: "123foo" }), "a=123foo");
    assertEquals(stringify({ a: "foo" }), "a=foo");
    assertEquals(stringify({ a: true }), "a=true");
    assertEquals(stringify({ a: false }), "a=false");
    assertEquals(stringify({ a: null }), "a=null");
    assertEquals(stringify({ a: undefined }), "a=undefined");

    // String values that look like other types must be quoted so that
    // parse(stringify(obj)) preserves the original string value.
    assertEquals(stringify({ a: "true" }), `a="true"`);
    assertEquals(stringify({ a: "false" }), `a="false"`);
    assertEquals(stringify({ a: "null" }), `a="null"`);
    assertEquals(stringify({ a: "123" }), `a="123"`);
    assertEquals(stringify({ a: "0" }), `a="0"`);
    assertEquals(stringify({ a: "3.14" }), `a="3.14"`);
    // Plain strings that cannot be mistaken for another type are not quoted.
    assertEquals(stringify({ a: "hello" }), "a=hello");
    assertEquals(stringify({ a: "123foo" }), "a=123foo");
  },
});

Deno.test({
  name: "stringify() round-trips string values that look like other types",
  fn() {
    // All of these were silently corrupted before the fix: the string was
    // written without quotes and then parsed back as a different type.
    const obj = {
      boolTrue: "true",
      boolFalse: "false",
      nullVal: "null",
      num: "42",
      float: "1.5",
      zero: "0",
    };
    const roundTripped = parse(stringify(obj));
    assertEquals(roundTripped, obj);
  },
});
