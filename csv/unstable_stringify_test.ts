// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert/equals";
import { stringify } from "./unstable_stringify.ts";

const CRLF = "\r\n";

Deno.test("(unstable) stringify", async (t) => {
  await t.step(
    {
      name:
        "Object array with no columns, should infer columns from the first array element",
      fn() {
        const data = [{ a: 1 }, { a: 2 }, { b: 3 }];
        const output = `a${CRLF}1${CRLF}2${CRLF}${CRLF}`;
        assertEquals(stringify(data), output);
      },
    },
  );
  await t.step(
    {
      name: "Object array with columns, shouldn't infer columns",
      fn() {
        const data = [{ a: 1 }, { a: 2 }, { b: 3 }];
        const columns = ["a"];
        const output = `a${CRLF}1${CRLF}2${CRLF}${CRLF}`;
        assertEquals(stringify(data, { columns }), output);
      },
    },
  );
});
