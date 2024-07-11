// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Documentation and interface for walk were adapted from Go
// https://golang.org/pkg/path/filepath/#Walk
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
import { join } from "@std/path/join";
import { normalize } from "@std/path/normalize";
import { toPathString } from "./_to_path_string.ts";
import {
  createWalkEntry,
  createWalkEntrySync,
  type WalkEntry,
} from "./_create_walk_entry.ts";

/**
 * Error thrown in {@linkcode walk} or {@linkcode walkSync} during iteration.
 *
 * @example Usage
 * ```ts no-eval
 * import { walk, WalkError } from "@std/fs/walk";
 *
 * try {
 *   for await (const entry of walk("./non_existent_root")) {
 *     console.log(entry.path);
 *   }
 * } catch (error) {
 *   if (error instanceof WalkError) {
 *     console.error(error.message);
 *   }
 * }
 * ```
 */
export class WalkError extends Error {
  /**
   * File path of the root that's being walked.
   *
   * @example Usage
   * ```ts
   * import { WalkError } from "@std/fs/walk";
   * import { assertEquals } from "@std/assert";
   *
   * const error = new WalkError("error message", "./foo");
   *
   * assertEquals(error.root, "./foo");
   * ```
   */
  root: string;

  /**
   * Constructs a new instance.
   *
   * @param cause The cause of the error.
   * @param root The root directory that's being walked.
   *
   * @example Usage
   * ```ts no-eval
   * import { WalkError } from "@std/fs/walk";
   *
   * throw new WalkError("error message", "./foo");
   * ```
   */
  constructor(cause: unknown, root: string) {
    super(
      `${cause instanceof Error ? cause.message : cause} for path "${root}"`,
    );
    this.cause = cause;
    this.name = this.constructor.name;
    this.root = root;
  }
}

