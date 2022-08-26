// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import {
  assertEquals,
  assertMatch,
  assertNotMatch,
} from "../testing/asserts.ts";
import {
  defaultReporter as mainReporterExport,
  envalidErrorFormatter as mainEnvalidErrorFormatter,
} from "./mod.ts";
import { defaultReporter, envalidErrorFormatter } from "./reporter.ts";
import { EnvMissingError } from "./errors.ts";

Deno.test("default reporter", async (t) => {
  await t.step(
    "default reporter should be exported from the top-level module",
    () => {
      assertEquals(mainReporterExport, defaultReporter);
    },
  );

  await t.step(
    "simple usage for reporting a missing variable error",
    async () => {
      const { code, stderr } = await Deno.spawn(Deno.execPath(), {
        args: [
          "eval",
          `
          import { defaultReporter } from "./envalid/reporter.ts";
          import { EnvMissingError } from "./envalid/errors.ts";
          defaultReporter(
            {
              errors: { FOO: new EnvMissingError() },
              env: {},
            },
          );
        `,
        ],
      });

      const output = new TextDecoder().decode(stderr);

      assertMatch(output, /Missing\S+ environment variables:/);
      assertMatch(output, /FOO\S+/);
      assertMatch(output, /\(required\)/);
      assertNotMatch(output, /Invalid\S+ environment variables:/);
      assertMatch(output, /Exiting with error code 1/);
      assertEquals(code, 1);
    },
  );

  await t.step(
    "simple usage for reporting an invalid variable error",
    async () => {
      const { code, stderr } = await Deno.spawn(Deno.execPath(), {
        args: [
          "eval",
          `
            import { defaultReporter } from "./envalid/reporter.ts";
            import { EnvError } from "./envalid/errors.ts";
            defaultReporter(
              {
                errors: { FOO: new EnvError() },
                env: { FOO: 123 },
              },
            );
          `,
        ],
      });

      const output = new TextDecoder().decode(stderr);

      assertMatch(output, /Invalid\S+ environment variables:/);
      assertMatch(output, /FOO\S+/);
      assertMatch(output, /\(invalid format\)/);
      assertNotMatch(output, /Missing\S+ environment variables:/);
      assertMatch(output, /Exiting with error code 1/);
      assertEquals(code, 1);
    },
  );

  await t.step(
    "reporting an invalid variable error with a custom error message",
    async () => {
      const { code, stderr } = await Deno.spawn(Deno.execPath(), {
        args: [
          "eval",
          `
            import { defaultReporter } from "./envalid/reporter.ts";
            import { EnvError } from "./envalid/errors.ts";
            defaultReporter(
              {
                errors: { FOO: new EnvError("custom msg") },
                env: { FOO: 123 },
              },
            );
          `,
        ],
      });

      const output = new TextDecoder().decode(stderr);

      assertMatch(output, /Invalid\S+ environment variables:/);
      assertMatch(output, /FOO\S+/);
      assertMatch(output, /custom msg/);
      assertMatch(output, /Exiting with error code 1/);
      assertEquals(code, 1);
    },
  );

  await t.step("does nothing when there are no errors", async () => {
    const { code, stderr } = await Deno.spawn(Deno.execPath(), {
      args: [
        "eval",
        `
          import { defaultReporter } from "./envalid/reporter.ts";
          defaultReporter(
            {
              errors: {},
              env: { FOO: "great success" },
            },
          );
        `,
      ],
    });

    const output = new TextDecoder().decode(stderr);

    assertEquals(output, "");
    assertEquals(code, 0);
  });
});

Deno.test("envalidErrorFormatter", async (t) => {
  await t.step(
    "default formatter should be exported from the top-level module",
    () => {
      assertEquals(mainEnvalidErrorFormatter, envalidErrorFormatter);
    },
  );

  await t.step("simple usage for formatting a single error", () => {
    const messages = new Array<string>();
    envalidErrorFormatter(
      { FOO: new EnvMissingError() },
      (msg:string)=>messages.push(msg)
    );

    const output = messages[0];

    assertEquals(messages.length, 1);
    assertMatch(output, /Missing\S+ environment variables:/);
    assertMatch(output, /FOO\S+/);
    assertMatch(output, /\(required\)/);
  });
});
