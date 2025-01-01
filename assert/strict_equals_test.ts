// Copyright 2018-2025 the Deno authors. MIT license.
import { AssertionError, assertStrictEquals, assertThrows } from "./mod.ts";

Deno.test({
  name: "assertStrictEquals()",
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
  name: "assertStrictEquals() types test",
  fn() {
    const x = { number: 2 };

    const y = x as Record<never, never>;
    const z = x as unknown;

    // @ts-expect-error Property 'number' does not exist on type 'Record<never, never>'.deno-ts(2339)
    y.number;

    assertStrictEquals(y, x);
    y.number; // ok

    // @ts-expect-error 'z' is of type 'unknown'.deno-ts(18046)
    z.number;

    assertStrictEquals(z, x);
    z.number; // ok
  },
});

Deno.test({
  name: "assertStrictEquals() throws with structure diff",
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
  name: "assertStrictEquals() throws with reference diff",
  fn() {
    assertThrows(
      () => assertStrictEquals({ a: 1, b: 2 }, { a: 1, b: 2 }),
      AssertionError,
      `Values have the same structure but are not reference-equal.

    {
      a: 1,
      b: 2,
    }`,
    );
  },
});

Deno.test({
  name: "assertStrictEquals() throws with custom message",
  fn() {
    assertThrows(
      () => assertStrictEquals({ a: 1 }, { a: 1 }, "CUSTOM MESSAGE"),
      AssertionError,
      `Values have the same structure but are not reference-equal: CUSTOM MESSAGE

    {
      a: 1,
    }`,
    );
  },
});
