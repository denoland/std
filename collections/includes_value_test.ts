// Copyright 2018-2025 the Deno authors. MIT license.
import { includesValue } from "./includes_value.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("includesValue() handles example", () => {
  const input = {
    first: 33,
    second: 34,
  };
  const actual = includesValue(input, 34);
  assert(actual);
});

Deno.test("includesValue() handles no mutation", () => {
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

Deno.test("includesValue() handles empty input returns false", () => {
  const input = {};

  const actual = includesValue(input, 44);

  assert(!actual);
});

Deno.test("includesValue() returns false when it doesn't include the value", () => {
  const input = {
    first: 33,
    second: 34,
  };

  const actual = includesValue(input, 45);

  assert(!actual);
});

Deno.test("includesValue() handles non-enumerable properties", () => {
  // FAIL is expected, TODO: Figure out how to make it work on
  const input = {};

  Object.defineProperty(input, "nep", {
    enumerable: false,
    value: 42,
  });

  Object.defineProperty(input, "neptwo", {
    enumerable: false,
    value: "hello",
  });

  Object.defineProperty(input, "nepthree", {
    enumerable: false,
    value: true,
  });

  const actual1 = includesValue(input, 42);
  const actual2 = includesValue(input, "hello");
  const actual3 = includesValue(input, true);

  assert(!actual1);
  assert(!actual2);
  assert(!actual3);
});

Deno.test("includesValue() handles non-primitive values", () => {
  const input = {
    first: {},
  };

  const actual = includesValue(input, {});

  assert(!actual);
});

Deno.test("includesValue() handles same behaviour as naive impl", () => {
  const input = {
    first: 42,
  };

  const includesValueResult = includesValue(input, 42);
  const naiveImplResult = Object.values(input).includes(42);

  assertEquals(includesValueResult, naiveImplResult);
});

Deno.test("includesValue() handles NaN value", () => {
  const input = {
    first: NaN,
  };

  const actual = includesValue(input, NaN);

  assert(actual);
});

Deno.test("includesValue() prevents enumerable prototype check", () => {
  class Foo {}
  // @ts-ignore: for test
  Foo.prototype.a = "hello";
  const input = new Foo() as Record<string, string>;

  const actual = includesValue(input, "hello");

  assert(!actual);
});
