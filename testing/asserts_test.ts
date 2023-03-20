// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertAlmostEquals,
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertFalse,
  assertInstanceOf,
  AssertionError,
  assertIsError,
  assertMatch,
  assertNotEquals,
  assertNotInstanceOf,
  assertNotMatch,
  assertNotStrictEquals,
  assertObjectMatch,
  assertRejects,
  assertStrictEquals,
  assertStringIncludes,
  assertThrows,
  equal,
  fail,
  unimplemented,
  unreachable,
} from "./asserts.ts";
import { bold, gray, green, red, stripColor, yellow } from "../fmt/colors.ts";

Deno.test("EqualDifferentZero", () => {
  assert(equal(0, -0));
  assert(equal(0, +0));
  assert(equal(+0, -0));
  assert(equal([0], [-0]));
  assert(equal(["hello", 12.21, 0], ["hello", 12.21, -0]));
  assert(equal(["hello", 12.21, 0], ["hello", 12.21, +0]));
  assert(equal(["hello", 12.21, -0], ["hello", 12.21, +0]));
  assert(equal({ msg: "hello", case: 0 }, { msg: "hello", case: -0 }));
  assert(equal({ msg: "hello", array: [0] }, { msg: "hello", array: [-0] }));
});

Deno.test("Equal", function () {
  assert(equal("world", "world"));
  assert(!equal("hello", "world"));
  assertFalse(equal("hello", "world"));
  assert(equal(5, 5));
  assert(!equal(5, 6));
  assertFalse(equal(5, 6));
  assert(equal(NaN, NaN));
  assert(equal({ hello: "world" }, { hello: "world" }));
  assert(!equal({ world: "hello" }, { hello: "world" }));
  assertFalse(equal({ world: "hello" }, { hello: "world" }));
  assert(
    equal(
      { hello: "world", hi: { there: "everyone" } },
      { hello: "world", hi: { there: "everyone" } },
    ),
  );
  assert(
    !equal(
      { hello: "world", hi: { there: "everyone" } },
      { hello: "world", hi: { there: "everyone else" } },
    ),
  );
  assertFalse(
    equal(
      { hello: "world", hi: { there: "everyone" } },
      { hello: "world", hi: { there: "everyone else" } },
    ),
  );
  assert(equal({ [Symbol.for("foo")]: "bar" }, { [Symbol.for("foo")]: "bar" }));
  assert(!equal({ [Symbol("foo")]: "bar" }, { [Symbol("foo")]: "bar" }));
  assertFalse(equal({ [Symbol("foo")]: "bar" }, { [Symbol("foo")]: "bar" }));

  assert(equal(/deno/, /deno/));
  assert(!equal(/deno/, /node/));
  assertFalse(equal(/deno/, /node/));
  assert(equal(new Date(2019, 0, 3), new Date(2019, 0, 3)));
  assert(!equal(new Date(2019, 0, 3), new Date(2019, 1, 3)));
  assertFalse(equal(new Date(2019, 0, 3), new Date(2019, 1, 3)));
  assert(
    !equal(
      new Date(2019, 0, 3, 4, 20, 1, 10),
      new Date(2019, 0, 3, 4, 20, 1, 20),
    ),
  );
  assertFalse(
    equal(
      new Date(2019, 0, 3, 4, 20, 1, 10),
      new Date(2019, 0, 3, 4, 20, 1, 20),
    ),
  );
  assert(equal(new Date("Invalid"), new Date("Invalid")));
  assert(!equal(new Date("Invalid"), new Date(2019, 0, 3)));
  assertFalse(equal(new Date("Invalid"), new Date(2019, 0, 3)));
  assert(!equal(new Date("Invalid"), new Date(2019, 0, 3, 4, 20, 1, 10)));
  assertFalse(equal(new Date("Invalid"), new Date(2019, 0, 3, 4, 20, 1, 10)));
  assert(equal(new Set([1]), new Set([1])));
  assert(!equal(new Set([1]), new Set([2])));
  assertFalse(equal(new Set([1]), new Set([2])));
  assert(equal(new Set([1, 2, 3]), new Set([3, 2, 1])));
  assert(equal(new Set([1, new Set([2, 3])]), new Set([new Set([3, 2]), 1])));
  assert(!equal(new Set([1, 2]), new Set([3, 2, 1])));
  assertFalse(equal(new Set([1, 2]), new Set([3, 2, 1])));
  assert(!equal(new Set([1, 2, 3]), new Set([4, 5, 6])));
  assertFalse(equal(new Set([1, 2, 3]), new Set([4, 5, 6])));
  assert(equal(new Set("denosaurus"), new Set("denosaurussss")));
  assert(equal(new Map(), new Map()));
  assert(
    equal(
      new Map([
        ["foo", "bar"],
        ["baz", "baz"],
      ]),
      new Map([
        ["foo", "bar"],
        ["baz", "baz"],
      ]),
    ),
  );
  assert(
    equal(
      new Map([["foo", new Map([["bar", "baz"]])]]),
      new Map([["foo", new Map([["bar", "baz"]])]]),
    ),
  );
  assert(
    equal(
      new Map([["foo", { bar: "baz" }]]),
      new Map([["foo", { bar: "baz" }]]),
    ),
  );
  assert(
    equal(
      new Map([
        ["foo", "bar"],
        ["baz", "qux"],
      ]),
      new Map([
        ["baz", "qux"],
        ["foo", "bar"],
      ]),
    ),
  );
  assert(equal(new Map([["foo", ["bar"]]]), new Map([["foo", ["bar"]]])));
  assert(!equal(new Map([["foo", "bar"]]), new Map([["bar", "baz"]])));
  assertFalse(equal(new Map([["foo", "bar"]]), new Map([["bar", "baz"]])));
  assertFalse(equal(new Map([["foo", "bar"]]), new Map([["bar", "baz"]])));
  assert(
    !equal(
      new Map([["foo", "bar"]]),
      new Map([
        ["foo", "bar"],
        ["bar", "baz"],
      ]),
    ),
  );
  assertFalse(
    equal(
      new Map([["foo", "bar"]]),
      new Map([
        ["foo", "bar"],
        ["bar", "baz"],
      ]),
    ),
  );
  assert(
    !equal(
      new Map([["foo", new Map([["bar", "baz"]])]]),
      new Map([["foo", new Map([["bar", "qux"]])]]),
    ),
  );
  assert(equal(new Map([[{ x: 1 }, true]]), new Map([[{ x: 1 }, true]])));
  assert(!equal(new Map([[{ x: 1 }, true]]), new Map([[{ x: 1 }, false]])));
  assertFalse(equal(new Map([[{ x: 1 }, true]]), new Map([[{ x: 1 }, false]])));
  assert(!equal(new Map([[{ x: 1 }, true]]), new Map([[{ x: 2 }, true]])));
  assertFalse(equal(new Map([[{ x: 1 }, true]]), new Map([[{ x: 2 }, true]])));
  assert(equal([1, 2, 3], [1, 2, 3]));
  assert(equal([1, [2, 3]], [1, [2, 3]]));
  assert(!equal([1, 2, 3, 4], [1, 2, 3]));
  assertFalse(equal([1, 2, 3, 4], [1, 2, 3]));
  assert(!equal([1, 2, 3, 4], [1, 2, 3]));
  assertFalse(equal([1, 2, 3, 4], [1, 2, 3]));
  assert(!equal([1, 2, 3, 4], [1, 4, 2, 3]));
  assertFalse(equal([1, 2, 3, 4], [1, 4, 2, 3]));
  assert(equal(new Uint8Array([1, 2, 3, 4]), new Uint8Array([1, 2, 3, 4])));
  assert(!equal(new Uint8Array([1, 2, 3, 4]), new Uint8Array([2, 1, 4, 3])));
  assertFalse(
    equal(new Uint8Array([1, 2, 3, 4]), new Uint8Array([2, 1, 4, 3])),
  );
  assert(
    equal(new URL("https://example.test"), new URL("https://example.test")),
  );
  assert(
    !equal(
      new URL("https://example.test"),
      new URL("https://example.test/with-path"),
    ),
  );
  assertFalse(
    equal(
      new URL("https://example.test"),
      new URL("https://example.test/with-path"),
    ),
  );
  assert(
    !equal({ a: undefined, b: undefined }, { a: undefined, c: undefined }),
  );
  assertFalse(
    equal({ a: undefined, b: undefined }, { a: undefined, c: undefined }),
  );
  assertFalse(equal({ a: undefined, b: undefined }, { a: undefined }));
  assertThrows(() => equal(new WeakMap(), new WeakMap()));
  assertThrows(() => equal(new WeakSet(), new WeakSet()));
  assert(!equal(new WeakMap(), new WeakSet()));
  assertFalse(equal(new WeakMap(), new WeakSet()));
  assert(
    equal(new WeakRef({ hello: "world" }), new WeakRef({ hello: "world" })),
  );
  assert(
    !equal(new WeakRef({ world: "hello" }), new WeakRef({ hello: "world" })),
  );
  assertFalse(
    equal(new WeakRef({ world: "hello" }), new WeakRef({ hello: "world" })),
  );
  assert(!equal({ hello: "world" }, new WeakRef({ hello: "world" })));
  assertFalse(equal({ hello: "world" }, new WeakRef({ hello: "world" })));
  assert(
    !equal(
      new WeakRef({ hello: "world" }),
      // deno-lint-ignore ban-types
      new (class<T extends object> extends WeakRef<T> {})({ hello: "world" }),
    ),
  );
  assertFalse(
    equal(
      new WeakRef({ hello: "world" }),
      // deno-lint-ignore ban-types
      new (class<T extends object> extends WeakRef<T> {})({ hello: "world" }),
    ),
  );
  assert(
    !equal(
      new WeakRef({ hello: "world" }),
      // deno-lint-ignore ban-types
      new (class<T extends object> extends WeakRef<T> {
        foo = "bar";
      })({ hello: "world" }),
    ),
  );
  assertFalse(
    equal(
      new WeakRef({ hello: "world" }),
      // deno-lint-ignore ban-types
      new (class<T extends object> extends WeakRef<T> {
        foo = "bar";
      })({ hello: "world" }),
    ),
  );

  assert(
    !equal(
      new (class A {
        #hello = "world";
      })(),
      new (class B {
        #hello = "world";
      })(),
    ),
  );

  assertFalse(
    equal(
      new (class A {
        #hello = "world";
      })(),
      new (class B {
        #hello = "world";
      })(),
    ),
  );
});

