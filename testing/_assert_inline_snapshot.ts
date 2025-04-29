// Copyright 2018-2025 the Deno authors. MIT license.
// @ts-nocheck Deno.lint namespace does not pass type checking in Deno 1.x

import type { SnapshotOptions } from "./snapshot.ts";
import { fromFileUrl } from "@std/path/from-file-url";
import { parse } from "@std/path/parse";
import { resolve } from "@std/path/resolve";
import { toFileUrl } from "@std/path/to-file-url";
import { ensureFileSync } from "@std/fs/ensure-file";
import { AssertionError } from "@std/assert/assertion-error";
import { equal } from "@std/assert/equal";
import {
  escapeStringForJs,
  getIsUpdate,
  getOptions,
  getSnapshotNotMatchMessage,
  serialize,
} from "./_snapshot_utils.ts";

/** The options for {@linkcode assertInlineSnapshot}. */

export interface InlineSnapshotOptions<T = unknown>
  extends Pick<SnapshotOptions<T>, "mode" | "msg" | "serializer"> {
  /**
   * Whether to format the test file after updating.
   *
   * The default is `true`. If multiple snapshots will be created in one test file
   * and the tests have incompatible `format` options, the snapshots will be written,
   * the file will not be formatted, and we will throw.
   */
  format?: boolean;
}

interface ErrorLocation {
  lineNumber: number;
  columnNumber: number;
}

interface SnapshotUpdateRequest {
  lineNumber: number;
  columnNumber: number;
  actualSnapshot: string;
}

// See https://v8.dev/docs/stack-trace-api
type V8Error = typeof Error & {
  prepareStackTrace(error: Error, structuredStackTrace: CallSite[]): unknown;
};

// See https://v8.dev/docs/stack-trace-api
interface CallSite {
  isEval(): boolean;
  getLineNumber(): number | null;
  getColumnNumber(): number | null;
}

function makeSnapshotUpdater(
  lineColumnToSnapshot: Record<string, string>,
): Deno.lint.Plugin {
  return {
    name: "snapshot-updater-plugin",
    rules: {
      "update-snapshot": {
        create(context) {
          const src = context.sourceCode.text;
          const lineBreaks = [...src.matchAll(/\n|\r\n?/g)].map((m) => m.index);
          const locationToSnapshot: Record<number, string> = {};
          for (
            const [lineColumn, snapshot] of Object.entries(lineColumnToSnapshot)
          ) {
            const [lineNumber, columnNumber] = lineColumn.split(":")
              .map(Number);
            const location = (lineBreaks[lineNumber! - 2] ?? 0) + columnNumber!;
            locationToSnapshot[location] = snapshot;
          }

          return {
            // Fetching all functions lets us support createAssertInlineSnapshot
            "CallExpression"(node: Deno.lint.CallExpression) {
              const snapshot = locationToSnapshot[node.range[0]];
              const argument = node.arguments[2];
              if (snapshot === undefined || argument === undefined) return;

              context.report({
                node,
                message: "",
                fix(fixer) {
                  return fixer.replaceText(argument, snapshot);
                },
              });
            },
          };
        },
      },
    },
  };
}

class AssertInlineSnapshotContext {
  static contexts = new Map<string, AssertInlineSnapshotContext>();

  /**
   * Returns an instance of `AssertInlineSnapshotContext`. This will be retrieved from
   * a cache if an instance was already created for a given test file path.
   */
  static fromContext(
    testContext: Deno.TestContext,
  ): AssertInlineSnapshotContext {
    const testFilePath = fromFileUrl(testContext.origin);
    const { dir, base } = parse(testFilePath);
    const path = resolve(dir, base);

    let context = this.contexts.get(path);
    if (context) {
      return context;
    }

    context = new this(toFileUrl(path));
    this.contexts.set(path, context);
    return context;
  }

  #teardownRegistered = false;
  #lineColumnToSnapshot: Record<string, string> = {};
  #testFileUrl: URL;
  #format: boolean | undefined | "error" = undefined;

  constructor(testFileUrl: URL) {
    this.#testFileUrl = testFileUrl;
  }

