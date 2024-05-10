// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
export type DiffType = "removed" | "common" | "added";

export interface DiffResult<T> {
  type: DiffType;
  value: T;
  details?: Array<DiffResult<T>>;
}
