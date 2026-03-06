// Copyright 2018-2026 the Deno authors. MIT license.

import { bold, gray, green, red, stripAnsiCode, yellow } from "@std/fmt/colors";
import { AssertionError, assertThrows } from "@std/assert";
import { expect } from "./expect.ts";

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
  name: "expect().toEqual() matches when values are equal",
  fn() {
    expect({ a: 10 }).toEqual({ a: 10 });
    expect(true).toEqual(true);
    expect(10).toEqual(10);
    expect("abc").toEqual("abc");
    expect({ a: 10, b: { c: "1" } }).toEqual({ a: 10, b: { c: "1" } });
    expect(new Date("invalid")).toEqual(new Date("invalid"));
  },
});

Deno.test({
  name: "expect().toEqual() throws when numbers are not equal",
  fn() {
    assertThrows(
      () => expect(1).toEqual(2),
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
  name: "expect().toEqual() throws when compare number with string",
  fn() {
    assertThrows(
      () => expect(1).toEqual("1"),
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
  name: "expect().toEqual() throws when array are not equal",
  fn() {
    assertThrows(
      () => expect([1, "2", 3]).toEqual(["1", "2", 3]),
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
  name: "expect().toEqual() throws when objects are no equal",
  fn() {
    assertThrows(
      () => expect({ a: 1, b: "2", c: 3 }).toEqual({ a: 1, b: 2, c: [3] }),
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
  name: "expect().toEqual() throws when date are not equal",
  fn() {
    assertThrows(
      () =>
        expect(new Date(2019, 0, 3, 4, 20, 1, 10)).toEqual(
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
        expect(new Date("invalid")).toEqual(new Date(2019, 0, 3, 4, 20, 1, 20)),
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
  name: "expect().toEqual() throws with custom message",
  fn() {
    assertThrows(
      () => expect(1, "CUSTOM MESSAGE").toEqual(2),
      AssertionError,
      [
        "CUSTOM MESSAGE: Values are not equal.",
        ...createHeader(),
        removed(`-   ${yellow("1")}`),
        added(`+   ${yellow("2")}`),
        "",
      ].join("\n"),
    );
  },
});

Deno.test(
  "expect().toEqual() compares objects structurally if one object's constructor is undefined and the other is Object",
  () => {
    const a = Object.create(null);
    a.prop = "test";
    const b = {
      prop: "test",
    };

    expect(a).toEqual(b);
    expect(b).toEqual(a);
  },
);

Deno.test("expect().toEqual() diff for differently ordered objects", () => {
  assertThrows(
    () => {
      expect({
        aaaaaaaaaaaaaaaaaaaaaaaa: 0,
        bbbbbbbbbbbbbbbbbbbbbbbb: 0,
        ccccccccccccccccccccccc: 0,
      }).toEqual(
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

Deno.test("expect().toEqual() same Set with object keys", () => {
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
  expect(data).toEqual(data);
  expect(new Set(data)).toEqual(new Set(data));
});

Deno.test("expect().toEqual() does not throw when a key with undfined value exists in only one of values", () => {
  // bar: undefined is ignored in comparison
  expect({ foo: 1, bar: undefined }).toEqual({ foo: 1 });
  expect({ foo: 1, bar: undefined }).not.toEqual({ foo: undefined });
});

// https://github.com/denoland/std/issues/4244
Deno.test("expect().toEqual() align to jest test cases", () => {
  function create() {
    class Person {
      constructor(readonly name = "deno") {}
    }
    return new Person();
  }

  expect([create()]).toEqual([create()]);
  expect(
    new (class A {
      #hello = "world";
    })(),
  ).toEqual(
    new (class B {
      #hello = "world";
    })(),
  );
  expect(
    new WeakRef({ hello: "world" }),
  ).toEqual(
    new (class<T extends object> extends WeakRef<T> {})({ hello: "world" }),
  );

  expect({ a: undefined, b: undefined }).toEqual({
    a: undefined,
    c: undefined,
  });
  expect({ a: undefined, b: undefined }).toEqual({ a: undefined });

  class A {}
  class B {}
  expect(new A()).toEqual(new B());
  assertThrows(() => {
    expect(new A()).not.toEqual(new B());
  }, AssertionError);
});

Deno.test("expect().toEqual() matches when Error Objects are equal", () => {
  function getError() {
    return new Error("missing param: name");
  }

  const expectErrObjectWithName = new Error("missing param: name");
  expect(getError()).toEqual(expectErrObjectWithName);

  const expectErrObjectWithEmail = new Error("missing param: email");
  expect(getError()).not.toEqual(expectErrObjectWithEmail);
});

Deno.test("expect().toEqual() handles Sets", () => {
  expect(new Set([1, 2, 3])).toEqual(new Set([1, 2, 3]));
  expect(new Set([1, 2, 3])).not.toEqual(new Set([1, 2]));
  expect(new Set([1, 2, 3])).not.toEqual(new Set([1, 2, 4]));
  expect(new Set([1, 2, 3, 4])).not.toEqual(new Map([[1, 2], [3, 4]]));
  expect(new Set([1, 2, new Set([0, 1])])).toEqual(
    new Set([1, 2, new Set([0, 1])]),
  );

  // It handles circular reference structures
  const a = new Set<unknown>([1, 2]);
  a.add(a);
  const b = new Set<unknown>([1, 2]);
  b.add(b);
  expect(a).toEqual(b);
});

Deno.test("expect().toEqual() handles Maps", () => {
  expect(new Map([[1, 2], [3, 4]])).toEqual(new Map([[1, 2], [3, 4]]));
  expect(new Map([[1, 2], [3, 4]])).not.toEqual(new Map([[1, 2], [3, 5]]));
});

// TODO(kt3k): Iterator global exists in the runtime but not in the TypeScript
// Remove the below lines when `Iterator` global is available in TypeScript
// deno-lint-ignore no-explicit-any
const Iterator = (globalThis as any).Iterator;
Deno.test("expect().toEqual() handles iterators", () => {
  expect(Iterator.from([1, 2, 3])).toEqual(Iterator.from([1, 2, 3]));
  expect(Iterator.from([1, 2, 3])).not.toEqual(Iterator.from([1, 2, 4]));
  expect(Iterator.from([1, 2, 3])).not.toEqual(Iterator.from([1, 2, 3, 4]));
  const iter0 = Iterator.from([1, 2, 3]);
  const iter1 = Iterator.from([1, 2, 3]);
  iter1.foo = 1;
  expect(iter0).not.toEqual(iter1);
});

Deno.test("expect.toEqual with custom message", () => {
  expect(() => expect(42, "toEqual Custom Message").toEqual(43)).toThrow(
    /^toEqual Custom Message:/,
  );
});
