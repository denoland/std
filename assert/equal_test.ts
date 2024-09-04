// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert, assertFalse, assertThrows, equal } from "./mod.ts";

Deno.test("equal() different zero", () => {
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

Deno.test("equal()", () => {
  assert(equal("world", "world"));
  assert(!equal("hello", "world"));
  assertFalse(equal("hello", "world"));
  assert(equal(5, 5));
  assert(!equal(5, 6));
  assertFalse(equal(5, 6));
  assert(equal(NaN, NaN));
  assert(equal(null, null));
  assertFalse(equal(null, undefined));
  assert(equal({ hello: "world" }, { hello: "world" }));
  assert(!equal({ world: "hello" }, { hello: "world" }));
  assertFalse(equal({}, { hello: "world" }));
  assertFalse(equal({ world: "hello" }, { hello: "world" }));
  assertFalse(equal({ hello: "world", world: "hello" }, { world: "hello" }));
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
      new (class<T extends object> extends WeakRef<T> {})({ hello: "world" }),
    ),
  );
  assertFalse(
    equal(
      new WeakRef({ hello: "world" }),
      new (class<T extends object> extends WeakRef<T> {})({ hello: "world" }),
    ),
  );
  assert(
    !equal(
      new WeakRef({ hello: "world" }),
      new (class<T extends object> extends WeakRef<T> {
        foo = "bar";
      })({ hello: "world" }),
    ),
  );
  assertFalse(
    equal(
      new WeakRef({ hello: "world" }),
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

Deno.test("equal() circular", () => {
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

Deno.test("equal() WeakMap, WeakRef and WeakSet", () => {
  assertThrows(() => equal(new WeakMap(), new WeakMap()));
  assertThrows(() => equal(new WeakSet(), new WeakSet()));
  assertFalse(equal(new WeakMap(), { constructor: WeakMap }));
  assertFalse(equal(new WeakSet(), { constructor: WeakSet }));
  assertFalse(equal(new WeakRef({}), { constructor: WeakRef }));
});

Deno.test("equal() fast path for primitive keyed collections", () => {
  const arr = Array.from({ length: 10_000 }, (_, i) => i);

  function makeSet(arr: number[]) {
    return new Set(arr);
  }
  function makeMap(arr: number[]) {
    return new Map(arr.map((v, i) => [i, v]));
  }

  const set1 = makeSet(arr);
  const set2 = makeSet(arr);
  assert(equal(set1, set2));

  const map1 = makeMap(arr);
  const map2 = makeMap(arr);
  assert(equal(map1, map2));

  const set3 = makeSet(arr);
  const set4 = makeSet(arr.with(-1, -1));
  assertFalse(equal(set3, set4));

  const map3 = makeMap(arr);
  const map4 = makeMap(arr.with(-1, -1));
  assertFalse(equal(map3, map4));
});

Deno.test("equal() keyed collection edge cases", () => {
  assert(equal(new Set([{ b: 2 }, { a: 1 }]), new Set([{ a: 1 }, { b: 2 }])));
  assertFalse(
    equal(new Set([{ b: 2 }, { a: 1 }]), new Set([{ a: 1 }, { b: 3 }])),
  );

  const sym = Symbol();
  assert(equal(new Set([sym]), new Set([sym])));
  assert(equal(new Set([sym, "a"]), new Set(["a", sym])));
  assertFalse(equal(new Set([sym, "a"]), new Set(["b", sym])));
  assertFalse(equal(new Set([Symbol()]), new Set([Symbol()])));
  assert(equal(new Set([Symbol.for("x")]), new Set([Symbol.for("x")])));

  assert(equal(
    new Map([[{ b: 2 }, 2], [{ a: 1 }, 1]]),
    new Map([[{ a: 1 }, 1], [{ b: 2 }, 2]]),
  ));
  assertFalse(equal(
    new Map([[{ b: 2 }, 2], [{ a: 1 }, 1]]),
    new Map([[{ a: 1 }, 1], [{ b: 2 }, 3]]),
  ));
  assertFalse(equal(
    new Map([[{ b: 2 }, 2], [{ a: 1 }, 1]]),
    new Map([[{ a: 1 }, 1], [{ b: 3 }, 2]]),
  ));

  assert(equal(
    new Map([[2, { b: 2 }], [1, { a: 1 }]]),
    new Map([[1, { a: 1 }], [2, { b: 2 }]]),
  ));
  assertFalse(equal(
    new Map([[2, { b: 2 }], [1, { a: 1 }]]),
    new Map([[1, { a: 1 }], [3, { b: 2 }]]),
  ));
  assertFalse(equal(
    new Map([[2, { b: 2 }], [1, { a: 1 }]]),
    new Map([[1, { a: 1 }], [2, { b: 3 }]]),
  ));
});
