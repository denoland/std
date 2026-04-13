// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, getNodeUtil, isDeno } from "./_utils.ts";
import { getOpenFsFlag } from "./_get_fs_flag.ts";
import { mapError } from "./_map_error.ts";
import type { FsFile } from "./unstable_types.ts";
import { NodeFsFile } from "./_node_fs_file.ts";

/**
 * Options which can be set when using {@linkcode open} and
 * {@linkcode openSync}.
 */
export interface OpenOptions {
  /**
   * Sets the option for read access. This option, when `true`, means that the
   * file should be read-able if opened.
   *
   * @default {true}
   */
  read?: boolean;
  /**
   * Sets the option for write access. This option, when `true`, means that the
   * file should be write-able if opened. If the file already exists, any write
   * calls on it will overwrite its contents, by default without truncating it.
   *
   * @default {false}
   */
  write?: boolean;
  /**
   * Sets the option for the append mode. This option, when `true`, means that
   * writes will append to a file instead of overwriting previous contents.
   *
   * Note that setting `{ write: true, append: true }` has the same effect as
   * setting only `{ append: true }`.
   *
   * @default {false}
   */
  append?: boolean;
  /**
   * Sets the option for truncating a previous file. If a file is successfully
   * opened with this option set it will truncate the file to `0` size if it
   * already exists. The file must be opened with write access for truncate to
   * work.
   *
   * @default {false}
   */
  truncate?: boolean;
  /**
   * Sets the option to allow creating a new file, if one doesn't already exist
   * at the specified path. Requires write or append access to be used.
   *
   * @default {false}
   */
  create?: boolean;
  /**
   * If set to `true`, no file, directory, or symlink is allowed to exist at
   * the target location. Requires write or append access to be used. When
   * createNew is set to `true`, create and truncate are ignored.
   *
   * @default {false}
   */
  createNew?: boolean;
  /**
   * Permissions to use if creating the file (defaults to `0o666`, before the
   * process's umask).
   *
   * Ignored on Windows.
   */
  mode?: number;
}

/**
 * Open a file and resolve to an instance of {@linkcode FsFile}. The file
 * does not need to previously exist if using the `create` or `createNew` open
 * options. The caller may have the resulting file automatically closed by the
 * runtime once it's out of scope by declaring the file variable with the
 * `using` keyword.
 *
 * Requires `allow-read` and/or `allow-write` permissions depending on
 * options.
 *
 * @example Automatic closing a file with `using` **TypeScript Only**
 * ```ts ignore
 * import { open } from "@std/fs/unstable-open";
 * using file = await open("/foo/bar.txt", { read: true, write: true });
 * // Do work with file.
 * ```
 *
 * @example Manually closing a file
 * ```ts ignore
 * import { open } from "@std/fs/unstable-open";
 * const file = await open("/foo/bar.txt", { read: true, write: true });
 * // Do work with file.
 * file.close();
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path to the opened file.
 * @param options Options to open a file. See {@linkcode OpenOptions}.
 * @returns A Promise that resolves to a {@linkcode FsFile} instance.
 */
export async function open(
  path: string | URL,
  options?: OpenOptions,
): Promise<FsFile> {
  if (isDeno) {
    return Deno.open(path, options);
  } else {
    const {
      read = true,
      write = false,
      append = false,
      truncate = false,
      create = false,
      createNew = false,
      mode = 0o666,
    } = options ?? {};

    try {
      const flag = getOpenFsFlag({
        read,
        write,
        append,
        truncate,
        create,
        createNew,
      });
      const { open } = getNodeFs();
      const { promisify } = getNodeUtil();
      const nodeOpenFd = promisify(open);

      const fd = await nodeOpenFd(path, flag, mode);
      return new NodeFsFile(fd) as FsFile;
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously open a file and return an instance of {@linkcode FsFile}.
 * The file does not need to previously exist if using the `create` or
 * `createNew` open options. The caller may have the resulting file
 * automatically closed by the runtime once it's out of scope by declaring the
 * file variable with the `using` keyword.
 *
 * Requires `allow-read` and/or `allow-write` permissions depending on
 * options.
 *
 * @example Automatic closing a file with `using` **TypeScript Only**
 * ```ts ignore
 * import { openSync } from "@std/fs/unstable-open";
 * using file = openSync("/foo/bar.txt", { read: true, write: true });
 * // Do work with file.
 * ```
 *
 * @example Manually closing an opened file
 * ```ts ignore
 * import { openSync } from "@std/fs/unstable-open";
 * const file = openSync("/foo/bar.txt", { read: true, write: true });
 * // Do work with file.
 * file.close();
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path to the opened file.
 * @param options Options to open a file. See {@linkcode OpenOptions}.
 * @returns A {@linkcode FsFile} instance.
 */
export function openSync(path: string | URL, options?: OpenOptions): FsFile {
  if (isDeno) {
    return Deno.openSync(path, options);
  } else {
    const {
      read = true,
      write = false,
      append = false,
      truncate = false,
      create = false,
      createNew = false,
      mode = 0o666,
    } = options ?? {};

    try {
      const flag = getOpenFsFlag({
        read,
        write,
        append,
        truncate,
        create,
        createNew,
      });

      const fd = getNodeFs().openSync(path, flag, mode);
      return new NodeFsFile(fd) as FsFile;
    } catch (error) {
      throw mapError(error);
    }
  }
}
