// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { serialize, SnapshotContext } from "./_snapshot_state.ts";
import { assertEquals } from "@std/assert";

Deno.test("toMatchSnapshot() update mode creates and reads snapshot files", () => {
  const dir = Deno.makeTempDirSync();
  const testFile = `${dir}/test.ts`;
  const snapshotDir = `${dir}/__snapshots__`;
  const snapshotFile = `${snapshotDir}/test.ts.snap`;

  try {
    // --- Phase 1: Create snapshots in update mode ---
    // We simulate update mode by directly using the SnapshotContext
    const ctx = SnapshotContext.fromTestFile(testFile);

    // Simulate what toMatchSnapshot does in update mode
    const testName = "update mode test";
    const count1 = ctx.getCount(testName);
    assertEquals(count1, 1);
    const key1 = `${testName} ${count1}`;
    ctx.pushToUpdateQueue(key1);
    ctx.updateSnapshot(key1, serialize("hello world"));

    const count2 = ctx.getCount(testName);
    assertEquals(count2, 2);
    const key2 = `${testName} ${count2}`;
    ctx.pushToUpdateQueue(key2);
    ctx.updateSnapshot(key2, serialize({ foo: 1, bar: 2 }));

    // Manually trigger teardown to write the file
    ctx.registerTeardown();
    globalThis.dispatchEvent(new Event("unload"));

    // Verify the snapshot file was created
    const content = Deno.readTextFileSync(snapshotFile);

    // Check that the file contains both snapshots
    assertEquals(
      content.includes("snapshot[`update mode test 1`]"),
      true,
      "Should contain first snapshot key",
    );
    assertEquals(
      content.includes("snapshot[`update mode test 2`]"),
      true,
      "Should contain second snapshot key",
    );

    // --- Phase 2: Read back in assert mode ---
    // Clear the context cache so it re-reads the file
    SnapshotContext.contexts.clear();

    expect.setState({
      currentTestName: "update mode test",
      testPath: testFile,
    });

    // These should match the snapshots we just created
    expect("hello world").toMatchSnapshot();
    expect({ foo: 1, bar: 2 }).toMatchSnapshot();
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("toMatchSnapshot() round-trips special characters through serialize/write/read", () => {
  const dir = Deno.makeTempDirSync();
  const testFile = `${dir}/test.ts`;

  try {
    // Phase 1: Write snapshots for values with special characters
    const ctx = SnapshotContext.fromTestFile(testFile);
    const values = [
      "hello\\world",
      "back`tick",
      "dollar$sign",
      "line1\nline2",
      { key: "value with `backticks` and $dollars" },
    ];

    for (let i = 0; i < values.length; i++) {
      const count = ctx.getCount("special");
      const key = `special ${count}`;
      ctx.pushToUpdateQueue(key);
      ctx.updateSnapshot(key, serialize(values[i]));
    }

    ctx.registerTeardown();
    globalThis.dispatchEvent(new Event("unload"));

    // Phase 2: Read back and verify
    SnapshotContext.contexts.clear();

    expect.setState({
      currentTestName: "special",
      testPath: testFile,
    });

    for (const value of values) {
      expect(value).toMatchSnapshot();
    }
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("toMatchSnapshot() with arrays", () => {
  const dir = Deno.makeTempDirSync();
  const testFile = `${dir}/test.ts`;

  try {
    // Write
    const ctx = SnapshotContext.fromTestFile(testFile);
    const key = "array test 1";
    ctx.pushToUpdateQueue(key);
    ctx.updateSnapshot(key, serialize([1, 2, 3]));
    ctx.registerTeardown();
    globalThis.dispatchEvent(new Event("unload"));

    // Read back
    SnapshotContext.contexts.clear();
    expect.setState({ currentTestName: "array test", testPath: testFile });
    expect([1, 2, 3]).toMatchSnapshot();
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("toMatchSnapshot() with nested objects", () => {
  const dir = Deno.makeTempDirSync();
  const testFile = `${dir}/test.ts`;

  try {
    const value = {
      name: "Alice",
      profile: {
        age: 30,
        preferences: { theme: "dark" },
      },
      tags: ["developer", "javascript"],
    };

    // Write
    const ctx = SnapshotContext.fromTestFile(testFile);
    const key = "nested test 1";
    ctx.pushToUpdateQueue(key);
    ctx.updateSnapshot(key, serialize(value));
    ctx.registerTeardown();
    globalThis.dispatchEvent(new Event("unload"));

    // Read back
    SnapshotContext.contexts.clear();
    expect.setState({ currentTestName: "nested test", testPath: testFile });
    expect(value).toMatchSnapshot();
  } finally {
    expect.setState({ currentTestName: undefined, testPath: undefined });
    SnapshotContext.contexts.clear();
    Deno.removeSync(dir, { recursive: true });
  }
});