Deno.test("EqualCircular", () => {
  const objA: { prop?: unknown } = {};
  objA.prop = objA;
  const objB: { prop?: unknown } = {};
  objB.prop = objB;
  assert(equal(objA, objB));

  const mapA = new Map();
  mapA.set("prop", mapA);
  const mapB = new Map();
  mapB.set("prop", mapB);
  assert(equal(mapA, mapB));
});

Deno.test("NotEquals", function () {
  const a = { foo: "bar" };
  const b = { bar: "foo" };
  assertNotEquals<unknown>(a, b);
  assertNotEquals("Denosaurus", "Tyrannosaurus");
  assertNotEquals(
    new Date(2019, 0, 3, 4, 20, 1, 10),
    new Date(2019, 0, 3, 4, 20, 1, 20),
  );
  assertNotEquals(new Date("invalid"), new Date(2019, 0, 3, 4, 20, 1, 20));
  let didThrow;
  try {
    assertNotEquals("Raptor", "Raptor");
    didThrow = false;
  } catch (e) {
    assert(e instanceof AssertionError);
    didThrow = true;
  }
  assertEquals(didThrow, true);
});

Deno.test("AssertExists", function () {
  assertExists("Denosaurus");
  assertExists(false);
  assertExists(0);
  assertExists("");
  assertExists(-0);
  assertExists(0);
  assertExists(NaN);

  const value = new URLSearchParams({ value: "test" }).get("value");
  assertExists(value);
  assertEquals(value.length, 4);

  let didThrow;
  try {
    assertExists(undefined);
    didThrow = false;
  } catch (e) {
    assert(e instanceof AssertionError);
    didThrow = true;
  }
  assertEquals(didThrow, true);
  didThrow = false;
  try {
    assertExists(null);
    didThrow = false;
  } catch (e) {
    assert(e instanceof AssertionError);
    didThrow = true;
  }
  assertEquals(didThrow, true);
});

