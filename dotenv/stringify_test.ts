// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { stringify } from "./stringify.ts";

Deno.test("stringify()", async (t) => {
  await t.step(
    "basic",
    () =>
      assertEquals(
        stringify({ "BASIC": "basic" }),
        `BASIC=basic`,
      ),
  );
  await t.step(
    "comment",
    () =>
      assertEquals(
        stringify({ "#COMMENT": "comment" }),
        ``,
      ),
  );
  await t.step(
    "single quote",
    () =>
      assertEquals(
        stringify({ "QUOTED_SINGLE": "single quoted" }),
        `QUOTED_SINGLE='single quoted'`,
      ),
  );
  await t.step(
    "multiline",
    () =>
      assertEquals(
        stringify({ "MULTILINE": "hello\nworld" }),
        `MULTILINE="hello\\nworld"`,
      ),
  );
  await t.step(
    "whitespace",
    () =>
      assertEquals(
        stringify({ "WHITESPACE": "    whitespace   " }),
        `WHITESPACE='    whitespace   '`,
      ),
  );
  await t.step(
    "equals",
    () =>
      assertEquals(
        stringify({ "EQUALS": "equ==als" }),
        `EQUALS='equ==als'`,
      ),
  );
  await t.step(
    "number",
    () =>
      assertEquals(
        stringify({ "THE_ANSWER": "42" }),
        `THE_ANSWER=42`,
      ),
  );
  await t.step(
    "undefined",
    () =>
      assertEquals(
        stringify(
          { "UNDEFINED": undefined } as unknown as Record<string, string>,
        ),
        `UNDEFINED=`,
      ),
  );
  await t.step(
    "null",
    () =>
      assertEquals(
        stringify({ "NULL": null } as unknown as Record<string, string>),
        `NULL=`,
      ),
  );
});
