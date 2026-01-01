// Copyright 2018-2026 the Deno authors. MIT license.
import { getFileInfoType } from "./_get_file_info_type.ts";

/**
 * Asynchronously ensures that the directory exists, like
 * {@linkcode https://www.ibm.com/docs/en/aix/7.3?topic=m-mkdir-command#mkdir__row-d3e133766 | mkdir -p}.
 *
 * If the directory already exists, this function does nothing. If the directory
 * does not exist, it is created.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param dir The path of the directory to ensure, as a string or URL.
 *
 * @returns A promise that resolves once the directory exists.
 *
 * @example Usage
 * ```ts ignore
 * import { ensureDir } from "@std/fs/ensure-dir";
 *
 * await ensureDir("./bar");
 * ```
 */
export async function ensureDir(dir: string | URL) {
  try {
    const fileInfo = await Deno.stat(dir);
    throwIfNotDirectory(fileInfo);
    return;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  // The dir doesn't exist. Create it.
  // This can be racy. So we catch AlreadyExists and check stat again.
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }

    const fileInfo = await Deno.stat(dir);
    throwIfNotDirectory(fileInfo);
  }
}

/**
 * Synchronously ensures that the directory exists, like
 * {@linkcode https://www.ibm.com/docs/en/aix/7.3?topic=m-mkdir-command#mkdir__row-d3e133766 | mkdir -p}.
 *
 * If the directory already exists, this function does nothing. If the directory
 * does not exist, it is created.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param dir The path of the directory to ensure, as a string or URL.
 *
 * @returns A void value that returns once the directory exists.
 *
 * @example Usage
 * ```ts ignore
 * import { ensureDirSync } from "@std/fs/ensure-dir";
 *
 * ensureDirSync("./bar");
 * ```
 */
export function ensureDirSync(dir: string | URL) {
  try {
    const fileInfo = Deno.statSync(dir);
    throwIfNotDirectory(fileInfo);
    return;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  // The dir doesn't exist. Create it.
  // This can be racy. So we catch AlreadyExists and check stat again.
  try {
    Deno.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }

    const fileInfo = Deno.statSync(dir);
    throwIfNotDirectory(fileInfo);
  }
}

function throwIfNotDirectory(fileInfo: Deno.FileInfo) {
  if (!fileInfo.isDirectory) {
    throw new Error(
      `Failed to ensure directory exists: expected 'dir', got '${
        getFileInfoType(fileInfo)
      }'`,
    );
  }
}
