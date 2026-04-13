// Copyright 2018-2026 the Deno authors. MIT license.
import { generateRandomString } from "./_test_util.ts";
import { reverse } from "./unstable_reverse.ts";

function splitReverseJoin(str: string) {
  return str.split("").reverse().join("");
}

function forOf(str: string) {
  let reversed = "";
  for (const character of str) {
    reversed = character + reversed;
  }
  return reversed;
}

function reduce(str: string) {
  return str.split("").reduce(
    (reversed, character) => character + reversed,
    "",
  );
}

function spreadReverseJoin(str: string) {
  return [...str].reverse().join("");
}

function forLoop(str: string) {
  let x = "";

  for (let i = str.length - 1; i >= 0; --i) {
    x += str[i];
  }

  return x;
}

const strings = Array.from({ length: 10000 }).map(() =>
  generateRandomString(0, 100)
);

Deno.bench({
  group: "reverseString",
  name: "splitReverseJoin",
  fn: () => {
    for (let i = 0; i < strings.length; i++) {
      splitReverseJoin(strings[i]!);
    }
  },
});
Deno.bench({
  group: "reverseString",
  name: "forOf",
  fn: () => {
    for (let i = 0; i < strings.length; i++) {
      forOf(strings[i]!);
    }
  },
});
Deno.bench({
  group: "reverseString",
  name: "reduce",
  fn: () => {
    for (let i = 0; i < strings.length; i++) {
      reduce(strings[i]!);
    }
  },
});
Deno.bench({
  group: "reverseString",
  name: "spreadReverseJoin",
  fn: () => {
    for (let i = 0; i < strings.length; i++) {
      spreadReverseJoin(strings[i]!);
    }
  },
});
Deno.bench({
  group: "reverseString",
  name: "forLoop",
  fn: () => {
    for (let i = 0; i < strings.length; i++) {
      forLoop(strings[i]!);
    }
  },
});
Deno.bench({
  group: "reverseString",
  name: "esrever",
  fn: () => {
    for (let i = 0; i < strings.length; i++) {
      reverse(strings[i]!);
    }
  },
});
Deno.bench({
  group: "reverseString",
  name: "esrever (no unicode)",
  fn: () => {
    for (let i = 0; i < strings.length; i++) {
      reverse(strings[i]!, { handleUnicode: false });
    }
  },
});
