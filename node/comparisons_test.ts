import { assertEquals } from "../testing/asserts.ts";
import { isDeepStrictEqual } from "./comparisons.ts";

Deno.test("[node/comparison] for basic Objects", async (t) => {
  const a = { ch: 1 };
  const b = { ch: 1 };
  const c = { ch: "1" };

  await t.step("equal objects", () => {
    assertEquals(isDeepStrictEqual(a, b), true);
  });

  await t.step("same object", () => {
    assertEquals(isDeepStrictEqual(a, a), true);
  });

  await t.step("similar looking objects", () => {
    assertEquals(isDeepStrictEqual(a, c), false);
  });
});

Deno.test(
  "[node/comparison] objects that don't have their own properties",
  async (t) => {
    const object = {};
    const fakeDate = {};
    const date = new Date();

    Object.setPrototypeOf(fakeDate, Date.prototype);

    await t.step("comparing object with fakeDate", () => {
      assertEquals(isDeepStrictEqual(object, fakeDate), false);
    });

    // FAILING TEST
    await t.step("comparing date with fakeDate", () => {
      assertEquals(isDeepStrictEqual(date, fakeDate), false);
    });
  },
);

Deno.test("[node/comparison] general primitive based cases", async (t) => {
  await t.step("handling NaN cases", () => {
    assertEquals(isDeepStrictEqual(NaN, NaN), true);
  });
  await t.step("handling scenarios uniqueness", () => {
    assertEquals(isDeepStrictEqual(-0, -0), true);
    assertEquals(isDeepStrictEqual(0, -0), false);
  });
});

Deno.test("[node/comparison] wrapped cases", async (t) => {
  await t.step("wrapped numbers", () => {
    assertEquals(isDeepStrictEqual(new Number(1), new Number(2)), false);
    assertEquals(isDeepStrictEqual(new Number(5), new Object(5)), true);
  });
  await t.step("wrapped string and object", () => {
    assertEquals(
      isDeepStrictEqual(new String("bar"), new String("baz")),
      false,
    );
    assertEquals(isDeepStrictEqual(new String("foo"), Object("foo")), true);
  });
});

Deno.test("[node/comparison] symbol cases", async (t) => {
  const symbol1 = Symbol();
  const symbol2 = Symbol();

  await t.step("same symbol in both objects", () => {
    assertEquals(isDeepStrictEqual({ [symbol1]: 1 }, { [symbol1]: 1 }), true);
  });
  await t.step("different symbol in objects", () => {
    assertEquals(isDeepStrictEqual({ [symbol2]: 1 }, { [symbol1]: 1 }), false);
  });
});

Deno.test("[node/comparison] map cases", async (t) => {
  const weakMap1 = new WeakMap();
  const weakMap2 = new WeakMap([[{}, {}]]);
  const weakMap3 = new WeakMap();
  weakMap3.set(["unequal"], true);

  // FAILING TEST
  await t.step("different maps", () => {
    assertEquals(isDeepStrictEqual(weakMap1, weakMap2), false);
  });

  await t.step("maps with uniquely different property", () => {
    assertEquals(isDeepStrictEqual(weakMap1, weakMap3), false);
  });
});

/*
  Comparison Details as per
  https://nodejs.org/dist/latest-v14.x/docs/api/assert.html#assert_assert_deepstrictequal_actual_expected_message
  Primitive values are compared using the SameValue Comparison, used by Object.is().
  Type tags of objects should be the same.
  [[Prototype]] of objects are compared using the Strict Equality Comparison.
  Only enumerable "own" properties are considered.
  Enumerable own Symbol properties are compared as well.
  Object wrappers are compared both as objects and unwrapped values.
  Object properties are compared unordered.
  Map keys and Set items are compared unordered.
  Recursion stops when both sides differ or both sides encounter a circular reference.


  Failing Tests
  WeakMap and WeakSet comparison does not rely on their values. See below for further details.

  Pending Implementation of tests
  Error names and messages are always compared, even if these are not enumerable properties.
*/
