// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { AssertionError } from "@std/assert/assertion-error";

export function emitNoAssertionError() {
  throw new AssertionError(
    "Expected at least one assertion to be called but received none.",
  );
}
