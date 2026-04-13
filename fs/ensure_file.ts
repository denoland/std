// Copyright 2018-2026 the Deno authors. MIT license.
import { dirname } from "@std/path/dirname";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { getFileInfoType } from "./_get_file_info_type.ts";
import { toPathString } from "./_to_path_string.ts";

/**
 * Asynchronously ensures that the file exists.
 *
 * If the file already exists, this function does nothing. If the parent
 * directories for the file do not exist, they are created.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param filePath The path of the file to ensure, as a string or URL.
 *
 * @returns A void promise that resolves once the file exists.
 *
 * @example Usage
 * ```ts ignore
 * import { ensureFile } from "@std/fs/ensure-file";
 *
 * await ensureFile("./folder/targetFile.dat");
 * ```
 */
export async function ensureFile(filePath: string | URL): Promise<void> {
  try {
    // if file exists
    const stat = await Deno.lstat(filePath);
    if (!stat.isFile) {
      throw new Error(
        `Failed to ensure file exists: expected 'file', got '${
          getFileInfoType(stat)
        }'`,
      );
    }
  } catch (err) {
    // if file not exists
    if (err instanceof Deno.errors.NotFound) {
      // ensure dir exists
      await ensureDir(dirname(toPathString(filePath)));
      // create file
      await Deno.writeFile(filePath, new Uint8Array());
      return;
    }

    throw err;
  }
}

/**
 * Synchronously ensures that the file exists.
 *
 * If the file already exists, this function does nothing. If the parent
 * directories for the file do not exist, they are created.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param filePath The path of the file to ensure, as a string or URL.
 *
 * @returns A void value that returns once the file exists.
 *
 * @example Usage
 * ```ts ignore
 * import { ensureFileSync } from "@std/fs/ensure-file";
 *
 * ensureFileSync("./folder/targetFile.dat");
 * ```
 */
export function ensureFileSync(filePath: string | URL): void {
  try {
    // if file exists
    const stat = Deno.lstatSync(filePath);
    if (!stat.isFile) {
      throw new Error(
        `Failed to ensure file exists: expected 'file', got '${
          getFileInfoType(stat)
        }'`,
      );
    }
  } catch (err) {
    // if file not exists
    if (err instanceof Deno.errors.NotFound) {
      // ensure dir exists
      ensureDirSync(dirname(toPathString(filePath)));
      // create file
      Deno.writeFileSync(filePath, new Uint8Array());
      return;
    }
    throw err;
  }
}
