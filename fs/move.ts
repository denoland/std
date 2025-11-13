// Copyright 2018-2025 the Deno authors. MIT license.
import { isSubdir } from "./_is_subdir.ts";
import { isSamePath } from "./_is_same_path.ts";

/** Options for {@linkcode move} and {@linkcode moveSync}. */
export interface MoveOptions {
  /**
   * Whether the destination file should be overwritten if it already exists.
   *
   * @default {false}
   */
  overwrite?: boolean;
}

/**
 * Asynchronously moves a file or directory (along with its contents).
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file or directory as a string or URL.
 * @param dest The destination file or directory as a string or URL.
 * @param options Options for the move operation.
 * @throws {Deno.errors.AlreadyExists} If `dest` already exists and
 * `options.overwrite` is `false`.
 * @throws {Deno.errors.NotSupported} If `src` is a sub-directory of `dest`.
 *
 * @returns A void promise that resolves once the operation completes.
 *
 * @example Basic usage
 * ```ts ignore
 * import { move } from "@std/fs/move";
 *
 * await move("./foo", "./bar");
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting
 * ```ts ignore
 * import { move } from "@std/fs/move";
 *
 * await move("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar`, overwriting
 * `./bar` if it already exists.
 */
export async function move(
  src: string | URL,
  dest: string | URL,
  options?: MoveOptions,
): Promise<void> {
  const { overwrite = false } = options ?? {};

  const srcStat = await Deno.stat(src);

  if (
    srcStat.isDirectory &&
    (isSubdir(src, dest) || isSamePath(src, dest))
  ) {
    throw new Deno.errors.NotSupported(
      `Cannot move '${src}' to a subdirectory of itself, '${dest}'.`,
    );
  }

  if (overwrite) {
    if (isSamePath(src, dest)) return;
    try {
      await Deno.remove(dest, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  } else {
    const EXISTS_ERROR = new Deno.errors.AlreadyExists("dest already exists.");
    try {
      await Deno.lstat(dest);
      return Promise.reject(EXISTS_ERROR);
    } catch {
      // Do nothing...
    }
  }

  await Deno.rename(src, dest);
}

/**
 * Synchronously moves a file or directory (along with its contents).
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file or directory as a string or URL.
 * @param dest The destination file or directory as a string or URL.
 * @param options Options for the move operation.
 * @throws {Deno.errors.AlreadyExists} If `dest` already exists and
 * `options.overwrite` is `false`.
 * @throws {Deno.errors.NotSupported} If `src` is a sub-directory of `dest`.
 *
 * @returns A void value that returns once the operation completes.
 *
 * @example Basic usage
 * ```ts ignore
 * import { moveSync } from "@std/fs/move";
 *
 * moveSync("./foo", "./bar");
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting
 * ```ts ignore
 * import { moveSync } from "@std/fs/move";
 *
 * moveSync("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar`, overwriting
 * `./bar` if it already exists.
 */
export function moveSync(
  src: string | URL,
  dest: string | URL,
  options?: MoveOptions,
): void {
  const { overwrite = false } = options ?? {};

  const srcStat = Deno.statSync(src);

  if (
    srcStat.isDirectory &&
    (isSubdir(src, dest) || isSamePath(src, dest))
  ) {
    throw new Deno.errors.NotSupported(
      `Cannot move '${src}' to a subdirectory of itself, '${dest}'.`,
    );
  }

  if (overwrite) {
    if (isSamePath(src, dest)) return;
    try {
      Deno.removeSync(dest, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  } else {
    const EXISTS_ERROR = new Deno.errors.AlreadyExists("dest already exists.");
    try {
      Deno.lstatSync(dest);
      throw EXISTS_ERROR;
    } catch (error) {
      if (error === EXISTS_ERROR) {
        throw error;
      }
    }
  }

  Deno.renameSync(src, dest);
}
