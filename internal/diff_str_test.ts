// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { diffStr } from "./diff_str.ts";
import { assertEquals } from "@std/assert/assert-equals";

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
          { type: "common", value: "\\" },
          { type: "common", value: "n" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "added",
        value: "d\\n\n",
        details: [
          { type: "common", value: "d" },
          { type: "added", value: "\\" },
          { type: "added", value: "n" },
          { type: "common", value: "\n" },
        ],
      },
      { type: "added", value: "e\n" },
      {
        type: "removed",
        value: "c\\n\n",
        details: [
          { type: "removed", value: "c" },
          { type: "common", value: "\\" },
          { type: "common", value: "n" },
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
  name: `diff() "\\b\\f\\r\\t\\v\\n" vs "\\r\\n" (diffStr)`,
  fn() {
    const diffResult = diffStr("\b\f\r\t\v\n", "\r\n");
    assertEquals(diffResult, [
      {
        type: "removed",
        value: "\\b\\f\\r\\t\\v\\n\n",
        details: [
          { type: "common", value: "\\" },
          { type: "removed", value: "b" },
          { type: "removed", value: "\\" },
          { type: "removed", value: "f" },
          { type: "removed", value: "\\" },
          { type: "common", value: "r" },
          { type: "common", value: "\\" },
          { type: "removed", value: "t" },
          { type: "removed", value: "\\" },
          { type: "removed", value: "v" },
          { type: "removed", value: "\\" },
          { type: "common", value: "n" },
          { type: "common", value: "\n" },
        ],
      },
      {
        type: "added",
        value: "\\r\\n\r\n",
        details: [
          { type: "common", value: "\\" },
          { type: "common", value: "r" },
          { type: "common", value: "\\" },
          { type: "common", value: "n" },
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