  /**
   * Write updates to the snapshot file and log statistics.
   */
  #teardown = () => {
    const snapshotsUpdated = Object.keys(this.#lineColumnToSnapshot).length;
    if (snapshotsUpdated === 0) return;

    const testFilePath = fromFileUrl(this.#testFileUrl);
    ensureFileSync(testFilePath);
    const file = Deno.readTextFileSync(testFilePath);
    const pluginRunResults = Deno.lint.runPlugin(
      makeSnapshotUpdater(this.#lineColumnToSnapshot),
      "dummy.ts",
      file,
    );

    const fixes = pluginRunResults.flatMap((v) => v.fix ?? []);
    if (fixes.length !== snapshotsUpdated) {
      throw new Error(
        `assertInlineSnapshot expected to update ${snapshotsUpdated} ${
          snapshotsUpdated === 1 ? "snapshot" : "snapshots"
        } but generated ${fixes.length}.`,
      );
    }

    // Apply the fixes in order
    fixes.sort((a, b) => a.range[0] - b.range[0]);
    let output = "";
    let lastIndex = 0;
    for (const fix of fixes) {
      output += file.slice(lastIndex, fix.range[0]);
      output += "`" + escapeStringForJs(fix.text ?? "") + "`";
      lastIndex = fix.range[1];
    }
    output += file.slice(lastIndex);

    Deno.writeTextFileSync(testFilePath, output);

    if (this.#format === undefined || this.#format === true) {
      const command = new Deno.Command(Deno.execPath(), {
        args: ["fmt", testFilePath],
      });
      const { stderr, success } = command.outputSync();
      if (!success) {
        throw new Error(
          `assertInlineSnapshot errored while formatting ${testFilePath}:\n${
            new TextDecoder().decode(stderr)
          }`,
        );
      }
    } else if (this.#format === "error") {
      throw new Error(
        "Found incompatible format options in assertInlineSnapshot, did not format file",
      );
    }

    // deno-lint-ignore no-console
    console.log(
      `%c\n > ${snapshotsUpdated} ${
        snapshotsUpdated === 1 ? "snapshot" : "snapshots"
      } updated.`,
      "color: green; font-weight: bold;",
    );
  };

  /**
   * Register a teardown function which writes the snapshot file to disk and logs the number
   * of snapshots updated after all tests have run.
   *
   * This method can safely be called more than once and will only register the teardown
   * function once in a context.
   */
  registerTeardown() {
    if (!this.#teardownRegistered) {
      globalThis.addEventListener("unload", this.#teardown);
      this.#teardownRegistered = true;
    }
  }

  /**
   * Creates a snapshot by index. Updates will be written to the test file when all
   * tests have run.
   */
  createSnapshot(request: SnapshotUpdateRequest, format: boolean | undefined) {
    this
      .#lineColumnToSnapshot[`${request.lineNumber}:${request.columnNumber}`] =
        request.actualSnapshot;

    if (format === undefined) format = true;

    if (this.#format === undefined) {
      this.#format = format;
    } else if (this.#format !== format) {
      this.#format = "error";
    }
  }
}

/**
 * Make an assertion that `actual` matches `expectedSnapshot`. If they do not match,
 * then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 *
 * @example Usage
 * ```ts
 * import { assertInlineSnapshot } from "@std/testing/snapshot";
 *
 * Deno.test("snapshot", async (t) => {
 *   await assertInlineSnapshot<number>(t, 2, `2`);
 * });
 * ```
 * @typeParam T The type of the snapshot
 * @param context The test context
 * @param actual The actual value to compare
 * @param expectedSnapshot The expected snapshot, or \`CREATE\` to create
 * @param options The options
 */
export function assertInlineSnapshot<T>(
  context: Deno.TestContext,
  actual: T,
  expectedSnapshot: string,
  options?: InlineSnapshotOptions<T>,
): void;
/**
 * Make an assertion that `actual` matches `expectedSnapshot`. If they do not match,
 * then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 *
 * @example Usage
 * ```ts
 * import { assertInlineSnapshot } from "@std/testing/snapshot";
 *
 * Deno.test("snapshot", async (t) => {
 *   await assertInlineSnapshot<number>(t, 2, `2`);
 * });
 * ```
 * @typeParam T The type of the snapshot
 * @param context The test context
 * @param actual The actual value to compare
 * @param expectedSnapshot The expected snapshot, or \`CREATE\` to create
 * @param message The optional assertion message
 */
export function assertInlineSnapshot<T>(
  context: Deno.TestContext,
  actual: T,
  expectedSnapshot: string,
  message?: string,
): void;
export function assertInlineSnapshot(
  context: Deno.TestContext,
  actual: unknown,
  expectedSnapshot: string,
  msgOrOpts?: string | InlineSnapshotOptions<unknown>,
): void {
  const options = getOptions(msgOrOpts);
  const assertInlineSnapshotContext = AssertInlineSnapshotContext.fromContext(
    context,
  );
  const serializer = options.serializer ?? serialize;
  const actualSnapshot = serializer(actual);
  // TODO(WWRS): dedent expectedSnapshot to allow snapshots to look nicer

  if (equal(actualSnapshot, expectedSnapshot)) {
    return;
  }

  if (getIsUpdate(options)) {
    assertInlineSnapshotContext.registerTeardown();

    const origPrepareStackTrace = (Error as V8Error).prepareStackTrace;
    try {
      const stackCatcher = { stack: null as SnapshotUpdateRequest | null };
      (Error as V8Error).prepareStackTrace = (
        _err: Error,
        stack: CallSite[],
      ): SnapshotUpdateRequest | null => {
        const callerStackFrame = stack[0];
        if (!callerStackFrame || callerStackFrame.isEval()) return null;

        const lineNumber = callerStackFrame.getLineNumber();
        const columnNumber = callerStackFrame.getColumnNumber();
        if (lineNumber === null || columnNumber === null) return null;

        return {
          lineNumber,
          columnNumber,
          actualSnapshot,
        };
      };
      // Capture the stack that comes after this function.
      Error.captureStackTrace(stackCatcher, assertInlineSnapshot);
      // Forcibly access the stack, and note it down
      const request = stackCatcher.stack;
      if (request !== null) {
        assertInlineSnapshotContext.createSnapshot(
          request,
          options.format,
        );
      }
    } finally {
      (Error as V8Error).prepareStackTrace = origPrepareStackTrace;
    }
  } else {
    throw new AssertionError(
      getSnapshotNotMatchMessage(actualSnapshot, expectedSnapshot, options),
    );
  }
}

/**
 * Create {@linkcode assertInlineSnapshot} function with the given options.
 *
 * The specified option becomes the default for returned {@linkcode assertInlineSnapshot}
 *
 * @example Usage
 * ```ts
 * import { createAssertInlineSnapshot } from "@std/testing/snapshot";
 *
 * const assertInlineSnapshot = createAssertInlineSnapshot({
 *   // Never format the test file after writing new snapshots
 *   format: false
 * });
 *
 * Deno.test("a snapshot test case", async (t) => {
 *   await assertInlineSnapshot(
 *     t,
 *     { foo: "Hello", bar: "World" },
 *     `CREATE`
 *   );
 * })
 * ```
 *
 * @typeParam T The type of the snapshot
 * @param options The options
 * @param baseAssertSnapshot {@linkcode assertInlineSnapshot} function implementation. Default to the original {@linkcode assertInlineSnapshot}
 * @returns {@linkcode assertInlineSnapshot} function with the given default options.
 */
export function createAssertInlineSnapshot<T>(
  options: InlineSnapshotOptions<T>,
  baseAssertSnapshot: typeof assertInlineSnapshot = assertInlineSnapshot,
): typeof assertInlineSnapshot {
  return function (
    context: Deno.TestContext,
    actual: T,
    expectedSnapshot: string,
    messageOrOptions?: string | InlineSnapshotOptions<T>,
  ) {
    const mergedOptions: InlineSnapshotOptions<T> = {
      ...options,
      ...(typeof messageOrOptions === "string"
        ? {
          msg: messageOrOptions,
        }
        : messageOrOptions),
    };

    baseAssertSnapshot(context, actual, expectedSnapshot, mergedOptions);
  };
}
