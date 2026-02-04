// Copyright 2018-2026 the Deno authors. MIT license.
import { dirname } from "@std/path/dirname";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { toPathString } from "./_to_path_string.ts";

/**
 * Asynchronously ensures that the hard link exists.
 *
 * If the parent directories for the hard link do not exist, they are created.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file path as a string or URL. Directory hard links are
 * not allowed.
 * @param dest The destination link path as a string or URL.
 *
 * @returns A void promise that resolves once the hard link exists.
 *
 * @example Usage
 * ```ts ignore
 * import { ensureLink } from "@std/fs/ensure-link";
 *
 * await ensureLink("./folder/targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export async function ensureLink(src: string | URL, dest: string | URL) {
  dest = toPathString(dest);
  await ensureDir(dirname(dest));

  await Deno.link(toPathString(src), dest);
}

/**
 * Synchronously ensures that the hard link exists.
 *
 * If the parent directories for the hard link do not exist, they are created.
 *
 * Requires `--allow-read` and `--allow-write` permissions.
 *
 * @see {@link https://docs.deno.com/runtime/manual/basics/permissions#file-system-access}
 * for more information on Deno's permissions system.
 *
 * @param src The source file path as a string or URL. Directory hard links are
 * not allowed.
 * @param dest The destination link path as a string or URL.
 *
 * @returns A void value that returns once the hard link exists.
 *
 * @example Usage
 * ```ts ignore
 * import { ensureLinkSync } from "@std/fs/ensure-link";
 *
 * ensureLinkSync("./folder/targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export function ensureLinkSync(src: string | URL, dest: string | URL) {
  dest = toPathString(dest);
  ensureDirSync(dirname(dest));

  Deno.linkSync(toPathString(src), dest);
}
