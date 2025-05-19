// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { bgGreen, bgRed, bold, gray, green, red, white } from "@std/fmt/colors";
import {
  buildMessage,
  consolidateCommon,
  createColor,
  createSign,
  truncateDiff,
} from "./build_message.ts";

Deno.test("buildMessage()", async (t) => {
  const prelude = [
    "",
    "",
    `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${
      green(bold("Expected"))
    }`,
    "",
    "",
  ];

  await t.step("basic", () => {
    assertEquals(buildMessage([]), [...prelude, ""]);
    assertEquals(
      buildMessage([
        { type: "added", value: "foo" },
        { type: "removed", value: "bar" },
      ]),
      [...prelude, green(bold("+   foo")), red(bold("-   bar")), ""],
    );
  });

  await t.step("truncated", () => {
    assertEquals(
      buildMessage(
        [
          { type: "added", value: "foo" },
          { type: "common", value: "bar 1" },
          { type: "common", value: "bar 2" },
          { type: "common", value: "bar 3" },
          { type: "common", value: "bar 4" },
          { type: "common", value: "bar 5" },
          { type: "added", value: "foo" },
          { type: "common", value: "bar 1" },
          { type: "common", value: "bar 2" },
          { type: "common", value: "bar 3" },
          { type: "common", value: "bar 4" },
          { type: "common", value: "bar 5" },
          { type: "common", value: "bar 6" },
          { type: "removed", value: "baz" },
          { type: "common", value: "bar" },
        ],
        {},
        {
          minTruncationLength: 0,
          truncationSpanLength: 5,
          truncationContextLength: 2,
          truncationExtremityLength: 1,
        },
      ),
      [
        ...prelude,
        green(bold("+   foo")),
        white("    bar 1"),
        white("    bar 2"),
        white("    bar 3"),
        white("    bar 4"),
        white("    bar 5"),
        green(bold("+   foo")),
        white("    bar 1"),
        white("    bar 2"),
        gray("    ... 2 unchanged lines ..."),
        white("    bar 5"),
        white("    bar 6"),
        red(bold("-   baz")),
        white("    bar"),
        "",
      ],
    );
  });
});

Deno.test("createColor()", () => {
  assertEquals(createColor("added")("foo"), green(bold("foo")));
  assertEquals(createColor("removed")("foo"), red(bold("foo")));
  assertEquals(createColor("common")("foo"), white("foo"));
  assertEquals(createColor("added", true)("foo"), bgGreen(white("foo")));
  assertEquals(createColor("removed", true)("foo"), bgRed(white("foo")));
  assertEquals(createColor("common", true)("foo"), white("foo"));
});

Deno.test("createSign()", () => {
  assertEquals(createSign("added"), "+   ");
  assertEquals(createSign("removed"), "-   ");
  assertEquals(createSign("common"), "    ");
  // deno-lint-ignore no-explicit-any
  assertEquals(createSign("unknown" as any), "    ");
});

Deno.test("consolidateDiff()", () => {
  assertEquals(
    truncateDiff(
      [
        { type: "added", value: "foo" },
        { type: "common", value: "[" },
        { type: "common", value: '  "bar-->",' },
        { type: "common", value: '  "bar",' },
        { type: "common", value: '  "bar",' },
        { type: "common", value: '  "<--bar",' },
        { type: "common", value: "]" },
        { type: "removed", value: "foo" },
      ],
      {},
      {
        minTruncationLength: 0,
        truncationSpanLength: 5,
        truncationContextLength: 2,
        truncationExtremityLength: 1,
      },
    ),
    [
      { type: "added", value: "foo" },
      { type: "common", value: "[" },
      { type: "common", value: '  "bar-->",' },
      { type: "truncation", value: "  ... 2 unchanged lines ..." },
      { type: "common", value: '  "<--bar",' },
      { type: "common", value: "]" },
      { type: "removed", value: "foo" },
    ],
  );
});

Deno.test("consolidateCommon()", () => {
  assertEquals(
    consolidateCommon(
      [
        { type: "common", value: "[" },
        { type: "common", value: '  "bar-->",' },
        { type: "common", value: '  "bar",' },
        { type: "common", value: '  "bar",' },
        { type: "common", value: '  "bar",' },
        { type: "common", value: '  "<--bar",' },
        { type: "common", value: "]" },
      ],
      "none",
      {},
      {
        minTruncationLength: 0,
        truncationSpanLength: 5,
        truncationContextLength: 2,
        truncationExtremityLength: 1,
      },
    ),
    [
      { type: "common", value: "[" },
      { type: "common", value: '  "bar-->",' },
      { type: "truncation", value: "  ... 3 unchanged lines ..." },
      { type: "common", value: '  "<--bar",' },
      { type: "common", value: "]" },
    ],
  );
});
