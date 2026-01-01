// Copyright 2018-2026 the Deno authors. MIT license.

import { describe, it } from "@std/testing/bdd";
import { configureGlobalSanitizers } from "@std/testing/unstable-bdd";

configureGlobalSanitizers({
  sanitizeOps: false,
  sanitizeResources: false,
});

it("leaks ops", () => {
  setTimeout(() => {}, 1000);
});

describe("leaks ops", () => {
  it("leaks ops", () => {
    setTimeout(() => {}, 1000);
  });
});
