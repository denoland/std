import { includesValue } from "./includes_value.ts";
import { assert, assertEquals } from "../testing/asserts.ts";

Deno.test("[collections/includesValue] Example", () => {
  const input = {
    first: 33,
    second: 34,
  };
  const actual = includesValue(input, 34);
  assert(actual);
});

Deno.test("[collections/includesValue] No mutation", () => {
  const input = {
    first: 33,
    second: 34,
  };

  includesValue(input, 34);

  assertEquals(input, {
    first: 33,
    second: 34,
  });
});

Deno.test("[collections/includesValue] Empty input returns false", () => {
  const input = {};

  const actual = includesValue(input, 44);

  assert(!actual);
});

Deno.test("[collections/includesValue] Returns false when it doesn't include the value", () => {
  const input = {
    first: 33,
    second: 34,
  };

  const actual = includesValue(input, 45);

  assert(!actual);
});
