// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Ways that lines in a diff can be different. */
export type DiffType = DiffResult<unknown>["type"];

/**
 * Represents the result of a diff operation.
 * @typeParam T The type of the value in the diff result.
 */
export type DiffResult<T> = ChangedDiffResult<T> | CommonDiffResult<T>;

/**
 * Represents the result of a common diff operation.
 * @typeParam T The type of the value in the diff result.
 */
export type CommonDiffResult<T> = {
  type: "common" | "truncation";
  value: T;
};

/**
 * Represents the result of a changed diff operation.
 * @typeParam T The type of the value in the diff result.
 */
export type ChangedDiffResult<T> = {
  type: "removed" | "added";
  value: T;
  details?: DiffResult<T>[];
};
