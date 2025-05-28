// Copyright 2018-2025 the Deno authors. MIT license.
import { AssertionError, assertObjectMatch, assertThrows } from "./mod.ts";

const sym = Symbol("foo");
const a = { foo: true, bar: false };
const b = { ...a, baz: a };
const c = { ...b, qux: b };
const d = { corge: c, grault: c };
const e = { foo: true } as { [key: string]: unknown };
e.bar = e;
const f = { [sym]: true, bar: false };
interface R {
  foo: boolean;
  bar: boolean;
}
const g: R = { foo: true, bar: false };
const h = { foo: [1, 2, 3], bar: true };
const i = { foo: [a, e], bar: true };
const j = { foo: [[1, 2, 3]], bar: true };
const k = { foo: [[1, [2, [3]]]], bar: true };
const l = { foo: [[1, [2, [a, e, j, k]]]], bar: true };
const m = { foo: /abc+/i, bar: [/abc/g, /abc/m] };
const n = {
  foo: new Set(["foo", "bar"]),
  bar: new Map([
    ["foo", 1],
    ["bar", 2],
  ]),
  baz: new Map([
    ["a", a],
    ["b", b],
  ]),
};
const o = { foo: [new Map([["bar", n.bar], ["baz", null]])] };
const p = { bar: [new Set([1, 2, 3])] };
const q = { foo: [1, 2] as unknown[] };
q.foo[2] = q.foo;
const r = { bar: [[1, [2, [q]]]] };

Deno.test("assertObjectMatch() matches simple subset", () => {
  assertObjectMatch(a, {
    foo: true,
  });
});

Deno.test("assertObjectMatch() matches subset with another subset", () => {
  assertObjectMatch(b, {
    foo: true,
    baz: { bar: false },
  });
});

Deno.test("assertObjectMatch() matches subset with multiple subsets", () => {
  assertObjectMatch(c, {
    foo: true,
    baz: { bar: false },
    qux: {
      baz: { foo: true },
    },
  });
});

Deno.test("assertObjectMatch() matches subset with same object reference as subset", () => {
  assertObjectMatch(d, {
    corge: {
      foo: true,
      qux: { bar: false },
    },
    grault: {
      bar: false,
      qux: { foo: true },
    },
  });
});

Deno.test("assertObjectMatch() matches subset with circular reference", () => {
  assertObjectMatch(e, {
    foo: true,
    bar: {
      bar: {
        bar: {
          foo: true,
        },
      },
    },
  });
  assertObjectMatch(q, { foo: [1, 2, [1, 2, [1, 2, [1, 2]]]] });
});

Deno.test("assertObjectMatch() matches subset with interface", () => {
  assertObjectMatch(g, { bar: false });
});

Deno.test("assertObjectMatch() matches subset with same symbol", () => {
  assertObjectMatch(f, {
    [sym]: true,
  });
});

Deno.test("assertObjectMatch() matches subset with array inside", () => {
  assertObjectMatch(h, { foo: [] });
  assertObjectMatch(h, { foo: [1, 2] });
  assertObjectMatch(h, { foo: [1, 2, 3] });
  assertObjectMatch(i, { foo: [{ bar: false }] });
  assertObjectMatch(i, {
    foo: [{ bar: false }, { bar: { bar: { bar: { foo: true } } } }],
  });
});

Deno.test("assertObjectMatch() matches subset with nested array inside", () => {
  assertObjectMatch(j, { foo: [[1, 2, 3]] });
  assertObjectMatch(k, { foo: [[1, [2, [3]]]] });
  assertObjectMatch(l, { foo: [[1, [2, [a, e, j, k]]]] });
  assertObjectMatch(r, { bar: [[1, [2, [q]]]] });
});

Deno.test("assertObjectMatch() matches subset with regexp", () => {
  assertObjectMatch(m, { foo: /abc+/i });
  assertObjectMatch(m, { bar: [/abc/g, /abc/m] });
});

