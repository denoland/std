// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";
import { SnapshotContext } from "./_snapshot_state.ts";

function withTestName(name: string, fn: () => void) {
  expect.setState({
    currentTestName: name,
    testPath: import.meta.url,
  });
  try {
    fn();
  } finally {
    // Reset state and snapshot context caches between tests
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
  }
}

Deno.test("expect().toMatchSnapshot() throws without currentTestName", () => {
  expect.setState({ currentTestName: undefined, testPath: import.meta.url });
  assertThrows(
    () => {
      expect("foo").toMatchSnapshot();
    },
    Error,
    "Unable to determine test name",
  );
  expect.setState({ currentTestName: undefined, testPath: undefined });
});

Deno.test("expect().not.toMatchSnapshot() throws", () => {
  withTestName("not snapshot", () => {
    assertThrows(
      () => {
        expect("foo").not.toMatchSnapshot();
      },
      AssertionError,
      "Snapshot matchers do not support `.not`",
    );
  });
});

Deno.test("expect().toMatchSnapshot() throws on missing snapshot in assert mode", () => {
  withTestName("missing snapshot test", () => {
    assertThrows(
      () => {
        expect("foo").toMatchSnapshot();
      },
      AssertionError,
      "Missing snapshot",
    );
  });
});

Deno.test("expect().toMatchSnapshot() with hint throws on missing snapshot", () => {
  withTestName("hint test", () => {
    assertThrows(
      () => {
        expect("bar").toMatchSnapshot("my hint");
      },
      AssertionError,
      "Missing snapshot: hint test: my hint 1",
    );
  });
});

Deno.test("expect().toMatchSnapshot() with property matchers rejects non-object values", () => {
  withTestName("property matcher test", () => {
    assertThrows(
      () => {
        expect("string value").toMatchSnapshot({ id: expect.any(Number) });
      },
      AssertionError,
      "Property matchers can only be used with object values in toMatchSnapshot",
    );
  });
});

Deno.test("expect().toMatchSnapshot() with property matchers rejects non-matching values", () => {
  withTestName("property matcher mismatch", () => {
    assertThrows(
      () => {
        expect({ id: "not a number" }).toMatchSnapshot({
          id: expect.any(Number),
        });
      },
      AssertionError,
      "Property matchers did not match",
    );
  });
});

Deno.test("expect().toMatchSnapshot() detects snapshot mismatch", () => {
  // Create a temporary test setup with a pre-existing snapshot
  const dir = Deno.makeTempDirSync();
  const testFile = `${dir}/test.ts`;
  const snapshotDir = `${dir}/__snapshots__`;
  const snapshotFile = `${snapshotDir}/test.ts.snap`;

  Deno.mkdirSync(snapshotDir);
  Deno.writeTextFileSync(
    snapshotFile,
    `export const snapshot = {};\n\nsnapshot[\`mismatch test 1\`] = \`"old value"\`;\n`,
  );

  expect.setState({
    currentTestName: "mismatch test",
    testPath: testFile,
  });

  try {
    assertThrows(
      () => {
        expect("new value").toMatchSnapshot();
      },
      AssertionError,
      "Snapshot does not match",
    );
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("expect().toMatchSnapshot() matches existing snapshot", () => {
  const dir = Deno.makeTempDirSync();
  const testFile = `${dir}/test.ts`;
  const snapshotDir = `${dir}/__snapshots__`;
  const snapshotFile = `${snapshotDir}/test.ts.snap`;

  Deno.mkdirSync(snapshotDir);
  Deno.writeTextFileSync(
    snapshotFile,
    `export const snapshot = {};\n\nsnapshot[\`match test 1\`] = \`"hello"\`;\n`,
  );

  expect.setState({
    currentTestName: "match test",
    testPath: testFile,
  });

  try {
    // Should not throw - the snapshot matches
    expect("hello").toMatchSnapshot();
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("expect().toMatchSnapshot() matches multi-line snapshot", () => {
  const dir = Deno.makeTempDirSync();
  const testFile = `${dir}/test.ts`;
  const snapshotDir = `${dir}/__snapshots__`;
  const snapshotFile = `${snapshotDir}/test.ts.snap`;

  Deno.mkdirSync(snapshotDir);
  Deno.writeTextFileSync(
    snapshotFile,
    `export const snapshot = {};\n\nsnapshot[\`object test 1\`] = \`\n{\n  bar: 2,\n  foo: 1,\n}\n\`;\n`,
  );

  expect.setState({
    currentTestName: "object test",
    testPath: testFile,
  });

  try {
    expect({ foo: 1, bar: 2 }).toMatchSnapshot();
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("expect().toMatchSnapshot() multiple snapshots per test use counter", () => {
  const dir = Deno.makeTempDirSync();
  const testFile = `${dir}/test.ts`;
  const snapshotDir = `${dir}/__snapshots__`;
  const snapshotFile = `${snapshotDir}/test.ts.snap`;

  Deno.mkdirSync(snapshotDir);
  Deno.writeTextFileSync(
    snapshotFile,
    [
      `export const snapshot = {};`,
      ``,
      `snapshot[\`multi test 1\`] = \`"first"\`;`,
      ``,
      `snapshot[\`multi test 2\`] = \`"second"\`;`,
      ``,
      `snapshot[\`multi test 3\`] = \`"third"\`;`,
      ``,
    ].join("\n"),
  );

  expect.setState({
    currentTestName: "multi test",
    testPath: testFile,
  });

  try {
    expect("first").toMatchSnapshot();
    expect("second").toMatchSnapshot();
    expect("third").toMatchSnapshot();
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("expect().toMatchSnapshot() with hint in snapshot key", () => {
  const dir = Deno.makeTempDirSync();
  const testFile = `${dir}/test.ts`;
  const snapshotDir = `${dir}/__snapshots__`;
  const snapshotFile = `${snapshotDir}/test.ts.snap`;

  Deno.mkdirSync(snapshotDir);
  Deno.writeTextFileSync(
    snapshotFile,
    `export const snapshot = {};\n\nsnapshot[\`hint test: my hint 1\`] = \`"hinted"\`;\n`,
  );

  expect.setState({
    currentTestName: "hint test",
    testPath: testFile,
  });

  try {
    expect("hinted").toMatchSnapshot("my hint");
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("expect.setState() and expect.getState() work correctly", () => {
  expect.setState({ currentTestName: "test 1" });
  const state1 = expect.getState();
  expect(state1.currentTestName).toBe("test 1");
  expect(state1.testPath).toBeUndefined();

  expect.setState({ testPath: "/path/to/test.ts" });
  const state2 = expect.getState();
  expect(state2.currentTestName).toBe("test 1");
  expect(state2.testPath).toBe("/path/to/test.ts");

  // Clean up
  expect.setState({ currentTestName: undefined, testPath: undefined });
});
