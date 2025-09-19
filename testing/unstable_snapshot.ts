// Copyright 2018-2025 the Deno authors. MIT license.
// @ts-nocheck Deno.lint namespace does not pass type checking in Deno 1.x

import type { SnapshotOptions } from "./snapshot.ts";
import { AssertionError } from "@std/assert/assertion-error";
import { equal } from "@std/assert/equal";
import {
  escapeStringForJs,
  getIsUpdate,
  getOptions,
  getSnapshotNotMatchMessage,
  LINT_SUPPORTED,
  serialize,
} from "./_snapshot_utils.ts";

/**
 * The options for {@linkcode assertInlineSnapshot}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface InlineSnapshotOptions<T = unknown>
  extends Pick<SnapshotOptions<T>, "msg" | "serializer"> {}

interface ErrorLocation {
  lineNumber: number;
  columnNumber: number;
}

interface SnapshotUpdateRequest {
  fileName: string;
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
  getFileName(): string | null;
  getLineNumber(): number | null;
  getColumnNumber(): number | null;
}

function makeSnapshotUpdater(
  updateRequests: SnapshotUpdateRequest[],
): Deno.lint.Plugin {
  return {
    name: "snapshot-updater-plugin",
    rules: {
      "update-snapshot": {
        create(context) {
          const src = context.sourceCode.text;
          // TODO(WWRS): Add \u2028 and \u2029 once Deno counts them as line breaks
          const lineBreaks = [...src.matchAll(/\n|\r\n?/g)]
            .map((m) => m.index);
          const locationToSnapshot: Record<number, string> = {};
          for (const updateRequest of updateRequests) {
            const { lineNumber, columnNumber, actualSnapshot } = updateRequest;
            // Since lineNumber is 1-indexed, subtract 1 to convert to 0-indexed.
            // Then fetch the line break before this line, which is the (n-1)th break,
            // or 0 if this is the top line (index 0).
            const location = (lineBreaks[lineNumber - 2] ?? 0) + columnNumber;
            locationToSnapshot[location] = actualSnapshot;
          }

          return {
            // Fetching all functions lets us support createAssertInlineSnapshot
            "CallExpression"(node: Deno.lint.CallExpression) {
              const snapshot = locationToSnapshot[node.range[0]];
              const argument = node.arguments[1];
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

const updateRequests: SnapshotUpdateRequest[] = [];

function updateSnapshots() {
  if (updateRequests.length === 0) return;

  if (!LINT_SUPPORTED) {
    throw new Error(
      "Deno versions before 2.2.0 do not support Deno.lint, which is required to update inline snapshots",
    );
  }

  const pathsToUpdate = Map.groupBy(updateRequests, (r) => r.fileName);

  for (const [path, updateRequests] of pathsToUpdate) {
    const snapshotsUpdated = updateRequests.length;

    const file = Deno.readTextFileSync(path);
    const pluginRunResults = Deno.lint.runPlugin(
      makeSnapshotUpdater(updateRequests),
      "dummy.ts",
      file,
    );

    const fixes = pluginRunResults.flatMap((v) => v.fix ?? []);
    if (fixes.length !== snapshotsUpdated) {
      throw new Error(
        `assertInlineSnapshot expected to update ${snapshotsUpdated} ${
          snapshotsUpdated === 1 ? "snapshot" : "snapshots"
        } in ${path} but generated ${fixes.length}`,
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

    Deno.writeTextFileSync(path, output);
  }

  const shouldFormat = !Deno.args.some((arg) => arg === "--no-format");
  if (shouldFormat) {
    const command = new Deno.Command(Deno.execPath(), {
      args: ["fmt", ...pathsToUpdate.keys()],
    });
    const { stderr, success } = command.outputSync();
    if (!success) {
      throw new Error(
        `assertInlineSnapshot errored while formatting ${path}:\n${
          new TextDecoder().decode(stderr)
        }`,
      );
    }
  }

  // deno-lint-ignore no-console
  console.log(
    `%c\n > ${updateRequests.length} ${
      updateRequests.length === 1 ? "snapshot" : "snapshots"
    } updated.`,
    "color: green; font-weight: bold;",
  );
}
globalThis.addEventListener("unload", () => {
  updateSnapshots();
});

/**
 * Make an assertion that `actual` matches `expectedSnapshot`. If they do not match,
 * then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts no-assert
 * import { assertInlineSnapshot } from "@std/testing/unstable-snapshot";
 *
 * Deno.test("snapshot", () => {
 *   assertInlineSnapshot<number>(2, `2`);
 * });
 * ```
 * @typeParam T The type of the snapshot
 * @param actual The actual value to compare
 * @param expectedSnapshot The expected snapshot, or \`CREATE\` to create
 * @param options The options
 */
export function assertInlineSnapshot<T>(
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
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts no-assert
 * import { assertInlineSnapshot } from "@std/testing/unstable-snapshot";
 *
 * Deno.test("snapshot", () => {
 *   assertInlineSnapshot<number>(2, `2`);
 * });
 * ```
 * @typeParam T The type of the snapshot
 * @param actual The actual value to compare
 * @param expectedSnapshot The expected snapshot, or \`CREATE\` to create
 * @param message The optional assertion message
 */
export function assertInlineSnapshot<T>(
  actual: T,
  expectedSnapshot: string,
  message?: string,
): void;
export function assertInlineSnapshot(
  actual: unknown,
  expectedSnapshot: string,
  msgOrOpts?: string | InlineSnapshotOptions<unknown>,
): void {
  const options = getOptions(msgOrOpts);
  const serializer = options.serializer ?? serialize;
  const actualSnapshot = serializer(actual);
  // TODO(WWRS): dedent expectedSnapshot to allow snapshots to look nicer

  if (equal(actualSnapshot, expectedSnapshot)) {
    return;
  }

  if (getIsUpdate(options)) {
    const origPrepareStackTrace = (Error as V8Error).prepareStackTrace;
    try {
      const stackCatcher = { stack: null as SnapshotUpdateRequest | null };
      (Error as V8Error).prepareStackTrace = (
        _err: Error,
        stack: CallSite[],
      ): SnapshotUpdateRequest | null => {
        const callerStackFrame = stack[0];
        if (!callerStackFrame || callerStackFrame.isEval()) return null;

        const fileName = callerStackFrame.getFileName();
        const lineNumber = callerStackFrame.getLineNumber();
        const columnNumber = callerStackFrame.getColumnNumber();
        if (fileName === null || lineNumber === null || columnNumber === null) {
          return null;
        }

        return {
          fileName,
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
        updateRequests.push(request);
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
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts no-assert
 * import { createAssertInlineSnapshot } from "@std/testing/unstable-snapshot";
 *
 * const assertInlineSnapshot = createAssertInlineSnapshot({
 *   serializer: JSON.stringify,
 * });
 *
 * Deno.test("a snapshot test case", () => {
 *   assertInlineSnapshot(
 *     { foo: "Hello", bar: undefined },
 *     `{"foo":"Hello"}`
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
    actual: T,
    expectedSnapshot: string,
    messageOrOptions?: string | InlineSnapshotOptions<T>,
  ) {
    const mergedOptions: InlineSnapshotOptions<T> = {
      ...options,
      ...(typeof messageOrOptions === "string"
        ? { msg: messageOrOptions }
        : messageOrOptions),
    };

    baseAssertSnapshot(actual, expectedSnapshot, mergedOptions);
  };
}
