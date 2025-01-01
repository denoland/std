// Copyright 2018-2025 the Deno authors. MIT license.

import type { Tester } from "./_types.ts";

const customEqualityTesters: Tester[] = [];

export function addCustomEqualityTesters(newTesters: Tester[]) {
  if (!Array.isArray(newTesters)) {
    throw new TypeError(
      `customEqualityTester expects an array of Testers. But got ${typeof newTesters}`,
    );
  }

  customEqualityTesters.push(...newTesters);
}

export function getCustomEqualityTesters() {
  return customEqualityTesters;
}
