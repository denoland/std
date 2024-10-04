// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { dropWhile } from "./drop_while.ts";
import {
  dropWhile as unstableDropWhile,
  dropWhileInPlace,
} from "./unstable_drop_while.ts";

const count = 1_000;
const exampleObject = { a: 1, b: 2, c: 3 };
const arr = Array.from({ length: count }, (_, i) => ({
  ...exampleObject,
  value: i,
}));
function* gen() {
  let v = 0;
  while (v < count) {
    yield ({
      ...exampleObject,
      value: v,
    });
    v++;
  }
}
function predicate(el: { value: number }) {
  return el.value < (count / 2);
}
Deno.bench({
  name: "dropWhile",
  group: "array",
  fn: () => {
    dropWhile(arr, predicate);
  },
});

Deno.bench({
  name: "unstable dropWhile",
  group: "array",
  baseline: true,
  fn: () => {
    unstableDropWhile(arr, predicate);
  },
});

const mutationArr = structuredClone(arr);
Deno.bench({
  name: "unstable dropWhile in place",
  group: "array",
  fn: () => {
    dropWhileInPlace(mutationArr, predicate);
  },
});

Deno.bench({
  name: "unstable dropWhile",
  group: "generator",
  fn: () => {
    unstableDropWhile(gen(), predicate);
  },
});
