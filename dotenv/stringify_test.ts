// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
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
  await t.step("handles single-quote characters", () =>
    assertEquals(
      stringify({ PARSE: "par'se" }),
      `PARSE="par'se"`,
    ));
  await t.step("handles double-quote characters", () =>
    assertEquals(
      stringify({ JSON: '{"key":"value"}' }),
      `JSON='{"key":"value"}'`,
    ));
  await t.step("handles both quote characters", () =>
    assertEquals(
      stringify({ MIXED: `a'b"c` }),
      `MIXED="a'b\\"c"`,
    ));
  await t.step("handles backslash with double quotes", () =>
    assertEquals(
      stringify({ BS: String.raw`test\"value` }),
      `BS="test\\\\\\"value"`,
    ));
  await t.step("handles newline with single quotes", () =>
    assertEquals(
      stringify({ NL: "hello\nit's me" }),
      `NL="hello\\nit's me"`,
    ));
});