Deno.test("AssertStringContains", function () {
  assertStringIncludes("Denosaurus", "saur");
  assertStringIncludes("Denosaurus", "Deno");
  assertStringIncludes("Denosaurus", "rus");
  let didThrow;
  try {
    assertStringIncludes("Denosaurus", "Raptor");
    didThrow = false;
  } catch (e) {
    assert(e instanceof AssertionError);
    didThrow = true;
  }
  assertEquals(didThrow, true);
});

Deno.test("ArrayContains", function () {
  const fixture = ["deno", "iz", "luv"];
  const fixtureObject = [{ deno: "luv" }, { deno: "Js" }];
  assertArrayIncludes(fixture, ["deno"]);
  assertArrayIncludes(fixtureObject, [{ deno: "luv" }]);
  assertArrayIncludes(
    Uint8Array.from([1, 2, 3, 4]),
    Uint8Array.from([1, 2, 3]),
  );
  assertThrows(
    () => assertArrayIncludes(fixtureObject, [{ deno: "node" }]),
    AssertionError,
    `actual: "[
  {
    deno: "luv",
  },
  {
    deno: "Js",
  },
]" expected to include: "[
  {
    deno: "node",
  },
]"
missing: [
  {
    deno: "node",
  },
]`,
  );
});

Deno.test("AssertStringContainsThrow", function () {
  let didThrow = false;
  try {
    assertStringIncludes("Denosaurus from Jurassic", "Raptor");
  } catch (e) {
    assert(e instanceof AssertionError);
    assert(
      e.message ===
        `actual: "Denosaurus from Jurassic" expected to contain: "Raptor"`,
    );
    didThrow = true;
  }
  assert(didThrow);
});

