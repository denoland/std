// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { parse } from "./parse.ts";
import { test } from "../../testing/mod.ts";
import { assertEquals } from "../../testing/asserts.ts";

test({
  name: "parsed correctly",
  fn(): void {
    const FIXTURE = `
        test: toto
        foo:
          bar: True
          baz: 1
          qux: ~
        `;

    const ASSERTS = { test: "toto", foo: { bar: true, baz: 1, qux: null } };

    assertEquals(parse(FIXTURE), ASSERTS);
  }
});
