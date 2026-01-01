// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { D2Array } from "./unstable_2d_array.ts";

Deno.test("D2Array constructor - width/height overload", () => {
  const arr = new D2Array(3, 2, "test");
  assertEquals(arr.width, 3);
  assertEquals(arr.height, 2);
  assertEquals(arr.initialValue, "test");
  assertEquals(arr.raw, [
    ["test", "test", "test"],
    ["test", "test", "test"],
  ]);
});

Deno.test("D2Array constructor - array overload", () => {
  const input = [
    [1, 2, 3],
    [4, 5, 6],
  ];
  const arr = new D2Array(input, 0);
  assertEquals(arr.width, 3);
  assertEquals(arr.height, 2);
  assertEquals(arr.initialValue, 0);
  assertEquals(arr.raw, [
    [1, 2, 3],
    [4, 5, 6],
  ]);
});

Deno.test("D2Array constructor - throws on invalid dimensions", () => {
  assertThrows(() => new D2Array(0, 5, false), "Width must be greater than 0");
  assertThrows(() => new D2Array(5, 0, false), "Height must be greater than 0");
  assertThrows(() => new D2Array([], false), "Height must be greater than 0");
  assertThrows(() => new D2Array([[]], false), "Width must be greater than 0");
});

Deno.test("D2Array width and height getters", () => {
  const arr1 = new D2Array(5, 3, 0);
  assertEquals(arr1.width, 5);
  assertEquals(arr1.height, 3);

  const arr2 = new D2Array([
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
  ], 0);
  assertEquals(arr2.width, 2);
  assertEquals(arr2.height, 4);
});

Deno.test("D2Array slice - default parameters", () => {
  const arr = new D2Array([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ], 0);
  const slice = arr.slice();
  assertEquals(slice.width, 3);
  assertEquals(slice.height, 3);
  assertEquals(slice.raw, [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]);
});

Deno.test("D2Array slice - with coordinates and dimensions", () => {
  const arr = new D2Array([
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ], 0);
  const slice = arr.slice(1, 1, 2, 2);
  assertEquals(slice.width, 2);
  assertEquals(slice.height, 2);
  assertEquals(slice.raw, [
    [6, 7],
    [10, 11],
  ]);
});

Deno.test("D2Array slice - partial dimensions", () => {
  const arr = new D2Array([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ], 0);
  const slice1 = arr.slice(1, 0);
  assertEquals(slice1.raw, [
    [2, 3],
    [5, 6],
    [8, 9],
  ]);

  const slice2 = arr.slice(0, 1, 2);
  assertEquals(slice2.raw, [
    [4, 5],
    [7, 8],
  ]);
});

Deno.test("D2Array resize - same size", () => {
  const arr = new D2Array(3, 2, 0);
  arr.raw[0]![0] = 5;
  arr.resize(3, 2);
  assertEquals(arr.width, 3);
  assertEquals(arr.height, 2);
  assertEquals(arr.raw[0]![0], 5);
});

Deno.test("D2Array resize - shrink both dimensions", () => {
  const arr = new D2Array([
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ], 0);
  arr.resize(2, 2);
  assertEquals(arr.width, 2);
  assertEquals(arr.height, 2);
  assertEquals(arr.raw, [
    [1, 2],
    [5, 6],
  ]);
});

Deno.test("D2Array resize - grow both dimensions", () => {
  const arr = new D2Array([
    [1, 2],
    [3, 4],
  ], 0);
  arr.resize(4, 3);
  assertEquals(arr.width, 4);
  assertEquals(arr.height, 3);
  assertEquals(arr.raw, [
    [1, 2, 0, 0],
    [3, 4, 0, 0],
    [0, 0, 0, 0],
  ]);
});

Deno.test("D2Array resize - mixed grow/shrink", () => {
  const arr = new D2Array([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ], -1);
  arr.resize(2, 4);
  assertEquals(arr.width, 2);
  assertEquals(arr.height, 4);
  assertEquals(arr.raw, [
    [1, 2],
    [4, 5],
    [7, 8],
    [-1, -1],
  ]);
});

Deno.test("D2Array resize - throws on invalid dimensions", () => {
  const arr = new D2Array(3, 3, 0);
  assertThrows(() => arr.resize(0, 3), "Width must be greater than 0");
  assertThrows(() => arr.resize(3, 0), "Height must be greater than 0");
});

Deno.test("D2Array insert - with D2Array", () => {
  const arr = new D2Array(5, 5, false);
  const insert = new D2Array(3, 3, true);
  arr.insert(1, 1, insert);
  assertEquals(arr.raw, [
    [false, false, false, false, false],
    [false, true, true, true, false],
    [false, true, true, true, false],
    [false, true, true, true, false],
    [false, false, false, false, false],
  ]);
});

Deno.test("D2Array insert - with regular array", () => {
  const arr = new D2Array(4, 4, 0);
  const insert = [
    [1, 2],
    [3, 4],
  ];
  arr.insert(1, 1, insert);
  assertEquals(arr.raw, [
    [0, 0, 0, 0],
    [0, 1, 2, 0],
    [0, 3, 4, 0],
    [0, 0, 0, 0],
  ]);
});

Deno.test("D2Array insert - out of bounds clipping", () => {
  const arr = new D2Array(3, 3, 0);
  const insert = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ];
  arr.insert(1, 1, insert);
  assertEquals(arr.raw, [
    [0, 0, 0],
    [0, 1, 2],
    [0, 5, 6],
  ]);
});

Deno.test("D2Array insert - at origin", () => {
  const arr = new D2Array(3, 3, 0);
  const insert = [
    [1, 2],
    [3, 4],
  ];
  arr.insert(0, 0, insert);
  assertEquals(arr.raw, [
    [1, 2, 0],
    [3, 4, 0],
    [0, 0, 0],
  ]);
});

Deno.test("D2Array iterator functionality", () => {
  const arr = new D2Array([
    [1, 2],
    [3, 4],
    [5, 6],
  ], 0);

  const rows = [];
  for (const row of arr) {
    rows.push(row);
  }

  assertEquals(rows, [
    [1, 2],
    [3, 4],
    [5, 6],
  ]);
});

Deno.test("D2Array iterator with spread operator", () => {
  const arr = new D2Array([
    ["a", "b"],
    ["c", "d"],
  ], "");

  const rows = [...arr];
  assertEquals(rows, [
    ["a", "b"],
    ["c", "d"],
  ]);
});

Deno.test("D2Array slice - edge cases", () => {
  const arr = new D2Array(2, 2, 0);

  assertThrows(() => arr.slice(0, 0, 0, 1), "Width must be greater than 0");
  assertThrows(() => arr.slice(0, 0, 1, 0), "Height must be greater than 0");
});

Deno.test("D2Array array constructor maintains independence", () => {
  const original = [
    [1, 2],
    [3, 4],
  ];
  const arr = new D2Array(original, 0);

  original[0]![0] = 999;
  assertEquals(arr.raw[0]![0], 1);
});

Deno.test("D2Array slice creates independent copy", () => {
  const arr = new D2Array([
    [1, 2, 3],
    [4, 5, 6],
  ], 0);

  const slice = arr.slice(0, 0, 2, 2);
  arr.raw[0]![0] = 999;

  assertEquals(slice.raw[0]![0], 1);
});

Deno.test("D2Array insert with coordinates beyond array bounds", () => {
  const arr = new D2Array(3, 3, 0);
  const insert = [[1, 2], [3, 4]];

  arr.insert(5, 5, insert);
  assertEquals(arr.raw, [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);
});
