// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.

/**
 * Utilities for working with OS-specific file paths.
 *
 * Functions from this module will automatically switch to support the path style
 * of the current OS, either `windows` for Microsoft Windows, or `posix` for
 * every other operating system, eg. Linux, MacOS, BSD etc.
 *
 * To use functions for a specific path style regardless of the current OS
 * import the modules from the platform sub directory instead.
 *
 * ## Basic Path Operations
 *
 * ```ts
 * import * as path from "@std/path";
 * import { assertEquals } from "@std/assert";
 *
 * // Get components of a path
 * if (Deno.build.os === "windows") {
 *   assertEquals(path.basename("C:\\Users\\user\\file.txt"), "file.txt");
 *   assertEquals(path.dirname("C:\\Users\\user\\file.txt"), "C:\\Users\\user");
 *   assertEquals(path.extname("C:\\Users\\user\\file.txt"), ".txt");
 * } else {
 *   assertEquals(path.basename("/home/user/file.txt"), "file.txt");
 *   assertEquals(path.dirname("/home/user/file.txt"), "/home/user");
 *   assertEquals(path.extname("/home/user/file.txt"), ".txt");
 * }
 *
 * // Join path segments
 * if (Deno.build.os === "windows") {
 *   assertEquals(path.join("C:\\", "Users", "docs", "file.txt"), "C:\\Users\\docs\\file.txt");
 * } else {
 *   assertEquals(path.join("/home", "user", "docs", "file.txt"), "/home/user/docs/file.txt");
 * }
 *
 * // Normalize a path
 * if (Deno.build.os === "windows") {
 *   assertEquals(path.normalize("C:\\Users\\user\\..\\temp\\.\\file.txt"), "C:\\Users\\temp\\file.txt");
 * } else {
 *   assertEquals(path.normalize("/home/user/../temp/./file.txt"), "/home/temp/file.txt");
 * }
 *
 * // Resolve absolute path
 * if (Deno.build.os === "windows") {
 *   const resolved = path.resolve("C:\\foo", "docs", "file.txt");
 *   assertEquals(resolved, "C:\\foo\\docs\\file.txt");
 *   assertEquals(path.isAbsolute(resolved), true);
 * } else {
 *   const resolved = path.resolve("/foo", "docs", "file.txt");
 *   assertEquals(resolved, "/foo/docs/file.txt");
 *   assertEquals(path.isAbsolute(resolved), true);
 * }
 *
 * // Get relative path
 * if (Deno.build.os === "windows") {
 *   assertEquals(path.relative("C:\\Users", "C:\\Users\\docs\\file.txt"), "docs\\file.txt");
 *   assertEquals(path.relative("C:\\Users", "D:\\Programs"), "D:\\Programs");
 * } else {
 *   assertEquals(path.relative("/home/user", "/home/user/docs/file.txt"), "docs/file.txt");
 *   assertEquals(path.relative("/home/user", "/var/data"), "../../var/data");
 * }
 * ```
 *
 * ## Path Parsing and Formatting
 *
 * ```ts
 * import * as path from "@std/path";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   const parsedWindows = path.parse("C:\\Users\\user\\file.txt");
 *   assertEquals(parsedWindows.root, "C:\\");
 *   assertEquals(parsedWindows.dir, "C:\\Users\\user");
 *   assertEquals(parsedWindows.base, "file.txt");
 *   assertEquals(parsedWindows.ext, ".txt");
 *   assertEquals(parsedWindows.name, "file");
 *
 *   // Format path from components (Windows)
 *   assertEquals(
 *     path.format({ dir: "C:\\Users\\user", base: "file.txt" }),
 *     "C:\\Users\\user\\file.txt"
 *   );
 * } else {
 *   const parsedPosix = path.parse("/home/user/file.txt");
 *   assertEquals(parsedPosix.root, "/");
 *   assertEquals(parsedPosix.dir, "/home/user");
 *   assertEquals(parsedPosix.base, "file.txt");
 *   assertEquals(parsedPosix.ext, ".txt");
 *   assertEquals(parsedPosix.name, "file");
 *
 *   // Format path from components (POSIX)
 *   assertEquals(
 *     path.format({ dir: "/home/user", base: "file.txt" }),
 *     "/home/user/file.txt"
 *   );
 * }
 * ```
 *
 * ## URL Conversion
 *
 * ```ts
 * import * as path from "@std/path";
 * import { assertEquals } from "@std/assert";
 *
 * // Convert between file URLs and paths
 * if (Deno.build.os === "windows") {
 *   assertEquals(path.fromFileUrl("file:///C:/Users/user/file.txt"), "C:\\Users\\user\\file.txt");
 *   assertEquals(path.toFileUrl("C:\\Users\\user\\file.txt").href, "file:///C:/Users/user/file.txt");
 * } else {
 *   assertEquals(path.fromFileUrl("file:///home/user/file.txt"), "/home/user/file.txt");
 *   assertEquals(path.toFileUrl("/home/user/file.txt").href, "file:///home/user/file.txt");
 * }
 * ```
 *
 * ## Path Properties
 *
 * ```ts
 * import * as path from "@std/path";
 * import { assertEquals } from "@std/assert";
 *
 * // Check if path is absolute
 * if (Deno.build.os === "windows") {
 *   assertEquals(path.isAbsolute("C:\\Users"), true);
 *   assertEquals(path.isAbsolute("\\\\Server\\share"), true);
 *   assertEquals(path.isAbsolute("C:relative\\path"), false);
 *   assertEquals(path.isAbsolute("..\\relative\\path"), false);
 * } else {
 *   assertEquals(path.isAbsolute("/home/user"), true);
 *   assertEquals(path.isAbsolute("./relative/path"), false);
 *   assertEquals(path.isAbsolute("../relative/path"), false);
 * }
 *
 * // Convert to namespaced path (Windows-specific)
 * if (Deno.build.os === "windows") {
 *   assertEquals(path.toNamespacedPath("C:\\Users\\file.txt"), "\\\\?\\C:\\Users\\file.txt");
 *   assertEquals(path.toNamespacedPath("\\\\server\\share\\file.txt"), "\\\\?\\UNC\\server\\share\\file.txt");
 * } else {
 *   // On POSIX, toNamespacedPath returns the path unchanged
 *   assertEquals(path.toNamespacedPath("/home/user/file.txt"), "/home/user/file.txt");
 * }
 * ```
 *
 * ## Glob Pattern Utilities
 *
 * ```ts
 * import * as path from "@std/path";
 * import { assertEquals } from "@std/assert";
 *
 * // Check if a string is a glob pattern
 * assertEquals(path.isGlob("*.txt"), true);
 *
 * // Convert glob pattern to RegExp
 * const pattern = path.globToRegExp("*.txt");
 * assertEquals(pattern.test("file.txt"), true);
 *
 * // Join multiple glob patterns
 * if (Deno.build.os === "windows") {
 *   assertEquals(path.joinGlobs(["src", "**\\*.ts"]), "src\\**\\*.ts");
 * } else {
 *   assertEquals(path.joinGlobs(["src", "**\/*.ts"]), "src/**\/*.ts");
 * }
 *
 * // Normalize a glob pattern
 * if (Deno.build.os === "windows") {
 *   assertEquals(path.normalizeGlob("src\\..\\**\\*.ts"), "**\\*.ts");
 * } else {
 *   assertEquals(path.normalizeGlob("src/../**\/*.ts"), "**\/*.ts");
 * }
 * ```
 *
 * For POSIX-specific functions:
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/posix/from-file-url";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(fromFileUrl("file:///home/foo"), "/home/foo");
 * ```
 *
 * For Windows-specific functions:
 *
 * ```ts
 * import { fromFileUrl } from "@std/path/windows/from-file-url";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(fromFileUrl("file:///home/foo"), "\\home\\foo");
 * ```
 *
 * Functions for working with URLs can be found in
 * {@link ./doc/posix/~ | @std/path/posix}.
 *
 * @module
 */
export * from "./basename.ts";
export * from "./constants.ts";
export * from "./dirname.ts";
export * from "./extname.ts";
export * from "./format.ts";
export * from "./from_file_url.ts";
export * from "./is_absolute.ts";
export * from "./join.ts";
export * from "./normalize.ts";
export * from "./parse.ts";
export * from "./relative.ts";
export * from "./resolve.ts";
export * from "./to_file_url.ts";
export * from "./to_namespaced_path.ts";
export * from "./common.ts";
export * from "./types.ts";
export * from "./glob_to_regexp.ts";
export * from "./is_glob.ts";
export * from "./join_globs.ts";
export * from "./normalize_glob.ts";
