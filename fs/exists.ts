// Copyright 2018-2025 the Deno authors. MIT license.

/** Options for {@linkcode exists} and {@linkcode existsSync.} */
export interface ExistsOptions {
  /**
   * When `true`, will check if the path is readable by the user as well.
   *
   * @default {false}
   */
  isReadable?: boolean;
  /**
   * When `true`, will check if the path is a directory as well. Directory
   * symlinks are included.
   *
   * @default {false}
   */
  isDirectory?: boolean;
  /**
   * When `true`, will check if the path is a file as well. File symlinks are
   * included.
   *
   * @default {false}
   */
  isFile?: boolean;
}

/**
 * Asynchronously test whether or not the given path exists by checking with
 * the file system.
 *
 * Note: Do not use this function if performing a check before another operation
 * on that file. Doing so creates a race condition. Instead, perform the actual
 * file operation directly. This function is not recommended for this use case.
 * See the recommended method below.
 *
 * @see {@link https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use} for
 * more information on the time-of-check to time-of-use bug.
 *
 * Requires `--allow-read` permissions, and in some cases, `--allow-sys`
 * permissions if `options.isReadable` is `true`.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param path The path to the file or directory, as a string or URL.
 * @param options Additional options for the check.
 *
 * @returns A promise that resolves with `true` if the path exists, `false`
 * otherwise.
 *
 * @example Recommended method
 * ```ts ignore
 * // Notice no use of exists
 * try {
 *   await Deno.remove("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 *
 * Notice that `exists()` is not used in the above example. Doing so avoids a
 * possible race condition. See the above note for details.
 *
 * @example Basic usage
 * ```ts ignore
 * import { exists } from "@std/fs/exists";
 *
 * await exists("./exists"); // true
 * await exists("./does_not_exist"); // false
 * ```
 *
 * @example Check if a path is readable
 *
 * Requires `--allow-sys` permissions in some cases.
 *
 * ```ts ignore
 * import { exists } from "@std/fs/exists";
 *
 * await exists("./readable", { isReadable: true }); // true
 * await exists("./not_readable", { isReadable: true }); // false
 * ```
 *
 * @example Check if a path is a directory
 * ```ts ignore
 * import { exists } from "@std/fs/exists";
 *
 * await exists("./directory", { isDirectory: true }); // true
 * await exists("./file", { isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a file
 * ```ts ignore
 * import { exists } from "@std/fs/exists";
 *
 * await exists("./file", { isFile: true }); // true
 * await exists("./directory", { isFile: true }); // false
 * ```
 *
 * @example Check if a path is a readable directory
 *
 * Requires `--allow-sys` permissions in some cases.
 *
 * ```ts ignore
 * import { exists } from "@std/fs/exists";
 *
 * await exists("./readable_directory", { isReadable: true, isDirectory: true }); // true
 * await exists("./not_readable_directory", { isReadable: true, isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a readable file
 *
 * Requires `--allow-sys` permissions in some cases.
 *
 * ```ts ignore
 * import { exists } from "@std/fs/exists";
 *
 * await exists("./readable_file", { isReadable: true, isFile: true }); // true
 * await exists("./not_readable_file", { isReadable: true, isFile: true }); // false
 * ```
 */
export async function exists(
  path: string | URL,
  options?: ExistsOptions,
): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    if (
      options &&
      (options.isReadable || options.isDirectory || options.isFile)
    ) {
      if (options.isDirectory && options.isFile) {
        throw new TypeError(
          "ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together",
        );
      }
      if (
        (options.isDirectory && !stat.isDirectory) ||
        (options.isFile && !stat.isFile)
      ) {
        return false;
      }
      if (options.isReadable) {
        return fileIsReadable(stat);
      }
    }
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      if (
        (await Deno.permissions.query({ name: "read", path })).state ===
          "granted"
      ) {
        // --allow-read not missing
        return !options?.isReadable; // PermissionDenied was raised by file system, so the item exists, but can't be read
      }
    }
    throw error;
  }
}