function include(
  path: string,
  exts?: string[],
  match?: RegExp[],
  skip?: RegExp[],
): boolean {
  if (exts && !exts.some((ext): boolean => path.endsWith(ext))) {
    return false;
  }
  if (match && !match.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  if (skip && skip.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  return true;
}

function wrapErrorWithPath(err: unknown, root: string) {
  if (err instanceof WalkError) return err;
  return new WalkError(err, root);
}

/** Options for {@linkcode walk} and {@linkcode walkSync}. */
export interface WalkOptions {
  /**
   * The maximum depth of the file tree to be walked recursively.
   *
   * @default {Infinity}
   */
  maxDepth?: number;
  /**
   * Indicates whether file entries should be included or not.
   *
   * @default {true}
   */
  includeFiles?: boolean;
  /**
   * Indicates whether directory entries should be included or not.
   *
   * @default {true}
   */
  includeDirs?: boolean;
  /**
   * Indicates whether symlink entries should be included or not.
   * This option is meaningful only if `followSymlinks` is set to `false`.
   *
   * @default {true}
   */
  includeSymlinks?: boolean;
  /**
   * Indicates whether symlinks should be resolved or not.
   *
   * @default {false}
   */
  followSymlinks?: boolean;
  /**
   * Indicates whether the followed symlink's path should be canonicalized.
   * This option works only if `followSymlinks` is not `false`.
   *
   * @default {true}
   */
  canonicalize?: boolean;
  /**
   * List of file extensions used to filter entries.
   * If specified, entries without the file extension specified by this option
   * are excluded.
   *
   * File extensions with or without a leading period are accepted.
   *
   * @default {[]}
   */
  exts?: string[];
  /**
   * List of regular expression patterns used to filter entries.
   * If specified, entries that do not match the patterns specified by this
   * option are excluded.
   */
  match?: RegExp[];
  /**
   * List of regular expression patterns used to filter entries.
   * If specified, entries matching the patterns specified by this option are
   * excluded.
   */
  skip?: RegExp[];
}
export type { WalkEntry };

/**
 * Recursively walks through a directory and yields information about each file
 * and directory encountered.
 *
 * The file paths are absolute paths. The root directory is included in the
 * yielded entries.
 *
 * Requires `--allow-read` permission.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param root The root directory to start the walk from, as a string or URL.
 * @param options The options for the walk.
 *
 * @returns An async iterable iterator that yields the walk entry objects.
 *
 * @example Basic usage
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk("."));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/foo.ts",
 * //     name: "foo.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Maximum file depth
 *
 * Setting the `maxDepth` option to `1` will only include the root directory and
 * its immediate children.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo
 *     └── bar.ts
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk(".", { maxDepth: 1 }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/foo",
 * //     name: "foo",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Exclude files
 *
 * Setting the `includeFiles` option to `false` will exclude files.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk(".", { includeFiles: false }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/foo",
 * //     name: "foo",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false,
 * //   },
 * // ]
 * ```
 *
 * @example Exclude directories
 *
 * Setting the `includeDirs` option to `false` will exclude directories.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk(".", { includeDirs: false }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Exclude symbolic links
 *
 * Setting the `includeSymlinks` option to `false` will exclude symbolic links.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * ├── foo
 * └── link -> script.ts (symbolic link)
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk(".", { includeSymlinks: false }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Follow symbolic links
 *
 * Setting the `followSymlinks` option to `true` will follow symbolic links,
 * affecting the `path` property of the walk entry.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── link -> script.ts (symbolic link)
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk(".", { followSymlinks: true }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "link",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: true
 * //   },
 * // ]
 * ```
 *
 * @example Canonicalize symbolic links
 *
 * Setting the `canonicalize` option to `false` will canonicalize the path of
 * the followed symbolic link. Meaning, the `path` property of the walk entry
 * will be the path of the symbolic link itself.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── link -> script.ts (symbolic link)
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk(".", { followSymlinks: true, canonicalize: true }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/link",
 * //     name: "link",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: true
 * //   },
 * // ]
 * ```
 *
 * @example Filter by file extensions
 *
 * Setting the `exts` option to `[".ts"]` or `["ts"]` will only include entries
 * with the `.ts` file extension.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.js
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk(".", { exts: [".ts"] }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Filter by regular expressions
 *
 * Setting the `match` option to `[/.s/]` will only include entries with the
 * letter `s` in their name.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── README.md
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk(".", { match: [/s/] }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Exclude by regular expressions
 *
 * Setting the `skip` option to `[/.s/]` will exclude entries with the letter
 * `s` in their name.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── README.md
 * ```
 *
 * ```ts no-eval
 * import { walk } from "@std/fs/walk";
 *
 * await Array.fromAsync(walk(".", { skip: [/s/] }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/README.md",
 * //     name: "README.md",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 */
export async function* walk(
  root: string | URL,
  options: WalkOptions = {},
): AsyncIterableIterator<WalkEntry> {
  let {
    maxDepth = Infinity,
    includeFiles = true,
    includeDirs = true,
    includeSymlinks = true,
    followSymlinks = false,
    canonicalize = true,
    exts = undefined,
    match = undefined,
    skip = undefined,
  } = options;

  if (maxDepth < 0) {
    return;
  }
  root = toPathString(root);
  if (exts) {
    exts = exts.map((ext) => ext.startsWith(".") ? ext : `.${ext}`);
  }
  if (includeDirs && include(root, exts, match, skip)) {
    yield await createWalkEntry(root);
  }
  if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
    return;
  }
  try {
    for await (const entry of Deno.readDir(root)) {
      let path = join(root, entry.name);

      let { isSymlink, isDirectory } = entry;

      if (isSymlink) {
        if (!followSymlinks) {
          if (includeSymlinks && include(path, exts, match, skip)) {
            yield { path, ...entry };
          }
          continue;
        }
        const realPath = await Deno.realPath(path);
        if (canonicalize) {
          path = realPath;
        }
        // Caveat emptor: don't assume |path| is not a symlink. realpath()
        // resolves symlinks but another process can replace the file system
        // entity with a different type of entity before we call lstat().
        ({ isSymlink, isDirectory } = await Deno.lstat(realPath));
      }

      if (isSymlink || isDirectory) {
        yield* walk(path, {
          maxDepth: maxDepth - 1,
          includeFiles,
          includeDirs,
          includeSymlinks,
          followSymlinks,
          exts,
          match,
          skip,
        });
      } else if (includeFiles && include(path, exts, match, skip)) {
        yield { path, ...entry };
      }
    }
  } catch (err) {
    throw wrapErrorWithPath(err, normalize(root));
  }
}

/**
 * Recursively walks through a directory and yields information about each file
 * and directory encountered.
 *
 * The file paths are absolute paths. The root directory is included in the
 * yielded entries.
 *
 * Requires `--allow-read` permission.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param root The root directory to start the walk from, as a string or URL.
 * @param options The options for the walk.
 *
 * @returns A synchronous iterable iterator that yields the walk entry objects.
 *
 * @example Basic usage
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync("."));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/foo.ts",
 * //     name: "foo.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Maximum file depth
 *
 * Setting the `maxDepth` option to `1` will only include the root directory and
 * its immediate children.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo
 *     └── bar.ts
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync(".", { maxDepth: 1 }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/foo",
 * //     name: "foo",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Exclude files
 *
 * Setting the `includeFiles` option to `false` will exclude files.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync(".", { includeFiles: false }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/foo",
 * //     name: "foo",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false,
 * //   },
 * // ]
 * ```
 *
 * @example Exclude directories
 *
 * Setting the `includeDirs` option to `false` will exclude directories.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync(".", { includeDirs: false }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Exclude symbolic links
 *
 * Setting the `includeSymlinks` option to `false` will exclude symbolic links.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * ├── foo
 * └── link -> script.ts (symbolic link)
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync(".", { includeSymlinks: false }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Follow symbolic links
 *
 * Setting the `followSymlinks` option to `true` will follow symbolic links,
 * affecting the `path` property of the walk entry.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── link -> script.ts (symbolic link)
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync(".", { followSymlinks: true }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "link",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: true
 * //   },
 * // ]
 * ```
 *
 * @example Canonicalize symbolic links
 *
 * Setting the `canonicalize` option to `false` will canonicalize the path of
 * the followed symbolic link. Meaning, the `path` property of the walk entry
 * will be the path of the symbolic link itself.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── link -> script.ts (symbolic link)
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync(".", { followSymlinks: true, canonicalize: true }));
 * // [
 * //   {
 * //     path: "/Users/user/folder",
 * //     name: "folder",
 * //     isFile: false,
 * //     isDirectory: true,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * //   {
 * //     path: "/Users/user/folder/link",
 * //     name: "link",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: true
 * //   },
 * // ]
 * ```
 *
 * @example Filter by file extensions
 *
 * Setting the `exts` option to `[".ts"]` or `["ts"]` will only include entries
 * with the `.ts` file extension.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.js
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync(".", { exts: [".ts"] }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Filter by regular expressions
 *
 * Setting the `match` option to `[/.s/]` will only include entries with the
 * letter `s` in their name.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── README.md
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync(".", { match: [/s/] }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/script.ts",
 * //     name: "script.ts",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 *
 * @example Exclude by regular expressions
 *
 * Setting the `skip` option to `[/.s/]` will exclude entries with the letter
 * `s` in their name.
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── README.md
 * ```
 *
 * ```ts no-eval
 * import { walkSync } from "@std/fs/walk";
 *
 * Array.from(walkSync(".", { skip: [/s/] }));
 * // [
 * //   {
 * //     path: "/Users/user/folder/README.md",
 * //     name: "README.md",
 * //     isFile: true,
 * //     isDirectory: false,
 * //     isSymlink: false
 * //   },
 * // ]
 * ```
 */
export function* walkSync(
  root: string | URL,
  {
    maxDepth = Infinity,
    includeFiles = true,
    includeDirs = true,
    includeSymlinks = true,
    followSymlinks = false,
    canonicalize = true,
    exts = undefined,
    match = undefined,
    skip = undefined,
  }: WalkOptions = {},
): IterableIterator<WalkEntry> {
  root = toPathString(root);
  if (exts) {
    exts = exts.map((ext) => ext.startsWith(".") ? ext : `.${ext}`);
  }
  if (maxDepth < 0) {
    return;
  }
  if (includeDirs && include(root, exts, match, skip)) {
    yield createWalkEntrySync(root);
  }
  if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
    return;
  }
  let entries;
  try {
    entries = Deno.readDirSync(root);
  } catch (err) {
    throw wrapErrorWithPath(err, normalize(root));
  }
  for (const entry of entries) {
    let path = join(root, entry.name);

    let { isSymlink, isDirectory } = entry;

    if (isSymlink) {
      if (!followSymlinks) {
        if (includeSymlinks && include(path, exts, match, skip)) {
          yield { path, ...entry };
        }
        continue;
      }
      const realPath = Deno.realPathSync(path);
      if (canonicalize) {
        path = realPath;
      }
      // Caveat emptor: don't assume |path| is not a symlink. realpath()
      // resolves symlinks but another process can replace the file system
      // entity with a different type of entity before we call lstat().
      ({ isSymlink, isDirectory } = Deno.lstatSync(realPath));
    }

    if (isSymlink || isDirectory) {
      yield* walkSync(path, {
        maxDepth: maxDepth - 1,
        includeFiles,
        includeDirs,
        includeSymlinks,
        followSymlinks,
        exts,
        match,
        skip,
      });
    } else if (includeFiles && include(path, exts, match, skip)) {
      yield { path, ...entry };
    }
  }
}
