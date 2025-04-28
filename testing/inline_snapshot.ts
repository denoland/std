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

function makeSnapshotUpdater(
  indexToSnapshot: (string | undefined)[],
): Deno.lint.Plugin {
  return {
    name: "snapshot-updater-plugin",
    rules: {
      "update-snapshot": {
        create(context) {
          let index = 0;
          return {
            'CallExpression[callee.name="assertInlineSnapshot"]'(
              node: Deno.lint.CallExpression,
            ) {
              const snapshot = indexToSnapshot[index];
              const argument = node.arguments[2];
              index += 1;

              if (snapshot === undefined || argument === undefined) {
                return;
              }

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
  #indexToSnapshot: (string | undefined)[] = [];
  #snapshotsRegistered = 0;
  #testFileUrl: URL;
  #format: boolean | undefined | "error" = undefined;

  constructor(testFileUrl: URL) {
    this.#testFileUrl = testFileUrl;
  }

  /**
   * Write updates to the snapshot file and log statistics.
   */
  #teardown = () => {
    if (this.#snapshotsRegistered === 0) return;
    const snapshotsUpdated =
      this.#indexToSnapshot.filter((s) => s !== undefined).length;
    if (snapshotsUpdated === 0) return;

    const testFilePath = fromFileUrl(this.#testFileUrl);
    ensureFileSync(testFilePath);
    const file = Deno.readTextFileSync(testFilePath);

    const pluginRunResults = Deno.lint.runPlugin(
      makeSnapshotUpdater(this.#indexToSnapshot),
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
        "assertInlineSnapshot was called with incompatible format options. Snapshots were added but the file was not formatted.",
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
  async registerTeardown() {
    if (!this.#teardownRegistered) {
      for (const perm of ["read", "write"] as const) {
        const permission = await Deno.permissions.query({
          name: perm,
          path: this.#testFileUrl,
        });
        if (permission.state !== "granted") {
          throw new Deno.errors.PermissionDenied(
            `Missing ${perm} access to snapshot file (${this.#testFileUrl}). This is required because assertInlineSnapshot is trying to update snapshots. Please pass the --allow-${perm} flag.`,
          );
        }
      }
      globalThis.addEventListener("unload", this.#teardown);
      this.#teardownRegistered = true;
    }
  }

  /**
   * Gets the number of snapshots which have been created and increments the count by 1.
   */
  getCount() {
    const count = this.#snapshotsRegistered;
    this.#snapshotsRegistered++;
    return count;
  }

  /**
   * Creates a snapshot by index. Updates will be written to the test file when all
   * tests have run.
   */
  createSnapshot(index: number, snapshot: string, format: boolean | undefined) {
    this.#indexToSnapshot[index] = snapshot;

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
export async function assertInlineSnapshot<T>(
  context: Deno.TestContext,
  actual: T,
  expectedSnapshot: string,
  options?: InlineSnapshotOptions<T>,
): Promise<void>;
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
export async function assertInlineSnapshot<T>(
  context: Deno.TestContext,
  actual: T,
  expectedSnapshot: string,
  message?: string,
): Promise<void>;
export async function assertInlineSnapshot(
  context: Deno.TestContext,
  actual: unknown,
  expectedSnapshot: string,
  msgOrOpts?: string | InlineSnapshotOptions<unknown>,
): Promise<void> {
  const options = getOptions(msgOrOpts);
  const assertInlineSnapshotContext = AssertInlineSnapshotContext.fromContext(
    context,
  );
  const index = assertInlineSnapshotContext.getCount();

  const serializer = options.serializer ?? serialize;
  const actualSnapshot = serializer(actual);
  // TODO(WWRS): dedent expectedSnapshot to allow snapshots to look nicer

  if (equal(actualSnapshot, expectedSnapshot)) {
    return;
  }

  if (getIsUpdate(options)) {
    await assertInlineSnapshotContext.registerTeardown();
    assertInlineSnapshotContext.createSnapshot(
      index,
      actualSnapshot,
      options.format,
    );
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
  return async function (
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

    await baseAssertSnapshot(context, actual, expectedSnapshot, mergedOptions);
  };
}
