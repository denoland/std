// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { assertPath } from "./assert_path.ts";

export function assertArgs(from: string, to: string) {
  assertPath(from);
  assertPath(to);
  if (from === to) return "";
}
