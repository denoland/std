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
import { EnvError, EnvMissingError } from "./errors.ts";

class Tracker {
  // deno-lint-ignore no-explicit-any
  calls = new Array<any>();

  // deno-lint-ignore no-explicit-any
  func(...args: any[]) {
    this.calls.push(args);
  }

  reset() {
    this.calls = [];
  }
}

Deno.test("default reporter", async (t) => {
  const exitTracker = new Tracker();

  Object.assign(globalThis.Deno, { exit: exitTracker.func.bind(exitTracker) });

  await t.step(
    "default reporter should be exported from the top-level module",
    () => {
      assertEquals(mainReporterExport, defaultReporter);
    },
  );

  await t.step("simple usage for reporting a missing variable error", () => {
    exitTracker.reset();

    const tracker = new Tracker();
    defaultReporter(
      {
        errors: { FOO: new EnvMissingError() },
        env: {},
      },
      { logger: tracker.func.bind(tracker) },
    );
    assertEquals(tracker.calls.length, 2);

    const output1 = tracker.calls[0]?.[0];
    assertMatch(output1, /Missing\S+ environment variables:/);
    assertMatch(output1, /FOO\S+/);
    assertMatch(output1, /\(required\)/);
    assertNotMatch(output1, /Invalid\S+ environment variables:/);

    const output2 = tracker.calls[1]?.[0];
    assertMatch(output2, /Exiting with error code 1/);

    assertEquals(exitTracker.calls.length, 1);
    assertEquals(exitTracker.calls[0]?.[0], 1);
  });

  await t.step("simple usage for reporting an invalid variable error", () => {
    exitTracker.reset();

    const tracker = new Tracker();
    defaultReporter(
      {
        errors: { FOO: new EnvError() },
        env: { FOO: 123 },
      },
      { logger: tracker.func.bind(tracker) },
    );
    assertEquals(tracker.calls.length, 2);

    const output1 = tracker.calls[0]?.[0];
    assertMatch(output1, /Invalid\S+ environment variables:/);
    assertMatch(output1, /FOO\S+/);
    assertMatch(output1, /\(invalid format\)/);
    assertNotMatch(output1, /Missing\S+ environment variables:/);

    const output2 = tracker.calls[1]?.[0];
    assertMatch(output2, /Exiting with error code 1/);

    assertEquals(exitTracker.calls.length, 1);
    assertEquals(exitTracker.calls[0]?.[0], 1);
  });

  await t.step(
    "reporting an invalid variable error with a custom error message",
    () => {
      exitTracker.reset();

      const tracker = new Tracker();
      defaultReporter(
        {
          errors: { FOO: new EnvError("custom msg") },
          env: { FOO: 123 },
        },
        { logger: tracker.func.bind(tracker) },
      );
      assertEquals(tracker.calls.length, 2);

      const output1 = tracker.calls[0]?.[0];
      assertMatch(output1, /Invalid\S+ environment variables:/);
      assertMatch(output1, /FOO\S+/);
      assertMatch(output1, /custom msg/);

      const output2 = tracker.calls[1]?.[0];
      assertMatch(output2, /Exiting with error code 1/);

      assertEquals(exitTracker.calls.length, 1);
      assertEquals(exitTracker.calls[0]?.[0], 1);
    },
  );

  await t.step("does nothing when there are no errors", () => {
    exitTracker.reset();

    const tracker = new Tracker();
    defaultReporter(
      {
        errors: {},
        env: { FOO: "great success" },
      },
      { logger: tracker.func.bind(this) },
    );

    assertEquals(tracker.calls.length, 0);
    assertEquals(exitTracker.calls.length, 0);
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
    const tracker = new Tracker();
    assertEquals(tracker.calls.length, 0);
    envalidErrorFormatter(
      { FOO: new EnvMissingError() },
      tracker.func.bind(tracker),
    );
    assertEquals(tracker.calls.length, 1);

    const output = tracker.calls[0]?.[0];
    assertMatch(output, /Missing\S+ environment variables:/);
    assertMatch(output, /FOO\S+/);
    assertMatch(output, /\(required\)/);
  });
});
