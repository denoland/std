import { assertEquals } from "https://deno.land/std@0.100.0/testing/asserts.ts";
import { distinctBy } from "./distinct_by.ts";

function distinctByTest<I>(
  array: Array<I>,
  selector: (element: I) => unknown,
  expected: Array<I>,
  message?: string,
) {
  const actual = distinctBy(array, selector);
  assertEquals(actual, expected, message);
}

Deno.test("identities on empty array", () => {
  distinctByTest(
    [],
    () => {},
    [],
  );
});

Deno.test("gets head on noop selector", () => {
  distinctByTest(
    [25, "asdf", true],
    () => {},
    [25],
  );
});

Deno.test("removes duplicates and preserves order on identity", () => {
  distinctByTest(
    [true, "asdf", 4, "asdf", true],
    (it) => it,
    [true, "asdf", 4],
  );
  distinctByTest(
    [null, undefined, null, "foo", undefined],
    (it) => it,
    [null, undefined, "foo"],
  );
  distinctByTest(
    [true, "asdf", 4, "asdf", true],
    (it) => it,
    [true, "asdf", 4],
  );
});

Deno.test("does not check for deep equality on identity", () => {
  const objects = [{ foo: "bar" }, { foo: "bar" }];
  distinctByTest(
    objects,
    (it) => it,
    objects,
  );

  const arrays = [[], []];
  distinctByTest(
    arrays,
    (it) => it,
    arrays,
  );

  const nans = [NaN, NaN];
  distinctByTest(
    nans,
    (it) => it,
    nans,
  );

  const noops = [() => {}, () => {}];
  distinctByTest(
    noops,
    (it) => it,
    noops,
  );

  const sets = [new Set(), new Set()];
  distinctByTest(
    sets,
    (it) => it,
    sets,
  );
});

Deno.test("distincts by selected value and preserves order", () => {
  const kim = { name: "Kim", age: 22 };
  const arthur = { name: "Arthur", age: 22 };
  const anna = { name: "Anna", age: 48 };
  const karl = { name: "Karl", age: 48 };
  const people = [kim, arthur, anna, karl];

  distinctByTest(
    people,
    (it) => it.name.charAt(0),
    [kim, arthur],
  );
  distinctByTest(
    people,
    (it) => it.age,
    [kim, anna],
  );
  distinctByTest(
    people,
    (it) => it.name.length,
    [kim, arthur, anna],
  );
});
