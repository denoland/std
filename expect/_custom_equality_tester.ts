// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { Tester } from './_types.ts';

const customEqualityTesters: Array<Tester> = [];

export function addCustomEqualityTester(newTesters: Array<Tester>) {
  if (!Array.isArray(newTesters)) {
    throw new TypeError(
      `customEqualityTester expects an array of Testers. But got ${typeof newTesters}`
    );
  }

  customEqualityTesters.push(...newTesters);
}

export function getCustomEqualityTester() {
  return customEqualityTesters
}
