import { assertEquals, assertRejects, assertThrows } from "./asserts.ts";
import { delay } from "../async/delay.ts";
import {
  resolvesNext,
  returnsArg,
  returnsArgs,
  returnsNext,
  returnsThis,
} from "./_callbacks.ts";
import { MockError } from "./mock.ts";

Deno.test("returnsThis", () => {
  const callback = returnsThis();
  const obj = { callback, x: 1, y: 2 };
  const obj2 = { x: 2, y: 3 };
  assertEquals(callback(), undefined);
  assertEquals(obj.callback(), obj);
  assertEquals(callback.apply(obj2, []), obj2);
});

Deno.test("returnsArg", () => {
  let callback = returnsArg(0);
  assertEquals(callback(), undefined);
  assertEquals(callback("a"), "a");
  assertEquals(callback("b", "c"), "b");
  callback = returnsArg(1);
  assertEquals(callback(), undefined);
  assertEquals(callback("a"), undefined);
  assertEquals(callback("b", "c"), "c");
  assertEquals(callback("d", "e", "f"), "e");
});

Deno.test("returnsArgs", () => {
  let callback = returnsArgs();
  assertEquals(callback(), []);
  assertEquals(callback("a"), ["a"]);
  assertEquals(callback("b", "c"), ["b", "c"]);
  callback = returnsArgs(1);
  assertEquals(callback(), []);
  assertEquals(callback("a"), []);
  assertEquals(callback("b", "c"), ["c"]);
  assertEquals(callback("d", "e", "f"), ["e", "f"]);
  callback = returnsArgs(1, 3);
  assertEquals(callback("a"), []);
  assertEquals(callback("b", "c"), ["c"]);
  assertEquals(callback("d", "e", "f"), ["e", "f"]);
  assertEquals(callback("d", "e", "f", "g"), ["e", "f"]);
});

Deno.test("returnsNext with array", () => {
  let results = [1, 2, new Error("oops"), 3];
  let callback = returnsNext(results);
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 4 times",
  );
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 4 times",
  );

  results = [];
  callback = returnsNext(results);
  results.push(1, 2, new Error("oops"), 3);
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  results.push(4);
  assertEquals(callback(), 4);
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 5 times",
  );
  results.push(5);
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 5 times",
  );
});

Deno.test("returnsNext with iterator", () => {
  let results = [1, 2, new Error("oops"), 3];
  let callback = returnsNext(results.values());
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 4 times",
  );
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 4 times",
  );

  results = [];
  callback = returnsNext(results.values());
  results.push(1, 2, new Error("oops"), 3);
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  results.push(4);
  assertEquals(callback(), 4);
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 5 times",
  );
  results.push(5);
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 5 times",
  );
});

Deno.test("returnsNext with generator", () => {
  let results = [1, 2, new Error("oops"), 3];
  const generator = function* () {
    yield* results;
  };
  let callback = returnsNext(generator());
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 4 times",
  );
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 4 times",
  );

  results = [];
  callback = returnsNext(generator());
  results.push(1, 2, new Error("oops"), 3);
  assertEquals(callback(), 1);
  assertEquals(callback(), 2);
  assertThrows(() => callback(), Error, "oops");
  assertEquals(callback(), 3);
  results.push(4);
  assertEquals(callback(), 4);
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 5 times",
  );
  results.push(5);
  assertThrows(
    () => callback(),
    MockError,
    "not expected to be called more than 5 times",
  );
});

Deno.test("resolvesNext with array", async () => {
  let results = [
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  ];
  let callback = resolvesNext(results);
  const value = callback();
  assertEquals(Promise.resolve(value), value);
  assertEquals(await value, 1);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 5 times",
  );
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 5 times",
  );

  results = [];
  callback = resolvesNext(results);
  results.push(
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  );
  assertEquals(await callback(), 1);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  results.push(4);
  assertEquals(await callback(), 4);
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 6 times",
  );
  results.push(5);
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 6 times",
  );
});

Deno.test("resolvesNext with iterator", async () => {
  let results = [
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  ];
  let callback = resolvesNext(results.values());
  const value = callback();
  assertEquals(Promise.resolve(value), value);
  assertEquals(await value, 1);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 5 times",
  );
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 5 times",
  );

  results = [];
  callback = resolvesNext(results.values());
  results.push(
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  );
  assertEquals(await callback(), 1);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  results.push(4);
  assertEquals(await callback(), 4);
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 6 times",
  );
  results.push(5);
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 6 times",
  );
});

Deno.test("resolvesNext with async generator", async () => {
  let results = [
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  ];
  const asyncGenerator = async function* () {
    await delay(0);
    yield* results;
  };
  let callback = resolvesNext(asyncGenerator());
  const value = callback();
  assertEquals(Promise.resolve(value), value);
  assertEquals(await value, 1);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 5 times",
  );
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 5 times",
  );

  results = [];
  callback = resolvesNext(asyncGenerator());
  results.push(
    1,
    new Error("oops"),
    Promise.resolve(2),
    Promise.resolve(new Error("oops")),
    3,
  );
  assertEquals(await callback(), 1);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 2);
  assertRejects(() => callback(), Error, "oops");
  assertEquals(await callback(), 3);
  results.push(4);
  assertEquals(await callback(), 4);
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 6 times",
  );
  results.push(5);
  assertRejects(
    async () => await callback(),
    MockError,
    "not expected to be called more than 6 times",
  );
});
