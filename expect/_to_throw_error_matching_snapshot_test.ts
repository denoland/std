// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import {
  assertEquals,
  AssertionError,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { SnapshotContext } from "./_snapshot_state.ts";

/**
 * Runs `fn` against a temporary test file whose snapshot file contains
 * `snapshots` (a map of snapshot key to serialized value).
 */
async function withSnapshotFile(
  testName: string,
  snapshots: Record<string, string>,
  fn: () => void | Promise<void>,
) {
  const dir = await Deno.makeTempDir();
  const testFile = `${dir}/test.ts`;
  const snapshotDir = `${dir}/__snapshots__`;
  await Deno.mkdir(snapshotDir);
  await Deno.writeTextFile(
    `${snapshotDir}/test.ts.snap`,
    [
      "export const snapshot = {};",
      "",
      ...Object.entries(snapshots).map(([key, value]) =>
        `snapshot[\`${key}\`] = \`${value}\`;\n`
      ),
    ].join("\n"),
  );

  expect.setState({ currentTestName: testName, testPath: testFile });
  try {
    await fn();
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("expect().toThrowErrorMatchingSnapshot() matches the thrown error message", async () => {
  await withSnapshotFile(
    "throw match",
    { "throw match 1": `"boom"` },
    () => {
      expect(() => {
        throw new Error("boom");
      }).toThrowErrorMatchingSnapshot();
    },
  );
});

Deno.test("expect().toThrowErrorMatchingSnapshot() detects a different error message", async () => {
  await withSnapshotFile(
    "throw mismatch",
    { "throw mismatch 1": `"boom"` },
    () => {
      assertThrows(
        () => {
          expect(() => {
            throw new TypeError("bang");
          }).toThrowErrorMatchingSnapshot();
        },
        AssertionError,
        "Snapshot does not match",
      );
    },
  );
});

Deno.test("expect().toThrowErrorMatchingSnapshot() uses the hint in the snapshot key", async () => {
  await withSnapshotFile(
    "throw hint",
    { "throw hint: my hint 1": `"boom"` },
    () => {
      expect(() => {
        throw new Error("boom");
      }).toThrowErrorMatchingSnapshot("my hint");
    },
  );
});

Deno.test("expect().toThrowErrorMatchingSnapshot() shares the snapshot counter with toMatchSnapshot()", async () => {
  await withSnapshotFile(
    "throw counter",
    { "throw counter 1": `"value"`, "throw counter 2": `"boom"` },
    () => {
      expect("value").toMatchSnapshot();
      expect(() => {
        throw new Error("boom");
      }).toThrowErrorMatchingSnapshot();
    },
  );
});

Deno.test("expect().toThrowErrorMatchingSnapshot() throws on missing snapshot in assert mode", async () => {
  await withSnapshotFile("throw missing", {}, () => {
    assertThrows(
      () => {
        expect(() => {
          throw new Error("boom");
        }).toThrowErrorMatchingSnapshot();
      },
      AssertionError,
      "Missing snapshot: throw missing 1",
    );
  });
});

Deno.test("expect().toThrowErrorMatchingSnapshot() throws when the function does not throw", async () => {
  await withSnapshotFile(
    "no throw",
    { "no throw 1": `"boom"` },
    () => {
      assertThrows(
        () => {
          expect(() => {}).toThrowErrorMatchingSnapshot();
        },
        AssertionError,
        "Received function did not throw",
      );
    },
  );
});

Deno.test("expect().toThrowErrorMatchingSnapshot() works with rejects", async () => {
  await withSnapshotFile(
    "rejects match",
    { "rejects match 1": `"async boom"`, "rejects match 2": `"async boom"` },
    async () => {
      await expect(Promise.reject(new Error("async boom"))).rejects
        .toThrowErrorMatchingSnapshot();
      await assertRejects(
        () =>
          expect(Promise.reject(new Error("other"))).rejects
            .toThrowErrorMatchingSnapshot(),
        AssertionError,
        "Snapshot does not match",
      );
    },
  );
});

Deno.test("expect().not.toThrowErrorMatchingSnapshot() throws", async () => {
  await withSnapshotFile("throw not", {}, () => {
    assertThrows(
      () => {
        expect(() => {
          throw new Error("boom");
        }).not.toThrowErrorMatchingSnapshot();
      },
      AssertionError,
      "Snapshot matchers do not support `.not`",
    );
  });
});

Deno.test("expect().toThrowErrorMatchingSnapshot() throws without currentTestName", () => {
  expect.setState({ currentTestName: undefined, testPath: import.meta.url });
  try {
    const error = assertThrows(
      () => {
        expect(() => {
          throw new Error("boom");
        }).toThrowErrorMatchingSnapshot();
      },
      Error,
      "Unable to determine test name",
    );
    assertEquals(
      error.message.startsWith("toThrowErrorMatchingSnapshot:"),
      true,
    );
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
  }
});
