// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Parses and stringifies data in the `.env` file format.
 *
 * Note: The key needs to match the pattern /^[a-zA-Z_][a-zA-Z0-9_]*$/.
 *
 * ```ts
 * import { parse, stringify } from "@std/dotenv";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(parse("GREETING=hello world"), { GREETING: "hello world" });
 * assertEquals(stringify({ GREETING: "hello world" }), "GREETING='hello world'");
 * ```
 *
 * ## Migrating from `load()`
 *
 * `load()`, `loadSync()` and the `@std/dotenv/load` side-effect module have been
 * removed. Use the runtime's
 * {@link https://docs.deno.com/runtime/reference/env_variables/ | --env-file}
 * flag, which Node.js and Bun also support:
 *
 * ```sh
 * deno run --env-file app.ts
 * deno run --env-file=.env --env-file=.env.local app.ts
 * ```
 *
 * | Removed API | Replacement |
 * | ----------- | ----------- |
 * | `import "@std/dotenv/load"` | `deno run --env-file app.ts` |
 * | `load({ export: true })` / `loadSync({ export: true })` | `--env-file` |
 * | `load({ envPath: "./.env_prod" })` | `--env-file=.env_prod` |
 * | `load()` (read into an object, no export) | `parse(await Deno.readTextFile(".env"))` |
 *
 * Differences to be aware of:
 *
 * - `load()` silently ignored a missing file. `--env-file` warns but continues,
 *   while the `parse()` replacement above throws. To treat the file as
 *   optional:
 *
 * ```ts ignore
 * import { parse } from "@std/dotenv";
 *
 * let env: Record<string, string> = {};
 * try {
 *   env = parse(await Deno.readTextFile(".env"));
 * } catch (e) {
 *   if (!(e instanceof Deno.errors.NotFound)) throw e;
 * }
 * ```
 *
 * - `$VAR` inside a double-quoted value stayed literal with `load()` but
 *   expands with `--env-file`. Use single quotes for values containing a
 *   literal `$`.
 * - `${KEY:-default}` and nested defaults are not supported by `--env-file`.
 *   Use {@linkcode parse}, which keeps the full expansion behavior.
 * - Node's `--env-file` performs no variable expansion at all.
 * - On platforms without a CLI, e.g. Deno Deploy, set environment variables
 *   through the platform's configuration instead.
 *
 * @module
 */

export * from "./stringify.ts";
export * from "./parse.ts";
