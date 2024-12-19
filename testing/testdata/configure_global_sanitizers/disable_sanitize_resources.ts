// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { describe, it } from "@std/testing/bdd";
import { configureGlobalSanitizers } from "@std/testing/unstable-bdd";

configureGlobalSanitizers({ sanitizeResources: false });

it("leaks resources", async () => {
  const _file = await Deno.open("README.md");
});

describe("leaking ops and resource", () => {
  it("leaks resources", async () => {
    const _file = await Deno.open("README.md");
  });
});
