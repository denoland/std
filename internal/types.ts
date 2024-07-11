// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/** Ways that lines in a diff can be different. */
export type DiffType = "removed" | "common" | "added";

/**
 * Represents the result of a diff operation.
 *
 * @typeParam T The type of the value in the diff result.
 */
export interface DiffResult<T> {
  /** The type of the diff. */
  type: DiffType;
  /** The value of the diff. */
  value: T;
  /** The details of the diff. */
  details?: DiffResult<T>[];
}
