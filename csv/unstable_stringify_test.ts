// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert/equals";
import { stringify } from "./unstable_stringify.ts";
import { assertThrows } from "../assert/throws.ts";

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

  await t.step(
    {
      name: "options.columns is a bool",
      fn() {
        const options = { columns: true };
        const data = [{ a: 1 }];
        assertThrows(
          // @ts-ignore: for test
          () => stringify(data, options),
          "Cannot stringify data as the columns option is invalid: columns must be an array or undefined",
        );
      },
    },
  );

  await t.step(
    {
      name: "options.columns is an object",
      fn() {
        const options = { columns: { v: true } };
        const data = [{ a: 1 }];
        assertThrows(
          // @ts-ignore: for test
          () => stringify(data, options),
          "Cannot stringify data as the columns option is invalid: columns must be an array or undefined",
        );
      },
    },
  );

  await t.step(
    {
      name: "options.columns is a number",
      fn() {
        const options = { columns: 127 };
        const data = [{ a: 1 }];
        assertThrows(
          // @ts-ignore: for test
          () => stringify(data, options),
          "Cannot stringify data as the columns option is invalid: columns must be an array or undefined",
        );
      },
    },
  );

  await t.step(
    {
      name: "options.columns is a string",
      fn() {
        const options = { columns: "i am a string" };
        const data = [{ a: 1 }];
        assertThrows(
          // @ts-ignore: for test
          () => stringify(data, options),
          "Cannot stringify data as the columns option is invalid: columns must be an array or undefined",
        );
      },
    },
  );
});
