// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { stringify, StringifyOptions } from "./mod.ts";
import { assertEquals } from "../assert/mod.ts";

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
    assertValidStringify({ a: "b" }, `a : b`, {
      assignment: ":",
      pretty: true,
    });
    assertValidStringify(
      { a: "b", section: { c: "d" }, e: "f" },
      `a=b\ne=f\n[section]\nc=d`,
    );
    assertValidStringify(
      { dates: { a: new Date("1977-05-25") } },
      `[dates]\na=1977-05-25T00:00:00.000Z`,
      { replacer: (_, val) => val?.toJSON() },
    );
  },
});
