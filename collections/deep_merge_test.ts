import { assertEquals } from "../testing/asserts.ts";
import { deepMerge } from "./deep_merge.ts";

Deno.test("deepMerge: simple merge", () => {
  assertEquals(
    deepMerge({
      foo: true,
    }, {
      bar: true,
    }),
    {
      foo: true,
      bar: true,
    },
  );
});

Deno.test("deepMerge: symbol merge", () => {
  assertEquals(
    deepMerge({}, {
      [Symbol.for("deepmerge.test")]: true,
    }),
    {
      [Symbol.for("deepmerge.test")]: true,
    },
  );
});

Deno.test("deepMerge: ignore non enumerable", () => {
  assertEquals(
    deepMerge(
      {},
      Object.defineProperties({}, {
        foo: { enumerable: false, value: true },
        bar: { enumerable: true, value: true },
      }),
    ),
    {
      bar: true,
    },
  );
});

Deno.test("deepMerge: include non enumerable", () => {
  assertEquals(
    deepMerge(
      {},
      Object.defineProperties({}, {
        foo: { enumerable: false, value: true },
        bar: { enumerable: true, value: true },
      }),
      { includeNonEnumerable: true },
    ),
    {
      foo: true,
      bar: true,
    },
  );
});

Deno.test("deepMerge: nested merge", () => {
  assertEquals(
    deepMerge({
      foo: {
        bar: true,
      },
    }, {
      foo: {
        baz: true,
        quux: {},
      },
      qux: true,
    }),
    {
      foo: {
        bar: true,
        baz: true,
        quux: {},
      },
      qux: true,
    },
  );
});

Deno.test("deepMerge: override target (non-mergeable source)", () => {
  assertEquals(
    deepMerge({
      foo: {
        bar: true,
      },
    }, {
      foo: true,
    }),
    {
      foo: true,
    },
  );
});

Deno.test("deepMerge: override target (non-mergeable destination, object like)", () => {
  const CustomClass = class {};
  assertEquals(
    deepMerge({
      foo: new CustomClass(),
    }, {
      foo: true,
    }),
    {
      foo: true,
    },
  );
});

Deno.test("deepMerge: override target (non-mergeable destination, array like)", () => {
  assertEquals(
    deepMerge({
      foo: [],
    }, {
      foo: true,
    }),
    {
      foo: true,
    },
  );
});

Deno.test("deepMerge: override target (different object like source and destination)", () => {
  assertEquals(
    deepMerge({
      foo: {},
    }, {
      foo: [1, 2],
    }),
    {
      foo: [1, 2],
    },
  );
  assertEquals(
    deepMerge({
      foo: [],
    }, {
      foo: { bar: true },
    }),
    {
      foo: { bar: true },
    },
  );
});

Deno.test("deepMerge: primitive types handling", () => {
  const CustomClass = class {};
  const expected = {
    boolean: true,
    null: null,
    undefined: undefined,
    number: 1,
    bigint: 1n,
    string: "string",
    symbol: Symbol.for("deepmerge.test"),
    object: { foo: true },
    regexp: /regex/,
    date: new Date(),
    function() {},
    async async() {},
    arrow: () => {},
    class: new CustomClass(),
  };
  assertEquals(
    deepMerge({
      boolean: false,
      null: undefined,
      undefined: null,
      number: -1,
      bigint: -1n,
      string: "foo",
      symbol: Symbol(),
      object: null,
      regexp: /foo/,
      date: new Date(0),
      function: function () {},
      async: async function () {},
      arrow: () => {},
      class: null,
    }, expected),
    expected,
  );
});

Deno.test("deepMerge: array merge (replace)", () => {
  assertEquals(
    deepMerge({
      foo: [1, 2, 3],
    }, {
      foo: [4, 5, 6],
    }),
    {
      foo: [4, 5, 6],
    },
  );
});

Deno.test("deepMerge: array merge (concat)", () => {
  assertEquals(
    deepMerge({
      foo: [1, 2, 3],
    }, {
      foo: [4, 5, 6],
    }, { arrays: "concat" }),
    {
      foo: [1, 2, 3, 4, 5, 6],
    },
  );
});

Deno.test("deepMerge: maps merge (replace)", () => {
  assertEquals(
    deepMerge({
      map: new Map([["foo", true]]),
    }, {
      map: new Map([["bar", true]]),
    }),
    {
      map: new Map([["bar", true]]),
    },
  );
});

Deno.test("deepMerge: maps merge (concat)", () => {
  assertEquals(
    deepMerge({
      map: new Map([["foo", true]]),
    }, {
      map: new Map([["bar", true]]),
    }, { maps: "concat" }),
    {
      map: new Map([["foo", true], ["bar", true]]),
    },
  );
});

Deno.test("deepMerge: sets merge (replace)", () => {
  assertEquals(
    deepMerge({
      set: new Set(["foo"]),
    }, {
      set: new Set(["bar"]),
    }),
    {
      set: new Set(["bar"]),
    },
  );
});

Deno.test("deepMerge: sets merge (concat)", () => {
  assertEquals(
    deepMerge({
      set: new Set(["foo"]),
    }, {
      set: new Set(["bar"]),
    }, { sets: "concat" }),
    {
      set: new Set(["foo", "bar"]),
    },
  );
});