Deno.test("assertObjectMatch() matches subset with built-in data structures", () => {
  assertObjectMatch(n, { foo: new Set(["foo"]) });
  assertObjectMatch(n, { bar: new Map([["bar", 2]]) });
  assertObjectMatch(n, { baz: new Map([["b", b]]) });
  assertObjectMatch(n, { baz: new Map([["b", { foo: true }]]) });
  assertObjectMatch(o, { foo: [new Map([["baz", null]])] });
  assertObjectMatch(o, { foo: [new Map([["bar", n.bar]])] });
  assertObjectMatch(p, { bar: [new Set([2, 3])] });
});

Deno.test("assertObjectMatch() throws when a key is missing from subset", () => {
  assertThrows(
    () =>
      assertObjectMatch(
        {
          foo: true,
        },
        {
          foo: true,
          bar: false,
        },
      ),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() throws when simple subset mismatches", () => {
  assertThrows(
    () =>
      assertObjectMatch(a, {
        foo: false,
      }),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() throws when subset with another subset mismatches", () => {
  assertThrows(
    () =>
      assertObjectMatch(b, {
        foo: true,
        baz: { bar: true },
      }),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() throws when subset with multiple subsets mismatches", () => {
  assertThrows(
    () =>
      assertObjectMatch(c, {
        foo: true,
        baz: { bar: false },
        qux: {
          baz: { foo: false },
        },
      }),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() throws when subset with same object reference as subset mismatches", () => {
  assertThrows(
    () =>
      assertObjectMatch(d, {
        corge: {
          foo: true,
          qux: { bar: true },
        },
        grault: {
          bar: false,
          qux: { foo: false },
        },
      }),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() throws when subset with circular reference mismatches", () => {
  assertThrows(
    () =>
      assertObjectMatch(e, {
        foo: true,
        bar: {
          bar: {
            bar: {
              foo: false,
            },
          },
        },
      }),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() throws when subset with symbol key mismatches other string key", () => {
  assertThrows(
    () =>
      assertObjectMatch(f, {
        [sym]: false,
      }),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() throws when subset with array inside mismatches", () => {
  assertThrows(
    () =>
      assertObjectMatch(i, {
        foo: [1, 2, 3, 4],
      }),
    AssertionError,
  );
  assertThrows(
    () =>
      assertObjectMatch(i, {
        foo: [{ bar: true }, { foo: false }],
      }),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() matches when actual/expected value as instance of class mismatches", () => {
  class A {
    a: number;
    constructor(a: number) {
      this.a = a;
    }
  }
  assertObjectMatch({ test: new A(1) }, { test: { a: 1 } });
  assertObjectMatch({ test: { a: 1 } }, { test: { a: 1 } });
  assertObjectMatch({ test: { a: 1 } }, { test: new A(1) });
  assertObjectMatch({ test: new A(1) }, { test: new A(1) });
});

Deno.test("assertObjectMatch() matches when actual/expected contains same instance of Map/TypedArray/etc", () => {
  const body = new Uint8Array([0, 1, 2]);
  assertObjectMatch({ body, foo: "foo" }, { body });
});

Deno.test("assertObjectMatch() matches subsets of arrays", () => {
  assertObjectMatch(
    { positions: [[1, 2, 3, 4]] },
    {
      positions: [[1, 2, 3]],
    },
  );
});

Deno.test("assertObjectMatch() throws when regexp mismatches", () => {
  assertThrows(() => assertObjectMatch(m, { foo: /abc+/ }), AssertionError);
  assertThrows(() => assertObjectMatch(m, { foo: /abc*/i }), AssertionError);
  assertThrows(
    () => assertObjectMatch(m, { bar: [/abc/m, /abc/g] }),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() throws when built-in data structures mismatches", () => {
  assertThrows(
    () => assertObjectMatch(n, { foo: new Set(["baz"]) }),
    AssertionError,
  );
  assertThrows(
    () => assertObjectMatch(n, { bar: new Map([["bar", 3]]) }),
    AssertionError,
  );
  assertThrows(
    () => assertObjectMatch(n, { baz: new Map([["a", { baz: true }]]) }),
    AssertionError,
  );
});

Deno.test("assertObjectMatch() throws assertion error when in the first argument mismatches, rather than a TypeError: Invalid value used as weak map key", () => {
  assertThrows(
    () => assertObjectMatch({ foo: null }, { foo: { bar: 42 } }),
    AssertionError,
  );
  assertObjectMatch({ foo: null, bar: null }, { foo: null });
  assertObjectMatch({ foo: undefined, bar: null }, { foo: undefined });
  assertThrows(
    () => assertObjectMatch({ foo: undefined, bar: null }, { foo: null }),
    AssertionError,
  );
  assertThrows(
    () => assertObjectMatch(n, { baz: new Map([["b", null]]) }),
  );
});

Deno.test("assertObjectMatch() throws readable type error for non mappable primitive types", () => {
  assertThrows(
    // @ts-expect-error Argument of type 'null' is not assignable to parameter of type 'Record<PropertyKey, any>'
    () => assertObjectMatch(null, { foo: 42 }),
    TypeError,
    "assertObjectMatch",
  );
  // @ts-expect-error Argument of type 'null' is not assignable to parameter of type 'Record<PropertyKey, any>'
  assertThrows(() => assertObjectMatch(null, { foo: 42 }), TypeError, "null"); // since typeof null is "object", want to make sure user knows the bad value is "null"
  assertThrows(
    // @ts-expect-error Argument of type 'undefined' is not assignable to parameter of type 'Record<PropertyKey, any>'
    () => assertObjectMatch(undefined, { foo: 42 }),
    TypeError,
    "assertObjectMatch",
  );
  // @ts-expect-error Argument of type 'number' is not assignable to parameter of type 'Record<PropertyKey, any>'
  assertThrows(() => assertObjectMatch(21, 42), TypeError, "assertObjectMatch");
  assertThrows(
    // @ts-expect-error Argument of type 'string' is not assignable to parameter of type 'Record<PropertyKey, any>'
    () => assertObjectMatch("string", "string"),
    TypeError,
    "assertObjectMatch",
  );
});

Deno.test("assertObjectMatch() prints inputs correctly", () => {
  const x = {
    command: "error",
    payload: {
      message: "NodeNotFound",
    },
    protocol: "graph",
  };

  const y = {
    protocol: "graph",
    command: "addgroup",
    payload: {
      graph: "foo",
      metadata: {
        description: "foo",
      },
      name: "somegroup",
      nodes: [
        "somenode",
        "someothernode",
      ],
    },
  };

  assertThrows(
    () => assertObjectMatch(x, y),
    AssertionError,
    `    {
+     command: "addgroup",
-     command: "error",
      payload: {
+       graph: "foo",
+       metadata: {
+         description: "foo",
+       },
+       name: "somegroup",
+       nodes: [
+         "somenode",
+         "someothernode",
+       ],
-       message: "NodeNotFound",
      },
      protocol: "graph",
    }`,
  );

  assertThrows(
    () => assertObjectMatch({ foo: [] }, { foo: ["bar"] }),
    AssertionError,
    `    {
+     foo: [
+       "bar",
+     ],
-     foo: [],
    }`,
  );

  const a = {};
  const b = {};

  Object.defineProperty(a, "hello", {
    value: "world",
    enumerable: false,
  });

  Object.defineProperty(b, "foo", {
    value: "bar",
    enumerable: false,
  });

  assertThrows(
    () => assertObjectMatch(a, b),
    AssertionError,
    `    {
-     hello: "world",
+     foo: "bar",
    }`,
  );
});

Deno.test(
  "assertObjectMatch() should be able to test target object's own `__proto__`",
  () => {
    const objectA = { ["__proto__"]: { polluted: true } };
    const objectB = { ["__proto__"]: { polluted: true } };
    const objectC = { ["__proto__"]: { polluted: false } };
    assertObjectMatch(objectA, objectB);
    assertThrows(
      () => assertObjectMatch(objectA, objectC),
      AssertionError,
      `    {
      ['__proto__']: {
-       polluted: true,
+       polluted: false,
      },
    }`,
    );
  },
);
