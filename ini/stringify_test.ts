// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { stringify, type StringifyOptions } from "./mod.ts";
import { assertEquals } from "@std/assert";

function assertValidStringify(
  obj: unknown,
  expected: unknown,
  options?: StringifyOptions,
) {
  assertEquals(stringify(obj, options), expected);
}

Deno.test({
  name: "stringify()",
  fn() {
    assertValidStringify({ a: "b" }, `a=b`);
    assertValidStringify({ a: "b" }, `a = b`, { pretty: true });
    assertValidStringify(
      { a: "b", section: { c: "d" }, e: "f" },
      `a=b\ne=f\n[section]\nc=d`,
    );
    assertValidStringify(
      { dates: { a: new Date("1977-05-25") } },
      `[dates]\na=1977-05-25T00:00:00.000Z`,
      { replacer: (_, val) => val?.toJSON() },
    );
    assertValidStringify({
      keyA: "1977-05-25",
      section1: { keyA: 100 },
    }, `keyA=1977-05-25\n[section1]\nkeyA=100`);

    assertValidStringify({ a: 100 }, `a=100`);
    assertValidStringify({ a: 100 }, `a = 100`, { pretty: true });
    assertValidStringify({ a: "123foo" }, `a=123foo`);
    assertValidStringify({ a: "foo" }, `a=foo`);
    assertValidStringify({ a: true }, `a=true`);
    assertValidStringify({ a: false }, `a=false`);
    assertValidStringify({ a: null }, `a=null`);
    assertValidStringify({ a: undefined }, `a=undefined`);
  },
});