/**
 * Synchronously test whether or not the given path exists by checking with
 * the file system.
 *
 * Note: Do not use this function if performing a check before another operation
 * on that file. Doing so creates a race condition. Instead, perform the actual
 * file operation directly. This function is not recommended for this use case.
 * See the recommended method below.
 *
 * @see {@link https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use} for
 * more information on the time-of-check to time-of-use bug.
 *
 * Requires `--allow-read` permissions, and in some cases, `--allow-sys`
 * permissions if `options.isReadable` is `true`.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param path The path to the file or directory, as a string or URL.
 * @param options Additional options for the check.
 *
 * @returns `true` if the path exists, `false` otherwise.
 *
 * @example Recommended method
 * ```ts ignore
 * // Notice no use of exists
 * try {
 *   Deno.removeSync("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 *
 * Notice that `existsSync()` is not used in the above example. Doing so avoids
 * a possible race condition. See the above note for details.
 *
 * @example Basic usage
 * ```ts ignore
 * import { existsSync } from "@std/fs/exists";
 *
 * existsSync("./exists"); // true
 * existsSync("./does_not_exist"); // false
 * ```
 *
 * @example Check if a path is readable
 *
 * Requires `--allow-sys` permissions in some cases.
 *
 * ```ts ignore
 * import { existsSync } from "@std/fs/exists";
 *
 * existsSync("./readable", { isReadable: true }); // true
 * existsSync("./not_readable", { isReadable: true }); // false
 * ```
 *
 * @example Check if a path is a directory
 * ```ts ignore
 * import { existsSync } from "@std/fs/exists";
 *
 * existsSync("./directory", { isDirectory: true }); // true
 * existsSync("./file", { isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a file
 * ```ts ignore
 * import { existsSync } from "@std/fs/exists";
 *
 * existsSync("./file", { isFile: true }); // true
 * existsSync("./directory", { isFile: true }); // false
 * ```
 *
 * @example Check if a path is a readable directory
 *
 * Requires `--allow-sys` permissions in some cases.
 *
 * ```ts ignore
 * import { existsSync } from "@std/fs/exists";
 *
 * existsSync("./readable_directory", { isReadable: true, isDirectory: true }); // true
 * existsSync("./not_readable_directory", { isReadable: true, isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a readable file
 *
 * Requires `--allow-sys` permissions in some cases.
 *
 * ```ts ignore
 * import { existsSync } from "@std/fs/exists";
 *
 * existsSync("./readable_file", { isReadable: true, isFile: true }); // true
 * existsSync("./not_readable_file", { isReadable: true, isFile: true }); // false
 * ```
 */
export function existsSync(
  path: string | URL,
  options?: ExistsOptions,
): boolean {
  try {
    const stat = Deno.statSync(path);
    if (
      options &&
      (options.isReadable || options.isDirectory || options.isFile)
    ) {
      if (options.isDirectory && options.isFile) {
        throw new TypeError(
          "ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together",
        );
      }
      if (
        (options.isDirectory && !stat.isDirectory) ||
        (options.isFile && !stat.isFile)
      ) {
        return false;
      }
      if (options.isReadable) {
        return fileIsReadable(stat);
      }
    }
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      if (
        Deno.permissions.querySync({ name: "read", path }).state === "granted"
      ) {
        // --allow-read not missing
        return !options?.isReadable; // PermissionDenied was raised by file system, so the item exists, but can't be read
      }
    }
    throw error;
  }
}

function fileIsReadable(stat: Deno.FileInfo) {
  if (stat.mode === null) {
    return true; // Exclusive on Non-POSIX systems
  } else if (Deno.uid() === stat.uid) {
    return (stat.mode & 0o400) === 0o400; // User is owner and can read?
  } else if (Deno.gid() === stat.gid) {
    return (stat.mode & 0o040) === 0o040; // User group is owner and can read?
  }
  return (stat.mode & 0o004) === 0o004; // Others can read?
}
