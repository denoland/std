// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { Matchers } from "./_types.ts";

let extendMatchers = {};

export function getExtendMatchers() {
  return extendMatchers;
}

// deno-lint-ignore no-explicit-any
export function setExtendMatchers(expect: any, newExtendMatchers: Matchers) {
  extendMatchers = {
    ...extendMatchers,
    ...newExtendMatchers,
  };

  for (const [name, matcher] of Object.entries(newExtendMatchers)) {
    Object.defineProperty(expect, name, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: matcher
    });

    Object.defineProperty(expect.not, name, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: matcher,
    });
  }
}
