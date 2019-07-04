// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { stringify } from "./mod.ts";

test({
  name: "stringified correctly",
  fn(): void {
    const FIXTURE = {
      foo: {
        bar: true,
        test: [
          "a",
          "b",
          {
            a: false
          },
          {
            a: false
          }
        ]
      },
      test: "foobar"
    };

    const ASSERTS = `foo:
  bar: true
  test:
    - a
    - b
    - a: false
    - a: false
test: foobar
`;

    assertEquals(stringify(FIXTURE), ASSERTS);
  }
});