Deno.test("AssertStringMatching", function () {
  assertMatch("foobar@deno.com", RegExp(/[a-zA-Z]+@[a-zA-Z]+.com/));
});

Deno.test("AssertStringMatchingThrows", function () {
  let didThrow = false;
  try {
    assertMatch("Denosaurus from Jurassic", RegExp(/Raptor/));
  } catch (e) {
    assert(e instanceof AssertionError);
    assert(
      e.message ===
        `actual: "Denosaurus from Jurassic" expected to match: "/Raptor/"`,
    );
    didThrow = true;
  }
  assert(didThrow);
});

Deno.test("AssertStringNotMatching", function () {
  assertNotMatch("foobar.deno.com", RegExp(/[a-zA-Z]+@[a-zA-Z]+.com/));
});

Deno.test("AssertStringNotMatchingThrows", function () {
  let didThrow = false;
  try {
    assertNotMatch("Denosaurus from Jurassic", RegExp(/from/));
  } catch (e) {
    assert(e instanceof AssertionError);
    assert(
      e.message ===
        `actual: "Denosaurus from Jurassic" expected to not match: "/from/"`,
    );
    didThrow = true;
  }
  assert(didThrow);
});

Deno.test("AssertObjectMatching", function () {
  const sym = Symbol("foo");
  const a = { foo: true, bar: false };
  const b = { ...a, baz: a };
  const c = { ...b, qux: b };
  const d = { corge: c, grault: c };
  const e = { foo: true } as { [key: string]: unknown };
  e.bar = e;
  const f = { [sym]: true, bar: false };
  interface r {
    foo: boolean;
    bar: boolean;
  }
  const g: r = { foo: true, bar: false };
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

  // Simple subset
  assertObjectMatch(a, {
    foo: true,
  });
  // Subset with another subset
  assertObjectMatch(b, {
    foo: true,
    baz: { bar: false },
  });
  // Subset with multiple subsets
  assertObjectMatch(c, {
    foo: true,
    baz: { bar: false },
    qux: {
      baz: { foo: true },
    },
  });
  // Subset with same object reference as subset
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
  // Subset with circular reference
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
  // Subset with interface
  assertObjectMatch(g, { bar: false });
  // Subset with same symbol
  assertObjectMatch(f, {
    [sym]: true,
  });
  // Subset with array inside
  assertObjectMatch(h, { foo: [] });
  assertObjectMatch(h, { foo: [1, 2] });
  assertObjectMatch(h, { foo: [1, 2, 3] });
  assertObjectMatch(i, { foo: [{ bar: false }] });
  assertObjectMatch(i, {
    foo: [{ bar: false }, { bar: { bar: { bar: { foo: true } } } }],
  });
  // Subset with nested array inside
  assertObjectMatch(j, { foo: [[1, 2, 3]] });
  assertObjectMatch(k, { foo: [[1, [2, [3]]]] });
  assertObjectMatch(l, { foo: [[1, [2, [a, e, j, k]]]] });
  // Regexp
  assertObjectMatch(m, { foo: /abc+/i });
  assertObjectMatch(m, { bar: [/abc/g, /abc/m] });
  //Built-in data structures
  assertObjectMatch(n, { foo: new Set(["foo"]) });
  assertObjectMatch(n, { bar: new Map([["bar", 2]]) });
  assertObjectMatch(n, { baz: new Map([["b", b]]) });
  assertObjectMatch(n, { baz: new Map([["b", { foo: true }]]) });

  // Missing key
  {
    let didThrow;
    try {
      assertObjectMatch(
        {
          foo: true,
        },
        {
          foo: true,
          bar: false,
        },
      );
      didThrow = false;
    } catch (e) {
      assert(e instanceof AssertionError);
      didThrow = true;
    }
    assertEquals(didThrow, true);
  }
  // Simple subset
  {
    let didThrow;
    try {
      assertObjectMatch(a, {
        foo: false,
      });
      didThrow = false;
    } catch (e) {
      assert(e instanceof AssertionError);
      didThrow = true;
    }
    assertEquals(didThrow, true);
  }
  // Subset with another subset
  {
    let didThrow;
    try {
      assertObjectMatch(b, {
        foo: true,
        baz: { bar: true },
      });
      didThrow = false;
    } catch (e) {
      assert(e instanceof AssertionError);
      didThrow = true;
    }
    assertEquals(didThrow, true);
  }
  // Subset with multiple subsets
  {
    let didThrow;
    try {
      assertObjectMatch(c, {
        foo: true,
        baz: { bar: false },
        qux: {
          baz: { foo: false },
        },
      });
      didThrow = false;
    } catch (e) {
      assert(e instanceof AssertionError);
      didThrow = true;
    }
    assertEquals(didThrow, true);
  }
  // Subset with same object reference as subset
  {
    let didThrow;
    try {
      assertObjectMatch(d, {
        corge: {
          foo: true,
          qux: { bar: true },
        },
        grault: {
          bar: false,
          qux: { foo: false },
        },
      });
      didThrow = false;
    } catch (e) {
      assert(e instanceof AssertionError);
      didThrow = true;
    }
    assertEquals(didThrow, true);
  }
  // Subset with circular reference
  {
    let didThrow;
    try {
      assertObjectMatch(e, {
        foo: true,
        bar: {
          bar: {
            bar: {
              foo: false,
            },
          },
        },
      });
      didThrow = false;
    } catch (e) {
      assert(e instanceof AssertionError);
      didThrow = true;
    }
    assertEquals(didThrow, true);
  }
  // Subset with symbol key but with string key subset
  {
    let didThrow;
    try {
      assertObjectMatch(f, {
        foo: true,
      });
      didThrow = false;
    } catch (e) {
      assert(e instanceof AssertionError);
      didThrow = true;
    }
    assertEquals(didThrow, true);
  }
  // Subset with array inside but doesn't match key subset
  {
    let didThrow;
    try {
      assertObjectMatch(i, {
        foo: [1, 2, 3, 4],
      });
      didThrow = false;
    } catch (e) {
      assert(e instanceof AssertionError);
      didThrow = true;
    }
    assertEquals(didThrow, true);
  }
  {
    let didThrow;
    try {
      assertObjectMatch(i, {
        foo: [{ bar: true }, { foo: false }],
      });
      didThrow = false;
    } catch (e) {
      assert(e instanceof AssertionError);
      didThrow = true;
    }
    assertEquals(didThrow, true);
  }
  // actual/expected value as instance of class
  {
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
  }
  {
    // actual/expected contains same instance of Map/TypedArray/etc
    const body = new Uint8Array([0, 1, 2]);
    assertObjectMatch({ body, foo: "foo" }, { body });
  }
  {
    // match subsets of arrays
    assertObjectMatch(
      { positions: [[1, 2, 3, 4]] },
      {
        positions: [[1, 2, 3]],
      },
    );
  }
  //Regexp
  assertThrows(() => assertObjectMatch(m, { foo: /abc+/ }), AssertionError);
  assertThrows(() => assertObjectMatch(m, { foo: /abc*/i }), AssertionError);
  assertThrows(
    () => assertObjectMatch(m, { bar: [/abc/m, /abc/g] }),
    AssertionError,
  );
  //Built-in data structures
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

Deno.test("AssertsUnimplemented", function () {
  let didThrow = false;
  try {
    unimplemented();
  } catch (e) {
    assert(e instanceof AssertionError);
    assert(e.message === "unimplemented");
    didThrow = true;
  }
  assert(didThrow);
});

Deno.test("AssertsUnreachable", function () {
  let didThrow = false;
  try {
    unreachable();
  } catch (e) {
    assert(e instanceof AssertionError);
    assert(e.message === "unreachable");
    didThrow = true;
  }
  assert(didThrow);
});

Deno.test("AssertFail", function () {
  assertThrows(fail, AssertionError, "Failed assertion.");
  assertThrows(
    () => {
      fail("foo");
    },
    AssertionError,
    "Failed assertion: foo",
  );
});

Deno.test("assertThrows with wrong error class", () => {
  assertThrows(
    () => {
      //This next assertThrows will throw an AssertionError due to the wrong
      //expected error class
      assertThrows(
        () => {
          fail("foo");
        },
        TypeError,
        "Failed assertion: foo",
      );
    },
    AssertionError,
    `Expected error to be instance of "TypeError", but was "AssertionError"`,
  );
});

Deno.test("assertThrows with return type", () => {
  assertThrows(() => {
    throw new Error();
  });
});

Deno.test("assertRejects with return type", async () => {
  await assertRejects(() => {
    return Promise.reject(new Error());
  });
});

Deno.test("assertRejects with synchronous function that throws", async () => {
  await assertRejects(() =>
    assertRejects(() => {
      throw new Error();
    })
  );
  await assertRejects(
    () =>
      assertRejects(() => {
        throw { wrong: "true" };
      }),
    AssertionError,
    "Function throws when expected to reject.",
  );
});

Deno.test("assertRejects with PromiseLike", async () => {
  await assertRejects(
    () => ({
      then() {
        throw new Error("some error");
      },
    }),
    Error,
    "some error",
  );
});

Deno.test("assertThrows with non-error value thrown and error class", () => {
  assertThrows(
    () => {
      assertThrows(
        () => {
          throw "Panic!";
        },
        Error,
        "Panic!",
      );
    },
    AssertionError,
    "A non-Error object was thrown.",
  );
});

Deno.test("assertRejects with non-error value rejected and error class", async () => {
  await assertRejects(
    () => {
      return assertRejects(
        () => {
          return Promise.reject("Panic!");
        },
        Error,
        "Panic!",
      );
    },
    AssertionError,
    "A non-Error object was rejected.",
  );
});

Deno.test("assertThrows with non-error value thrown", () => {
  assertThrows(
    () => {
      throw "Panic!";
    },
  );
  assertThrows(
    () => {
      throw null;
    },
  );
  assertThrows(
    () => {
      throw undefined;
    },
  );
});

Deno.test("assertRejects with non-error value rejected", async () => {
  await assertRejects(() => {
    return Promise.reject(null);
  });
  await assertRejects(() => {
    return Promise.reject(undefined);
  });
});

Deno.test("assertThrows with error class", () => {
  assertThrows(
    () => {
      throw new Error("foo");
    },
    Error,
    "foo",
  );
});

Deno.test("assertRejects with error class", async () => {
  await assertRejects(
    () => {
      return Promise.reject(new Error("foo"));
    },
    Error,
    "foo",
  );
});

Deno.test("assertThrows with thrown error returns caught error", () => {
  const error = assertThrows(
    () => {
      throw new Error("foo");
    },
  );
  assert(error instanceof Error);
  assertEquals(error.message, "foo");
});

Deno.test("assertThrows with thrown non-error returns caught error", () => {
  const stringError = assertThrows(
    () => {
      throw "Panic!";
    },
  );
  assert(typeof stringError === "string");
  assertEquals(stringError, "Panic!");

  const numberError = assertThrows(
    () => {
      throw 1;
    },
  );
  assert(typeof numberError === "number");
  assertEquals(numberError, 1);

  const nullError = assertThrows(
    () => {
      throw null;
    },
  );
  assert(nullError === null);

  const undefinedError = assertThrows(
    () => {
      throw undefined;
    },
  );
  assert(typeof undefinedError === "undefined");
  assertEquals(undefinedError, undefined);
});

Deno.test("assertRejectes resolves with caught error", async () => {
  const error = await assertRejects(
    () => {
      return Promise.reject(new Error("foo"));
    },
  );
  assert(error instanceof Error);
  assertEquals(error.message, "foo");
});

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
  green(bold(stripColor(s)));
const removed: (s: string) => string = (s: string): string =>
  red(bold(stripColor(s)));

Deno.test({
  name: "pass case",
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
  name: "failed with number",
  fn() {
    assertThrows(
      () => assertEquals(1, 2),
      AssertionError,
      [
        "Values are not equal:",
        ...createHeader(),
        removed(`-   ${yellow("1")}`),
        added(`+   ${yellow("2")}`),
        "",
      ].join("\n"),
    );
  },
});

Deno.test({
  name: "failed with number vs string",
  fn() {
    assertThrows(
      () => assertEquals<unknown>(1, "1"),
      AssertionError,
      [
        "Values are not equal:",
        ...createHeader(),
        removed(`-   ${yellow("1")}`),
        added(`+   "1"`),
      ].join("\n"),
    );
  },
});

Deno.test({
  name: "failed with array",
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
  name: "failed with object",
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
  name: "failed with date",
  fn() {
    assertThrows(
      () =>
        assertEquals(
          new Date(2019, 0, 3, 4, 20, 1, 10),
          new Date(2019, 0, 3, 4, 20, 1, 20),
        ),
      AssertionError,
      [
        "Values are not equal:",
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
        "Values are not equal:",
        ...createHeader(),
        removed(`-   ${new Date("invalid")}`),
        added(`+   ${new Date(2019, 0, 3, 4, 20, 1, 20).toISOString()}`),
        "",
      ].join("\n"),
    );
  },
});

Deno.test({
  name: "strict types test",
  fn() {
    const x = { number: 2 };

    const y = x as Record<never, never>;
    const z = x as unknown;

    // y.number;
    //   ~~~~~~
    // Property 'number' does not exist on type 'Record<never, never>'.deno-ts(2339)

    assertStrictEquals(y, x);
    y.number; // ok

    // z.number;
    // ~
    // Object is of type 'unknown'.deno-ts(2571)

    assertStrictEquals(z, x);
    z.number; // ok
  },
});

Deno.test({
  name: "strict pass case",
  fn() {
    assertStrictEquals(true, true);
    assertStrictEquals(10, 10);
    assertStrictEquals("abc", "abc");
    assertStrictEquals(NaN, NaN);

    const xs = [1, false, "foo"];
    const ys = xs;
    assertStrictEquals(xs, ys);

    const x = { a: 1 };
    const y = x;
    assertStrictEquals(x, y);
  },
});

Deno.test({
  name: "strict failed with structure diff",
  fn() {
    assertThrows(
      () => assertStrictEquals({ a: 1, b: 2 }, { a: 1, c: [3] }),
      AssertionError,
      `
    {
      a: 1,
+     c: [
+       3,
+     ],
-     b: 2,
    }`,
    );
  },
});

Deno.test({
  name: "strict failed with reference diff",
  fn() {
    assertThrows(
      () => assertStrictEquals({ a: 1, b: 2 }, { a: 1, b: 2 }),
      AssertionError,
      `Values have the same structure but are not reference-equal:

    {
      a: 1,
      b: 2,
    }`,
    );
  },
});

Deno.test({
  name: "strictly unequal pass case",
  fn() {
    assertNotStrictEquals(true, false);
    assertNotStrictEquals(10, 11);
    assertNotStrictEquals("abc", "xyz");
    assertNotStrictEquals<unknown>(1, "1");
    assertNotStrictEquals(-0, +0);

    const xs = [1, false, "foo"];
    const ys = [1, true, "bar"];
    assertNotStrictEquals(xs, ys);

    const x = { a: 1 };
    const y = { a: 2 };
    assertNotStrictEquals(x, y);
  },
});

Deno.test({
  name: "strictly unequal fail case",
  fn() {
    assertThrows(() => assertNotStrictEquals(1, 1), AssertionError);
    assertThrows(() => assertNotStrictEquals(NaN, NaN), AssertionError);
  },
});

Deno.test("assert almost equals number", () => {
  //Default precision
  assertAlmostEquals(-0, +0);
  assertAlmostEquals(Math.PI, Math.PI);
  assertAlmostEquals(0.1 + 0.2, 0.3);
  assertAlmostEquals(NaN, NaN);
  assertAlmostEquals(Number.NaN, Number.NaN);
  assertThrows(() => assertAlmostEquals(1, 2));
  assertThrows(() => assertAlmostEquals(1, 1.1));

  //Higher precision
  assertAlmostEquals(0.1 + 0.2, 0.3, 1e-16);
  assertThrows(
    () => assertAlmostEquals(0.1 + 0.2, 0.3, 1e-17),
    AssertionError,
    `"${
      (
        0.1 + 0.2
      ).toExponential()
    }" expected to be close to "${(0.3).toExponential()}"`,
  );

  //Special cases
  assertAlmostEquals(Infinity, Infinity);
  assertThrows(
    () => assertAlmostEquals(0, Infinity),
    AssertionError,
    '"0" expected to be close to "Infinity"',
  );
  assertThrows(
    () => assertAlmostEquals(-Infinity, +Infinity),
    AssertionError,
    '"-Infinity" expected to be close to "Infinity"',
  );
  assertThrows(
    () => assertAlmostEquals(Infinity, NaN),
    AssertionError,
    '"Infinity" expected to be close to "NaN"',
  );
});

Deno.test({
  name: "assertInstanceOf",
  fn() {
    class TestClass1 {}
    class TestClass2 {}
    class TestClass3 {}

    // Regular types
    assertInstanceOf(new Date(), Date);
    assertInstanceOf(new Number(), Number);
    assertInstanceOf(Promise.resolve(), Promise);
    assertInstanceOf(new TestClass1(), TestClass1);

    // Throwing cases
    assertThrows(
      () => assertInstanceOf(new Date(), RegExp),
      AssertionError,
      `Expected object to be an instance of "RegExp" but was "Date".`,
    );
    assertThrows(
      () => assertInstanceOf(5, Date),
      AssertionError,
      `Expected object to be an instance of "Date" but was "number".`,
    );
    assertThrows(
      () => assertInstanceOf(new TestClass1(), TestClass2),
      AssertionError,
      `Expected object to be an instance of "TestClass2" but was "TestClass1".`,
    );

    // Custom message
    assertThrows(
      () => assertInstanceOf(new Date(), RegExp, "Custom message"),
      AssertionError,
      "Custom message",
    );

    // Edge cases
    assertThrows(
      () => assertInstanceOf(5, Number),
      AssertionError,
      `Expected object to be an instance of "Number" but was "number".`,
    );

    let TestClassWithSameName: new () => unknown;
    {
      class TestClass3 {}
      TestClassWithSameName = TestClass3;
    }
    assertThrows(
      () => assertInstanceOf(new TestClassWithSameName(), TestClass3),
      AssertionError,
      `Expected object to be an instance of "TestClass3".`,
    );

    assertThrows(
      () => assertInstanceOf(TestClass1, TestClass1),
      AssertionError,
      `Expected object to be an instance of "TestClass1" but was not an instanced object.`,
    );
    assertThrows(
      () => assertInstanceOf(() => {}, TestClass1),
      AssertionError,
      `Expected object to be an instance of "TestClass1" but was not an instanced object.`,
    );
    assertThrows(
      () => assertInstanceOf(null, TestClass1),
      AssertionError,
      `Expected object to be an instance of "TestClass1" but was "null".`,
    );
    assertThrows(
      () => assertInstanceOf(undefined, TestClass1),
      AssertionError,
      `Expected object to be an instance of "TestClass1" but was "undefined".`,
    );
    assertThrows(
      () => assertInstanceOf({}, TestClass1),
      AssertionError,
      `Expected object to be an instance of "TestClass1" but was "Object".`,
    );
    assertThrows(
      () => assertInstanceOf(Object.create(null), TestClass1),
      AssertionError,
      `Expected object to be an instance of "TestClass1" but was "Object".`,
    );

    // Test TypeScript types functionality, wrapped in a function that never runs
    // deno-lint-ignore no-unused-vars
    function typeScriptTests() {
      class ClassWithProperty {
        property = "prop1";
      }
      const testInstance = new ClassWithProperty() as unknown;

      // @ts-expect-error: `testInstance` is `unknown` so setting its property before `assertInstanceOf` should give a type error.
      testInstance.property = "prop2";

      assertInstanceOf(testInstance, ClassWithProperty);

      // Now `testInstance` should be of type `ClassWithProperty`
      testInstance.property = "prop3";

      let x = 5 as unknown;

      // @ts-expect-error: `x` is `unknown` so adding to it shouldn't work
      x += 5;
      assertInstanceOf(x, Number);

      // @ts-expect-error: `x` is now `Number` rather than `number`, so this should still give a type error.
      x += 5;
    }
  },
});

Deno.test({
  name: "assertNotInstanceOf",
  fn() {
    assertNotInstanceOf("not a number", Number);
    assertNotInstanceOf(42, String);
    assertNotInstanceOf(new URL("http://example.com"), Boolean);
  },
});

Deno.test({
  name: "assert* functions with specified type parameter",
  fn() {
    assertEquals<string>("hello", "hello");
    assertNotEquals<number>(1, 2);
    assertArrayIncludes<boolean>([true, false], [true]);
    const value = { x: 1 };
    assertStrictEquals<typeof value>(value, value);
    // deno-lint-ignore ban-types
    assertNotStrictEquals<object>(value, { x: 1 });
  },
});

Deno.test(
  "assertEquals compares objects structurally if one object's constructor is undefined and the other is Object",
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

Deno.test("assertEquals diff for differently ordered objects", () => {
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

Deno.test("Assert Throws Parent Error", () => {
  assertThrows(
    () => {
      throw new AssertionError("Fail!");
    },
    Error,
    "Fail!",
  );
});

Deno.test("Assert Throws Async Parent Error", async () => {
  await assertRejects(
    () => {
      return Promise.reject(new AssertionError("Fail!"));
    },
    Error,
    "Fail!",
  );
});

Deno.test(
  "Assert Throws Async promise rejected with custom Error",
  async () => {
    class CustomError extends Error {}
    class AnotherCustomError extends Error {}
    await assertRejects(
      () =>
        assertRejects(
          () => Promise.reject(new AnotherCustomError("failed")),
          CustomError,
          "fail",
        ),
      AssertionError,
      'Expected error to be instance of "CustomError", but was "AnotherCustomError".',
    );
  },
);

Deno.test("Assert Is Error Non-Error Fail", () => {
  assertThrows(
    () => assertIsError("Panic!", undefined, "Panic!"),
    AssertionError,
    `Expected "error" to be an Error object.`,
  );

  assertThrows(
    () => assertIsError(null),
    AssertionError,
    `Expected "error" to be an Error object.`,
  );

  assertThrows(
    () => assertIsError(undefined),
    AssertionError,
    `Expected "error" to be an Error object.`,
  );
});

Deno.test("Assert Is Error Parent Error", () => {
  assertIsError(new AssertionError("Fail!"), Error, "Fail!");
});

Deno.test("Assert Is Error with custom Error", () => {
  class CustomError extends Error {}
  class AnotherCustomError extends Error {}
  assertIsError(new CustomError("failed"), CustomError, "fail");
  assertThrows(
    () => assertIsError(new AnotherCustomError("failed"), CustomError, "fail"),
    AssertionError,
    'Expected error to be instance of "CustomError", but was "AnotherCustomError".',
  );
});

Deno.test("Assert False with falsy values", () => {
  assertFalse(false);
  assertFalse(0);
  assertFalse("");
  assertFalse(null);
  assertFalse(undefined);
});

Deno.test("Assert False with truthy values", () => {
  assertThrows(() => assertFalse(true));
  assertThrows(() => assertFalse(1));
  assertThrows(() => assertFalse("a"));
  assertThrows(() => assertFalse({}));
  assertThrows(() => assertFalse([]));
});

Deno.test("assertEquals same Set with object keys", () => {
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
