// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { test } from "./mod.ts";
import { red, green, white, bold } from "../colors/mod.ts";
import { buildMessage } from "./pretty.ts";
import { assertEquals } from "./asserts.ts";

// const createHeader = (): string[] => [
//   "",
//   "",
//   `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(
//     bold("Expected")
//   )}`,
//   "",
//   ""
// ];

// const added: (s: string) => string = (s: string): string => green(bold(s));
// const removed: (s: string) => string = (s: string): string => red(bold(s));

test({
  name: "buildMessage",
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

// test({
//   name: "failed with number",
//   fn() {
//     assertThrows(
//       () => assertEquals(1, 2),
//       Error,
//       [...createHeader(), removed(`-   1`), added(`+   2`), ""].join("\n")
//     );
//   }
// });

// test({
//   name: "failed with number vs string",
//   fn() {
//     assertThrows(
//       () => assertEquals(1, "1"),
//       Error,
//       [...createHeader(), removed(`-   1`), added(`+   "1"`)].join("\n")
//     );
//   }
// });

// test({
//   name: "failed with array",
//   fn() {
//     assertThrows(
//       () => assertEquals([1, "2", 3], ["1", "2", 3]),
//       Error,
//       [
//         ...createHeader(),
//         white("    Array ["),
//         removed(`-     1,`),
//         added(`+     "1",`),
//         white('      "2",'),
//         white("      3,"),
//         white("    ]"),
//         ""
//       ].join("\n")
//     );
//   }
// });

// test({
//   name: "failed with object",
//   fn() {
//     assertThrows(
//       () => assertEquals({ a: 1, b: "2", c: 3 }, { a: 1, b: 2, c: [3] }),
//       Error,
//       [
//         ...createHeader(),
//         white("    Object {"),
//         white(`      "a": 1,`),
//         added(`+     "b": 2,`),
//         added(`+     "c": Array [`),
//         added(`+       3,`),
//         added(`+     ],`),
//         removed(`-     "b": "2",`),
//         removed(`-     "c": 3,`),
//         white("    }"),
//         ""
//       ].join("\n")
//     );
//   }
// });
