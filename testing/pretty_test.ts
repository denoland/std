// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { test } from "./mod.ts";
import { red, green, white, bold, gray } from "../colors/mod.ts";
import { buildDiffMessage, buildMessage, createStr } from "./pretty.ts";
import { assertEquals } from "./asserts.ts";
import diff, { DiffResult } from "./diff.ts";

const createHeader = (): string[] => [
  `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(
    bold("Expected")
  )}`,
  ""
];

const added: (s: string) => string = (s: string): string => green(bold(s));
const removed: (s: string) => string = (s: string): string => red(bold(s));

test({
  name: "Create Str test",
  fn() {
    const expected1 = '"foo"';
    const expected2 = "2";
    const expected3 = ["Array [", "      1,", "      2,", "    ]"].join("\n");
    const expected4 = ["Object {", '      "foo": "bar",', "    }"].join("\n");
    assertEquals(createStr("foo"), expected1);
    assertEquals(createStr(2), expected2);
    assertEquals(createStr([1, 2]), expected3);
    assertEquals(createStr({ foo: "bar" }), expected4);
  }
});

test({
  name: "buildMessage String value",
  fn() {
    const expected = [
      "",
      "",
      `${red(bold("FAIL"))} : assertNotEquals`,
      "",
      `    ${red('Actual   : "foo"')}`,
      `    ${green('Expected : "bar"')}`,
      `    ${white("Expected actual to be different than expected")}`,
      ""
    ];
    assertEquals(
      expected,
      buildMessage(
        "assertNotEquals",
        "foo",
        "bar",
        "Expected actual to be different than expected"
      )
    );
  }
});

test({
  name: "Build Diff Message",
  fn() {
    const actualString = createStr({ a: 1, b: "2", c: 3 });
    const expectedString = createStr({ a: 1, b: 2, c: [3] });
    const diffResult: ReadonlyArray<DiffResult<string>> = diff(
      actualString.split("\n"),
      expectedString.split("\n")
    );
    const out = buildDiffMessage("assertEquals", diffResult).join("\n");
    const testExpect = [
      "",
      "",
      `${red(bold("FAIL"))} : assertEquals`,
      "",
      ...createHeader(),
      white("     Object {"),
      white(`           "a": 1,`),
      added(`+          "b": 2,`),
      added(`+          "c": Array [`),
      added(`+            3,`),
      added(`+          ],`),
      removed(`-          "b": "2",`),
      removed(`-          "c": 3,`),
      white("         }"),
      ""
    ].join("\n");
    assertEquals(out, testExpect);
  }
});
