// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { fromFileUrl, join, parse, toFileUrl } from "../path/mod.ts";
import { ensureFile, ensureFileSync } from "../fs/mod.ts";
import { bold, green, red } from "../fmt/colors.ts";
import { AssertionError, equal } from "./asserts.ts";
import { buildMessage, diff, diffstr } from "./_diff.ts";
import { format } from "./_format.ts";

const CAN_NOT_DISPLAY = "[Cannot display]";
const SNAPSHOT_DIR = "__snapshots__";

type AssertSnapshotContext = {
  snapshotFileUrl: URL | null;
  teardownRegistered: boolean;
  currentSnapshot: Map<string, string> | null;
  updatedSnapshot: Map<string, string>;
  snapshotCounts: Map<string, number>;
  snapshotUpdatedCount: number;
};

let _assertSnapshotContext: AssertSnapshotContext;

/**
 * Write updates to the snapshot file.
 *
 * @param context Assert snapshot context
 */
function writeSnapshotFileSync(context: AssertSnapshotContext) {
  const buf = ["export const snapshot = {};"];
  function escapeStringForJs(str: string) {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");
  }
  context.updatedSnapshot.forEach((value, key) => {
    let formattedValue = escapeStringForJs(value);
    formattedValue = formattedValue.includes("\n")
      ? `\n${formattedValue}\n`
      : formattedValue;
    const formattedKey = escapeStringForJs(key);
    buf.push(`\nsnapshot[\`${formattedKey}\`] = \`${formattedValue}\`;`);
  });
  const snapshotFilePath = fromFileUrl(context.snapshotFileUrl as URL);
  ensureFileSync(snapshotFilePath);
  Deno.writeTextFileSync(snapshotFilePath, buf.join("\n") + "\n");
}

/**
 * Register a teardown function which writes the snapshot file to disk and logs the number
 * of snapshots updated after all tests have run.
 *
 * This function can safely be called more than once and will only register the teardown
 * function once.
 *
 * @param context Assert snapshot context
 */
 function registerSnapshotTeardown(context: AssertSnapshotContext) {
  if (context.teardownRegistered) return;
  globalThis.onunload = () => {
    writeSnapshotFileSync(context);
    if (context.snapshotUpdatedCount > 0) {
      console.log(
        green(bold(`\n > ${context.snapshotUpdatedCount} snapshots updated.`)),
      );
    }
  };
  context.teardownRegistered = true;
}

/**
 * Make an assertion that `actual` matches a snapshot. If the snapshot and `actual` do
 * not a match, then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 * For example:
 * ```ts
 * import { assertSnapshot } from "./snapshot.ts";
 *
 * Deno.test("snapshot", async (test) => {
 *  await assertSnapshot<number>(test, 2);
 * });
 * ```
 */
export async function assertSnapshot(
  context: Deno.TestContext,
  actual: unknown,
  msg?: string,
): Promise<void>;
export async function assertSnapshot<T>(
  context: Deno.TestContext,
  actual: T,
  msg?: string,
): Promise<void>;
export async function assertSnapshot(
  context: Deno.TestContext,
  actual: unknown,
  msg?: string,
): Promise<void> {
  const assertSnapshotContext = getAssertSnapshotContext();
  const testName = getTestName(context);
  const count = getCount();
  const snapshotName = `${testName} ${count}`;
  const snapshotFileUrl = getSnapshotFileUrl();
  const isUpdate = Deno.args.some((arg) => arg === "--update" || arg === "-u");
  const currentSnapshot = await readSnapshotFile();

  const _actual = format(actual);
  const _expected = getExpected();
  if (isUpdate) {
    if (!equal(_actual, _expected)) {
      assertSnapshotContext.snapshotUpdatedCount++;
    }
    assertSnapshotContext.updatedSnapshot.set(snapshotName, _actual);
    registerSnapshotTeardown(assertSnapshotContext);
  } else {
    if (!_expected) {
      throw new AssertionError(`Missing snapshot: ${snapshotName}`);
    }
    if (equal(_actual, _expected)) {
      return;
    }
    let message = "";
    try {
      const stringDiff = (!_actual.includes("\n")) &&
        (!_actual.includes("\n"));
      const diffResult = stringDiff
        ? diffstr(_actual, _expected)
        : diff(_actual.split("\n"), _expected.split("\n"));
      const diffMsg = buildMessage(diffResult, { stringDiff }).join("\n");
      message = `Snapshot does not match:\n${diffMsg}`;
    } catch {
      message = `Snapshot does not match:\n${red(CAN_NOT_DISPLAY)} \n\n`;
    }
    if (msg) {
      message = msg;
    }
    throw new AssertionError(message);
  }

  function getAssertSnapshotContext() {
    if (!_assertSnapshotContext) {
      _assertSnapshotContext = {
        snapshotFileUrl: null,
        teardownRegistered: false,
        currentSnapshot: null,
        updatedSnapshot: new Map(),
        snapshotCounts: new Map(),
        snapshotUpdatedCount: 0,
      };
    }
    return _assertSnapshotContext;
  }
  function getTestName(context: Deno.TestContext): string {
    if (context.parent) {
      return `${getTestName(context.parent)} > ${context.name}`;
    }
    return context.name;
  }
  function getCount() {
    const count = assertSnapshotContext.snapshotCounts.get(testName) || 1;
    assertSnapshotContext.snapshotCounts.set(testName, count + 1);
    return count;
  }
  function getSnapshotFileUrl() {
    if (assertSnapshotContext.snapshotFileUrl) {
      return assertSnapshotContext.snapshotFileUrl;
    }
    const testFile = fromFileUrl(context.origin);
    const parts = parse(testFile);
    assertSnapshotContext.snapshotFileUrl = toFileUrl(
      `${join(parts.dir, SNAPSHOT_DIR, parts.name)}${parts.ext}.snap`,
    );
    return assertSnapshotContext.snapshotFileUrl;
  }
  function getExpected() {
    const snapshot = currentSnapshot.get(snapshotName);
    if (typeof snapshot === "undefined") {
      return;
    }
    return snapshot.includes("\n") ? snapshot.slice(1, -1) : snapshot;
  }
  async function readSnapshotFile() {
    if (assertSnapshotContext.currentSnapshot) {
      return assertSnapshotContext.currentSnapshot;
    }
    if (isUpdate) {
      await ensureFile(fromFileUrl(snapshotFileUrl));
    }
    try {
      const { snapshot } = await import(snapshotFileUrl.toString());
      assertSnapshotContext.currentSnapshot = typeof snapshot === "undefined"
        ? new Map()
        : new Map(Object.entries(snapshot));
      return assertSnapshotContext.currentSnapshot;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.startsWith("Module not found")
      ) {
        throw new AssertionError("Missing snapshot file.");
      }
      throw error;
    }
  }
}
