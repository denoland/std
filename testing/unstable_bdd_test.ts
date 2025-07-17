// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { describe, it } from "./unstable_bdd.ts";
import {
  assertMinimumDescribeOptions,
  assertMinimumItOptions,
} from "./_test_helpers.ts";

Deno.test("configureGlobalSanitizers() modifies the test sanitizers globally", async () => {
  {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "-R",
        "testing/testdata/configure_global_sanitizers/disable_sanitize_resources.ts",
      ],
    }).output();
    assertEquals(output.code, 0);
  }

  {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "-R",
        "testing/testdata/configure_global_sanitizers/disable_sanitize_ops_and_resources.ts",
      ],
    }).output();
    assertEquals(output.code, 0);
  }

  {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "-R",
        "testing/testdata/configure_global_sanitizers/disable_sanitize_exit.ts",
      ],
    }).output();
    assertEquals(output.code, 42);
  }
});

Deno.test("describe.todo()", async (t) => {
  await t.step(
    "minimum options - (signature 1)",
    async () =>
      await assertMinimumDescribeOptions((fns) => {
        const suite = describe.todo({ name: "example" });
        assert(suite && typeof suite.symbol === "symbol");
        assertEquals(it({ name: "a", fn: fns[0] }), undefined);
        assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
      }),
  );

  await t.step(
    "minimum options - (signature 2)",
    async () =>
      await assertMinimumDescribeOptions((fns) => {
        const suite = describe.todo("example", {});
        assert(suite && typeof suite.symbol === "symbol");
        assertEquals(it({ suite, name: "a", fn: fns[0] }), undefined);
        assertEquals(it({ suite, name: "b", fn: fns[1] }), undefined);
      }),
  );
});

Deno.test("it.todo()", async (t) => {
  await t.step(
    "minimum options - (signature 1)",
    async () =>
      await assertMinimumItOptions((fn) => {
        assertEquals(it.todo({ name: "example", fn }), undefined);
      }),
  );

  await t.step(
    "minimum options - (signature 2)",
    async () =>
      await assertMinimumItOptions((fn) => {
        assertEquals(it.todo("example", { fn }), undefined);
      }),
  );
});
