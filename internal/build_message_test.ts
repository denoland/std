// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { bgGreen, bgRed, bold, gray, green, red, white } from "@std/fmt/colors";
import { buildMessage, createColor, createSign } from "./build_message.ts";
import { truncateDiff } from "@std/internal/truncate-build-message";
import type { DiffResult } from "@std/internal/types";

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
        (diffResult: ReadonlyArray<DiffResult<string>>, stringDiff: boolean) =>
          truncateDiff(diffResult, stringDiff, 2),
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
