import { assertEquals } from "https://deno.land/std@0.100.0/testing/asserts.ts";
import { distinct } from "./distinct.ts";

function distinctTest<I>(
  input: Array<I>,
  expected: Array<I>,
  message?: string,
) {
  const actual = distinct(input);
  assertEquals(actual, expected, message);
}

Deno.test("identities on empty array", () => {
  distinctTest([], []);
});

Deno.test("removes duplicates and preserves order", () => {
  distinctTest(
    [true, "asdf", 4, "asdf", true],
    [true, "asdf", 4],
  );
  distinctTest(
    [null, undefined, null, "foo", undefined],
    [null, undefined, "foo"],
  );
  distinctTest(
    [true, "asdf", 4, "asdf", true],
    [true, "asdf", 4],
  );
});

Deno.test("does not check for deep equality", () => {
  const objects = [{ foo: "bar" }, { foo: "bar" }];
  distinctTest(objects, objects);

  const arrays = [[], []];
  distinctTest(arrays, arrays);

  const nans = [NaN, NaN];
  distinctTest(nans, nans);

  const noops = [() => {}, () => {}];
  distinctTest(noops, noops);

  const sets = [new Set(), new Set()];
  distinctTest(sets, sets);
});
