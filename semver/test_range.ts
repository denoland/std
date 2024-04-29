// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Range, SemVer } from "./types.ts";
import { satisfies } from "./satisfies.ts";

/**
 * Test to see if the version satisfies the range.
 * @param version The version to test
 * @param range The range to check
 * @returns true if the version is in the range
 *
 * @deprecated This will be removed in 1.0.0. Use {@linkcode satisfies}
 * instead. See https://github.com/denoland/deno_std/pull/4364.
 */
export function testRange(version: SemVer, range: Range): boolean {
  return satisfies(version, range);
}
