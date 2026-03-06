// Copyright 2018-2026 the Deno authors. MIT license.

import { Buffer } from "node:buffer";
import { Buffer as DenoBuffer } from "@std/io/buffer";
import { expect } from "./expect.ts";

Deno.test("expect.objectContaining()", () => {
  expect({ bar: "baz" }).toEqual(expect.objectContaining({ bar: "baz" }));
  expect({ foo: undefined }).toEqual(
    expect.objectContaining({ foo: undefined }),
  );
  expect({ bar: "baz" }).not.toEqual(expect.objectContaining({ foo: "bar" }));
});

Deno.test("expect.objectContaining() with nested objects", () => {
  expect({ foo: { bar: "baz" } }).toEqual(
    expect.objectContaining({ foo: { bar: "baz" } }),
  );
  expect({ foo: { bar: "baz" } }).not.toEqual(
    expect.objectContaining({ foo: { bar: "bar" } }),
  );
});

Deno.test("expect.objectContaining() with symbols", () => {
  const foo = Symbol("foo");
  expect({ [foo]: { bar: "baz" } }).toEqual(
    expect.objectContaining({ [foo]: { bar: "baz" } }),
  );
});

Deno.test("expect.objectContaining() with nested arrays", () => {
  expect({ foo: ["bar", "baz"] }).toEqual(
    expect.objectContaining({ foo: ["bar", "baz"] }),
  );
  expect({ foo: ["bar", "baz"] }).not.toEqual(
    expect.objectContaining({ foo: ["bar", "bar"] }),
  );
});

Deno.test("expect.objectContaining() with Node Buffer", () => {
  expect({ foo: Buffer.from("foo") }).toEqual(
    expect.objectContaining({ foo: Buffer.from("foo") }),
  );
});

Deno.test("expect.objectContaining() with Deno Buffer", () => {
  expect({ foo: new DenoBuffer([1, 2, 3]) }).toEqual(
    expect.objectContaining({ foo: new DenoBuffer([1, 2, 3]) }),
  );
});

Deno.test("expect.not.objectContaining()", () => {
  expect({ bar: "baz" }).toEqual(expect.not.objectContaining({ foo: "bar" }));
  expect({ foo: ["bar", "baz"] }).toEqual(
    expect.not.objectContaining({ foo: ["bar", "bar"] }),
  );
});

Deno.test("expect.not.objectContaining() with symbols", () => {
  const foo = Symbol("foo");
  expect({ [foo]: { bar: "baz" } }).toEqual(
    expect.objectContaining({ [foo]: { bar: "bazzzz" } }),
  );
});
