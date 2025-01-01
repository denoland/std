// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

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
