// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Matchers } from "./_types.ts";

let extendMatchers = {};

export function getExtendMatchers() {
  return extendMatchers;
}

export function setExtendMatchers(newExtendMatchers: Matchers) {
  extendMatchers = {
    ...extendMatchers,
    ...newExtendMatchers,
  };
}
