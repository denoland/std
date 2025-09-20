// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert/equals";
import { consolidateCommon, truncateDiff } from "./_truncate_build_message.ts";
import type { CommonDiffResult } from "@std/internal/types";

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
      false,
      2,
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

Deno.test("consolidateCommon()", async (t) => {
  const commons = [
    { type: "common", value: "[" },
    { type: "common", value: '  "bar-->",' },
    { type: "common", value: '  "bar",' },
    { type: "common", value: '  "bar",' },
    { type: "common", value: '  "bar",' },
    { type: "common", value: '  "<--bar",' },
    { type: "common", value: "]" },
  ] as const;

  const contextLength = 2;

  const cases: {
    location: "start" | "middle" | "end";
    expected: ReadonlyArray<CommonDiffResult<string>>;
  }[] = [
    {
      location: "start",
      expected: [
        { type: "common", value: "[" },
        { type: "truncation", value: "  ... 4 unchanged lines ..." },
        { type: "common", value: '  "<--bar",' },
        { type: "common", value: "]" },
      ],
    },
    {
      location: "middle",
      expected: [
        { type: "common", value: "[" },
        { type: "common", value: '  "bar-->",' },
        { type: "truncation", value: "  ... 3 unchanged lines ..." },
        { type: "common", value: '  "<--bar",' },
        { type: "common", value: "]" },
      ],
    },
    {
      location: "end",
      expected: [
        { type: "common", value: "[" },
        { type: "common", value: '  "bar-->",' },
        { type: "truncation", value: "  ... 4 unchanged lines ..." },
        { type: "common", value: "]" },
      ],
    },
  ];

  for (const { location: extremity, expected } of cases) {
    await t.step(extremity, () => {
      assertEquals(
        consolidateCommon(commons, extremity, false, contextLength),
        expected,
      );
    });
  }
});
