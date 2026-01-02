// Copyright 2018-2026 the Deno authors. MIT license.

import { stringify } from "./mod.ts";
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
  },
});
