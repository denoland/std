// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, AssertionError, assertThrows } from "./mod.ts";
import { DIFF_CONTEXT_LENGTH } from "@std/internal/build-message";
import {
  bold,
  gray,
  green,
  red,
  stripAnsiCode,
  yellow,
} from "@std/internal/styles";
import { dedent } from "@std/text/unstable-dedent";
import { stub } from "@std/testing/mock";
import { disposableStack } from "../internal/_testing.ts";

function createHeader(): string[] {
  return [
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
}

function added(s: string): string {
  return green(bold(stripAnsiCode(s)));
}
function removed(s: string): string {
  return red(bold(stripAnsiCode(s)));
}

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

Deno.test({
  name:
    "assertEquals() compares objects structurally if one object's constructor is undefined and the other is Object",
  fn() {
    const a = Object.create(null);
    a.prop = "test";
    const b = {
      prop: "test",
    };

    assertEquals(a, b);
    assertEquals(b, a);
  },
});

Deno.test({
  name: "assertEquals() orders diff for differently ordered objects",
  fn() {
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
  },
});

Deno.test({
  name: "assertEquals() matches same Set with object keys",
  fn() {
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
  },
});

function assertDiffMessage(a: unknown, b: unknown, expected: string) {
  const err = assertThrows(() => assertEquals(a, b), AssertionError);
  // TODO(lionel-rowe): re-spell `fullExpectedMessage` indentation once https://github.com/denoland/std/issues/6830
  // is fixed
  const fullExpectedMessage = dedent`
        Values are not equal.


            [Diff] Actual / Expected


        ${expected}
  `;
  assertEquals(
    // TODO(lionel-rowe): compare full messages without trimming once https://github.com/denoland/std/issues/6830 and
    // https://github.com/denoland/std/issues/6831 are fixed
    stripAnsiCode(err.message).trimEnd(),
    fullExpectedMessage,
  );
}

Deno.test(`assertEquals() truncates unchanged lines of large diffs when "${DIFF_CONTEXT_LENGTH}" is set`, async (t) => {
  using stack = disposableStack();
  stack.use(stub(Deno.permissions, "querySync", (x) => {
    if (x.name === "env") return { state: "granted" } as Deno.PermissionStatus;
    throw new Error(`Unexpected permission descriptor: ${x.name}`);
  }));
  stack.use(stub(Deno.env, "get", (key) => {
    if (key === DIFF_CONTEXT_LENGTH) return "10";
    throw new Error(`Unexpected env var key: ${key}`);
  }));

  const a = Array.from({ length: 1000 }, (_, i) => i);
  const b = [...a];
  b[500] = -1;

  await t.step("array", () => {
    assertDiffMessage(
      a,
      b,
      dedent`
            [
              ... 490 unchanged lines ...
              490,
              491,
              492,
              493,
              494,
              495,
              496,
              497,
              498,
              499,
        -     500,
        +     -1,
              501,
              502,
              503,
              504,
              505,
              506,
              507,
              508,
              509,
              510,
              ... 489 unchanged lines ...
            ]
      `,
    );
  });

  await t.step("object", () => {
    assertDiffMessage(
      Object.fromEntries(a.entries()),
      Object.fromEntries(b.entries()),
      dedent`
            {
              ... 437 unchanged lines ...
              "492": 492,
              "493": 493,
              "494": 494,
              "495": 495,
              "496": 496,
              "497": 497,
              "498": 498,
              "499": 499,
              "5": 5,
              "50": 50,
        -     "500": 500,
        +     "500": -1,
              "501": 501,
              "502": 502,
              "503": 503,
              "504": 504,
              "505": 505,
              "506": 506,
              "507": 507,
              "508": 508,
              "509": 509,
              "51": 51,
              ... 542 unchanged lines ...
            }
      `,
    );
  });

  await t.step("string", () => {
    assertDiffMessage(
      a.join("\n"),
      b.join("\n"),
      dedent`
            0\\n
            ... 489 unchanged lines ...
            490\\n
            491\\n
            492\\n
            493\\n
            494\\n
            495\\n
            496\\n
            497\\n
            498\\n
            499\\n
        -   500\\n
        +   -1\\n
            501\\n
            502\\n
            503\\n
            504\\n
            505\\n
            506\\n
            507\\n
            508\\n
            509\\n
            510\\n
            ... 488 unchanged lines ...
            999
      `,
    );
  });

  await t.step("Set", () => {
    assertDiffMessage(
      new Set(a),
      new Set(b),
      dedent`
            Set(1000) {
        +     -1,
              0,
              1,
              10,
              100,
              101,
              102,
              103,
              104,
              105,
              106,
              ... 427 unchanged lines ...
              492,
              493,
              494,
              495,
              496,
              497,
              498,
              499,
              5,
              50,
        -     500,
              501,
              502,
              503,
              504,
              505,
              506,
              507,
              508,
              509,
              51,
              ... 542 unchanged lines ...
            }
      `,
    );
  });

  await t.step("diff near start", () => {
    const a = Array.from({ length: 1000 }, (_, i) => i);
    const b = [...a];
    b[3] = -1;

    assertDiffMessage(
      a,
      b,
      dedent`
            [
              0,
              1,
              2,
        -     3,
        +     -1,
              4,
              5,
              6,
              7,
              8,
              9,
              10,
              11,
              12,
              13,
              ... 986 unchanged lines ...
            ]
      `,
    );
  });

  await t.step("diff near end", () => {
    const a = Array.from({ length: 1000 }, (_, i) => i);
    const b = [...a];
    b[996] = -1;

    assertDiffMessage(
      a,
      b,
      dedent`
            [
              ... 986 unchanged lines ...
              986,
              987,
              988,
              989,
              990,
              991,
              992,
              993,
              994,
              995,
        -     996,
        +     -1,
              997,
              998,
              999,
            ]
      `,
    );
  });
});
