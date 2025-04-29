// Copyright 2018-2025 the Deno authors. MIT license.

/** A snapshotting library.
 *
 * The `assertSnapshot` function will create a snapshot of a value and compare it
 * to a reference snapshot, which is stored alongside the test file in the
 * `__snapshots__` directory.
 *
 * ```ts
 * // example_test.ts
 * import { assertSnapshot } from "@std/testing/snapshot";
 *
 * Deno.test("isSnapshotMatch", async function (t): Promise<void> {
 *   const a = {
 *     hello: "world!",
 *     example: 123,
 *   };
 *   await assertSnapshot(t, a);
 * });
 * ```
 *
 * ```ts no-assert
 * // __snapshots__/example_test.ts.snap
 * export const snapshot: Record<string, string> = {};
 *
 * snapshot["isSnapshotMatch 1"] = `
 * {
 *   example: 123,
 *   hello: "world!",
 * }
 * `;
 * ```
 *
 * The `assertInlineSnapshot` function will create a snapshot of a value and compare it
 * to a reference snapshot, which is stored in the test file.
 *
 * ```ts
 * // example_test.ts
 * import { assertInlineSnapshot } from "@std/testing/snapshot";
 *
 * Deno.test("isInlineSnapshotMatch", function (t): void {
 *   const a = {
 *     hello: "world!",
 *     example: 123,
 *   };
 *   assertInlineSnapshot(
 *     t,
 *     a,
 *     `{
 *   hello: "world!",
 *   example: 123,
 * }`
 *   );
 * });
 * ```
 *
 * If the snapshot of the passed `actual` does not match the expected snapshot,
 * `assertSnapshot` and `assetInlineSnapshot` will throw an `AssertionError`,
 * causing the test to fail.
 *
 * ## Updating Snapshots:
 *
 * When adding new snapshot assertions to your test suite, or when intentionally
 * making changes which cause your snapshots to fail, you can update your snapshots
 * by running the snapshot tests in update mode. Tests can be run in update mode by
 * passing the `--update` or `-u` flag as an argument when running the test. When
 * this flag is passed, then any snapshots which do not match will be updated.
 * When this flag is not passed, tests missing snapshots will fail.
 *
 * ```sh
 * deno test --allow-all -- --update
 * ```
 *
 * ## Permissions:
 *
 * When running `assertSnapshot`, the `--allow-read` permission must be enabled, or
 * else any calls to `assertSnapshot` will fail due to insufficient permissions.
 * Additionally, when updating snapshots, the `--allow-write` permission must also
 * be enabled, as this is required in order to update snapshot files.
 *
 * The `assertSnapshot` function will only attempt to read from and write to
 * snapshot files. As such, the allow list for `--allow-read` and `--allow-write`
 * can be limited to only include existing snapshot files, if so desired.
 *
 * If no snapshots are created, `assertInlineSnapshot` does not require any
 * permissions. However, creating snapshots requires `--allow-read` and
 * `--allow-write` on any test files for which new snapshots will be added.
 * Additionally, `--allow-run` is required if any files will be formatted (which is
 * the default if not specified in the options).
 *
 * ## Options:
 *
 * The `assertSnapshot` and `assertInlineSnapshot` functions optionally accept an
 * options object.
 *
 * ```ts
 * // example_test.ts
 * import { assertSnapshot } from "@std/testing/snapshot";
 *
 * Deno.test("isSnapshotMatch", async function (t): Promise<void> {
 *   const a = {
 *     hello: "world!",
 *     example: 123,
 *   };
 *   await assertSnapshot(t, a, {
 *     // options
 *   });
 * });
 * ```
 *
 * You can also configure default options for `assertSnapshot` and `assertInlineSnapshot`.
 *
 * ```ts
 * // example_test.ts
 * import { createAssertSnapshot, createAssertInlineSnapshot } from "@std/testing/snapshot";
 *
 * const assertSnapshot = createAssertSnapshot({
 *   // options
 * });
 * const assertInlineSnapshot = createAssertInlineSnapshot({
 *   // options
 * });
 * ```
 *
 * When configuring default options like this, the resulting `assertSnapshot` or
 * `assertInlineSnapshot` function will function the same as the default function exported
 * from thesnapshot module. If passed an optional options object, this will take precedence
 * over the default options, where the value provided for an option differs.
 *
 * It is possible to "extend" an `assertSnapshot` or `assertInlineSnapshot` function which
 * has been configured with default options.
 *
 * ```ts
 * // example_test.ts
 * import { createAssertSnapshot } from "@std/testing/snapshot";
 * import { stripAnsiCode } from "@std/fmt/colors";
 *
 * const assertSnapshot = createAssertSnapshot({
 *   dir: ".snaps",
 * });
 *
 * const assertMonochromeSnapshot = createAssertSnapshot<string>(
 *   { serializer: stripAnsiCode },
 *   assertSnapshot,
 * );
 *
 * Deno.test("isSnapshotMatch", async function (t): Promise<void> {
 *   const a = "\x1b[32mThis green text has had its colors stripped\x1b[39m";
 *   await assertMonochromeSnapshot(t, a);
 * });
 * ```
 *
 * ```ts no-assert
 * // .snaps/example_test.ts.snap
 * export const snapshot: Record<string, string> = {};
 *
 * snapshot["isSnapshotMatch 1"] = "This green text has had its colors stripped";
 * ```
 *
 * ## Version Control:
 *
 * Snapshot testing works best when changes to snapshot files are committed
 * alongside other code changes. This allows for changes to reference snapshots to
 * be reviewed along side the code changes that caused them, and ensures that when
 * others pull your changes, their tests will pass without needing to update
 * snapshots locally.
 *
 * @module
 */

import {
  assertInlineSnapshot,
  createAssertInlineSnapshot,
  type InlineSnapshotOptions,
} from "./_assert_inline_snapshot.ts";
import {
  assertSnapshot,
  createAssertSnapshot,
  type SnapshotMode,
  type SnapshotOptions,
} from "./_assert_snapshot.ts";
import { serialize } from "./_snapshot_utils.ts";

export {
  assertInlineSnapshot,
  assertSnapshot,
  createAssertInlineSnapshot,
  createAssertSnapshot,
  type InlineSnapshotOptions,
  serialize,
  type SnapshotMode,
  type SnapshotOptions,
};
