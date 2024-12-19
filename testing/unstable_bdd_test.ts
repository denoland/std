// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";

Deno.test("configureGlobalSanitizers() modifies the test sanitizers globally", async () => {
  {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "-R",
        "testing/testdata/configure_global_sanitizers/disable_sanitize_resources_test.ts",
      ],
    }).output();
    assertEquals(output.code, 0);
  }

  {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "-R",
        "testing/testdata/configure_global_sanitizers/disable_sanitize_ops_and_resources_test.ts",
      ],
    }).output();
    assertEquals(output.code, 0);
  }

  {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "-R",
        "testing/testdata/configure_global_sanitizers/disable_sanitize_exit_test.ts",
      ],
    }).output();
    assertEquals(output.code, 42);
  }
});
