// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { stringify } from "./stringify.ts";
import { parse } from "./parse.ts";

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
});

Deno.test("stringify() round-trips through parse() for tricky values", () => {
  // Regression for https://github.com/denoland/std/issues/7055 — values
  // containing combinations of quotes, apostrophes, real newlines, and
  // literal backslash-n (or other escape-like character pairs) must round-trip
  // losslessly.
  const trickyChars = [
    "'",
    '"',
    "\\",
    "\\n",
    "\\r",
    "\\t",
    "\n",
    "\r",
    "\t",
    "$",
    "{",
    "}",
    " ",
    "=",
  ];

  function combos<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const [first, ...rest] = arr;
    return [
      ...combos(rest, k - 1).map((c) => [first!, ...c]),
      ...combos(rest, k),
    ];
  }

  for (const k of [1, 2, 3]) {
    for (const c of combos(trickyChars, k)) {
      const value = `start_${c.join("")}_end`;
      const roundTripped = parse(stringify({ TEST_VAR: value })).TEST_VAR;
      assertEquals(
        roundTripped,
        value,
        `round-trip mismatch for value ${JSON.stringify(value)}`,
      );
    }
  }
});

Deno.test("stringify() round-trips JSON-encoded payloads", () => {
  const payloads = [
    { foo: "bar" },
    { greeting: "hello\nworld" },
    { quoted: `He said "hi"` },
    { apostrophe: "don't" },
    { mixed: `She said "don't"` },
    { path: "C:\\Users\\test" },
    { literal: "value with \\n inside" },
  ];

  for (const payload of payloads) {
    const encoded = JSON.stringify(payload);
    const roundTripped = parse(stringify({ DATA: encoded })).DATA;
    assertEquals(
      roundTripped,
      encoded,
      `JSON round-trip mismatch for ${encoded}`,
    );
    assertEquals(JSON.parse(roundTripped!), payload);
  }
});
