// Copyright 2018-2025 the Deno authors. MIT license.

import { describe, it } from "@std/testing/bdd";
import { configureGlobalSanitizers } from "@std/testing/unstable-bdd";

configureGlobalSanitizers({
  sanitizeExit: false,
});

describe("does not sanitize exit", () => {
  it("does not sanitize exit", () => {
    Deno.exit(42);
  });
});
