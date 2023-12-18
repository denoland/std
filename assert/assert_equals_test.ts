// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, AssertionError, assertThrows } from "./mod.ts";
import {
  bold,
  gray,
  green,
  red,
  stripAnsiCode,
  yellow,
} from "../fmt/colors.ts";

const createHeader = (): string[] => [
  "",
  "",
  `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${
    green(
      bold("Expected"),
    )
  }`,
  "",
  "",
];

const added: (s: string) => string = (s: string): string =>
  green(bold(stripAnsiCode(s)));
const removed: (s: string) => string = (s: string): string =>
  red(bold(stripAnsiCode(s)));

Deno.test({
  name: "assertEquals() matches when values are equal",
  fn() {
    assertEquals({ a: 10 }, { a: 10 });
    assertEquals(true, true);
    assertEquals(10, 10);
    assertEquals("abc", "abc");
    assertEquals({ a: 10, b: { c: "1" } }, { a: 10, b: { c: "1" } });
    assertEquals(new Date("invalid"), new Date("invalid"));
  },
});

Deno.test({
  name: "assertEquals() throws when numbers are not equal",
  fn() {
    assertThrows(
      () => assertEquals(1, 2),
      AssertionError,
      [
        "Values are not equal.",
        ...createHeader(),
        removed(`-   ${yellow("1")}`),
        added(`+   ${yellow("2")}`),
        "",
      ].join("\n"),
    );
  },
});

Deno.test({
  name: "assertEquals() throws when types are not equal",
  fn() {
    assertThrows(
      () => assertEquals<unknown>(1, "1"),
      AssertionError,
      [
        "Values are not equal.",
        ...createHeader(),
        removed(`-   ${yellow("1")}`),
        added(`+   "1"`),
      ].join("\n"),
    );
  },
});

Deno.test({
  name: "assertEquals() throws when array elements are not equal",
  fn() {
    assertThrows(
      () => assertEquals([1, "2", 3], ["1", "2", 3]),
      AssertionError,
      `
    [
-     1,
+     "1",
      "2",
      3,
    ]`,
    );
  },
});

Deno.test({
  name: "assertEquals() throws when object elements are not equal",
  fn() {
    assertThrows(
      () => assertEquals({ a: 1, b: "2", c: 3 }, { a: 1, b: 2, c: [3] }),
      AssertionError,
      `
    {
      a: 1,
+     b: 2,
+     c: [
+       3,
+     ],
-     b: "2",
-     c: 3,
    }`,
    );
  },
});

Deno.test({
  name: "assertEquals() throws when dates are not equal",
  fn() {
    assertThrows(
      () =>
        assertEquals(
          new Date(2019, 0, 3, 4, 20, 1, 10),
          new Date(2019, 0, 3, 4, 20, 1, 20),
        ),
      AssertionError,
      [
        "Values are not equal.",
        ...createHeader(),
        removed(`-   ${new Date(2019, 0, 3, 4, 20, 1, 10).toISOString()}`),
        added(`+   ${new Date(2019, 0, 3, 4, 20, 1, 20).toISOString()}`),
        "",
      ].join("\n"),
    );
    assertThrows(
      () =>
        assertEquals(new Date("invalid"), new Date(2019, 0, 3, 4, 20, 1, 20)),
      AssertionError,
      [
        "Values are not equal.",
        ...createHeader(),
        removed(`-   ${new Date("invalid")}`),
        added(`+   ${new Date(2019, 0, 3, 4, 20, 1, 20).toISOString()}`),
        "",
      ].join("\n"),
    );
  },
});

Deno.test({
  name: "assertEquals() throws with given custom messages",
  fn() {
    assertThrows(
      () => assertEquals(1, 2, "CUSTOM MESSAGE"),
      AssertionError,
      [
        "Values are not equal: CUSTOM MESSAGE",
        ...createHeader(),
        removed(`-   ${yellow("1")}`),
        added(`+   ${yellow("2")}`),
        "",
      ].join("\n"),
    );
  },
});

Deno.test(
  "assertEquals() compares objects structurally if one object's constructor is undefined and the other is Object",
  () => {
    const a = Object.create(null);
    a.prop = "test";
    const b = {
      prop: "test",
    };

    assertEquals(a, b);
    assertEquals(b, a);
  },
);

Deno.test("assertEquals() orders diff for differently ordered objects", () => {
  assertThrows(
    () => {
      assertEquals(
        {
          aaaaaaaaaaaaaaaaaaaaaaaa: 0,
          bbbbbbbbbbbbbbbbbbbbbbbb: 0,
          ccccccccccccccccccccccc: 0,
        },
        {
          ccccccccccccccccccccccc: 1,
          aaaaaaaaaaaaaaaaaaaaaaaa: 0,
          bbbbbbbbbbbbbbbbbbbbbbbb: 0,
        },
      );
    },
    AssertionError,
    `
    {
      aaaaaaaaaaaaaaaaaaaaaaaa: 0,
      bbbbbbbbbbbbbbbbbbbbbbbb: 0,
-     ccccccccccccccccccccccc: 0,
+     ccccccccccccccccccccccc: 1,
    }`,
  );
});

Deno.test("assertEquals() matches same Set with object keys", () => {
  const data = [
    {
      id: "_1p7ZED73OF98VbT1SzSkjn",
      type: { id: "_ETGENUS" },
      name: "Thuja",
      friendlyId: "g-thuja",
    },
    {
      id: "_567qzghxZmeQ9pw3q09bd3",
      type: { id: "_ETGENUS" },
      name: "Pinus",
      friendlyId: "g-pinus",
    },
  ];
  assertEquals(data, data);
  assertEquals(new Set(data), new Set(data));
});
