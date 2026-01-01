// Copyright 2018-2026 the Deno authors. MIT license.

import { createDetails, diffStr, tokenize, unescape } from "./diff_str.ts";
import { assertEquals } from "@std/assert";

Deno.test({
  name: 'diff() "a" vs "b" (diffstr)',
  fn() {
    const diffResult = diffStr("a", "b");
    assertEquals(diffResult, [
      {
        details: [
          { type: "removed", value: "a" },
          { type: "common", value: "\n" },
        ],
        type: "removed",
        value: "a\n",
      },
      {
        details: [
          { type: "added", value: "b" },
          { type: "common", value: "\n" },
        ],
        type: "added",
        value: "b\n",
      },
    ]);
  },
});

Deno.test({
  name: 'diff() "a b c d" vs "a b x d e" (diffStr)',
  fn() {
    const diffResult = diffStr(
      [..."abcd"].join("\n"),
      [..."abxde"].join("\n"),
    );
    assertEquals(diffResult, [
      { type: "common", value: "a\\n\n" },
      { type: "common", value: "b\\n\n" },
      {
        type: "added",
        value: "x\\n\n",
        details: [
          { type: "added", value: "x" },
          { type: "common", value: "\\n" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "added",
        value: "d\\n\n",
        details: [
          { type: "common", value: "d" },
          { type: "added", value: "\\n" },
          { type: "common", value: "\n" },
        ],
      },
      { type: "added", value: "e\n" },
      {
        type: "removed",
        value: "c\\n\n",
        details: [
          { type: "removed", value: "c" },
          { type: "common", value: "\\n" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "removed",
        value: "d\n",
        details: [
          { type: "common", value: "d" },
          { type: "common", value: "\n" },
        ],
      },
    ]);
  },
});

Deno.test({
  name: 'diff() "a b" vs "a  b" (diffstr)',
  fn() {
    const diffResult = diffStr("a b", "a  b");
    assertEquals(diffResult, [
      {
        details: [
          { type: "common", value: "a" },
          { type: "removed", value: " " },
          { type: "common", value: "b" },
          { type: "common", value: "\n" },
        ],
        type: "removed",
        value: "a b\n",
      },
      {
        details: [
          { type: "common", value: "a" },
          { type: "added", value: "  " },
          { type: "common", value: "b" },
          { type: "common", value: "\n" },
        ],
        type: "added",
        value: "a  b\n",
      },
    ]);
  },
});

Deno.test({
  name: `diff() "3.14" vs "2.71" (diffStr)`,
  fn() {
    const diffResult = diffStr("3.14", "2.71");
    assertEquals(diffResult, [
      {
        type: "removed",
        value: "3.14\n",
        details: [
          {
            type: "removed",
            value: "3",
          },
          {
            type: "common",
            value: ".",
          },
          {
            type: "removed",
            value: "14",
          },
          {
            type: "common",
            value: "\n",
          },
        ],
      },
      {
        type: "added",
        value: "2.71\n",
        details: [
          {
            type: "added",
            value: "2",
          },
          {
            type: "common",
            value: ".",
          },
          {
            type: "added",
            value: "71",
          },
          {
            type: "common",
            value: "\n",
          },
        ],
      },
    ]);
  },
});

Deno.test({
  name: `diff() single line "a b" vs "c d" (diffStr)`,
  fn() {
    const diffResult = diffStr("a b", "c d");
    assertEquals(diffResult, [
      {
        type: "removed",
        value: "a b\n",
        details: [
          { type: "removed", value: "a" },
          { type: "removed", value: " " },
          { type: "removed", value: "b" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "added",
        value: "c d\n",
        details: [
          { type: "added", value: "c" },
          { type: "added", value: " " },
          { type: "added", value: "d" },
          { type: "common", value: "\n" },
        ],
      },
    ]);
  },
});

Deno.test({
  name: `diff() single line, different word length "a bc" vs "cd e" (diffStr)`,
  fn() {
    const diffResult = diffStr("a bc", "cd e");
    assertEquals(diffResult, [
      {
        type: "removed",
        value: "a bc\n",
        details: [
          { type: "removed", value: "a" },
          { type: "removed", value: " " },
          { type: "removed", value: "bc" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "added",
        value: "cd e\n",
        details: [
          { type: "added", value: "cd" },
          { type: "added", value: " " },
          { type: "added", value: "e" },
          { type: "common", value: "\n" },
        ],
      },
    ]);
  },
});

Deno.test({
  name: `diff() single line, "a\tb" vs "a\fb" (diffStr)`,
  fn() {
    const diffResult = diffStr("a\tb", "a\fb");
    assertEquals(diffResult, [
      {
        type: "removed",
        value: "a\\tb\n",
        details: [
          { type: "common", value: "a" },
          { type: "removed", value: "\\t" },
          { type: "common", value: "b" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "added",
        value: "a\\fb\n",
        details: [
          { type: "common", value: "a" },
          { type: "added", value: "\\f" },
          { type: "common", value: "b" },
          { type: "common", value: "\n" },
        ],
      },
    ]);
  },
});

Deno.test({
  name: `diff() single line, "a\\\\tb" vs "a\tb" (diffStr)`,
  fn() {
    const diffResult = diffStr("a\\tb", "a\tb");
    assertEquals(diffResult, [
      {
        type: "removed",
        value: "a\\\\tb\n",
        details: [
          { type: "common", value: "a" },
          { type: "removed", value: "\\\\" },
          { type: "removed", value: "tb" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "added",
        value: "a\\tb\n",
        details: [
          { type: "common", value: "a" },
          { type: "added", value: "\\t" },
          { type: "added", value: "b" },
          { type: "common", value: "\n" },
        ],
      },
    ]);
  },
});

Deno.test({
  name: `diff() "\\b\\f\\r\\t\\v\\n" vs "\\r\\n" (diffStr)`,
  fn() {
    const diffResult = diffStr("\b\f\r\t\v\n", "\r\n");
    assertEquals(diffResult, [
      {
        type: "removed",
        value: "\\b\\f\\r\\t\\v\\n\n",
        details: [
          { type: "removed", value: "\\b\\f" },
          { type: "common", value: "\\r" },
          { type: "removed", value: "\\t\\v" },
          { type: "common", value: "\\n" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "added",
        value: "\\r\\n\r\n",
        details: [
          { type: "common", value: "\\r" },
          { type: "common", value: "\\n" },
          { type: "added", value: "\r" },
          { type: "common", value: "\n" },
        ],
      },
      { type: "common", value: "\n" },
    ]);
  },
});

Deno.test({
  name: "diff() multiline with more removed lines",
  fn() {
    const diffResult = diffStr("a\na", "e");
    assertEquals(diffResult, [
      {
        type: "removed",
        value: "a\\n\n",
      },
      {
        type: "removed",
        value: "a\n",
        details: [
          { type: "removed", value: "a" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "added",
        value: "e\n",
        details: [
          { type: "added", value: "e" },
          { type: "common", value: "\n" },
        ],
      },
    ]);
  },
});

Deno.test({
  name: "createDetails()",
  fn() {
    const tokens = [
      { type: "added", value: "a" },
      { type: "removed", value: "b" },
      { type: "common", value: "c" },
    ] as const;
    for (const token of tokens) {
      assertEquals(
        createDetails(token, [...tokens]),
        tokens.filter(({ type }) => type === token.type || type === "common"),
      );
    }
  },
});

Deno.test({
  name: "tokenize()",
  fn() {
    assertEquals(tokenize("a\nb"), ["a\n", "b"]);
    assertEquals(tokenize("a\r\nb"), ["a\r\n", "b"]);
    assertEquals(tokenize("a\nb\n"), ["a\n", "b\n"]);
    assertEquals(tokenize("a b"), ["a b"]);
    assertEquals(tokenize("a b", true), ["a", " ", "b"]);
    assertEquals(tokenize("abc bcd", true), ["abc", " ", "bcd"]);
    assertEquals(tokenize("abc ", true), ["abc", " "]);
  },
});

Deno.test({
  name: "unescape()",
  fn() {
    assertEquals(unescape("Hello\nWorld"), "Hello\\n\nWorld");
    assertEquals(unescape("a\b"), "a\\b");
    assertEquals(unescape("a\f"), "a\\f");
    assertEquals(unescape("a\t"), "a\\t");
    assertEquals(unescape("a\v"), "a\\v");
    assertEquals(unescape("a\r"), "a\\r");
    assertEquals(unescape("a\n"), "a\\n\n");
    assertEquals(unescape("a\r\n"), "a\\r\\n\r\n");
  },
});
