// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeFs, getNodeOs, getNodePath, isDeno } from "./_utils.ts";
import type { MakeTempOptions } from "./unstable_types.ts";
import { mapError } from "./_map_error.ts";

/**
 * Creates a new temporary directory in the default directory for temporary
 * files, unless `dir` is specified. Other optional options include
 * prefixing and suffixing the directory name with `prefix` and `suffix`
 * respectively.
 *
 * This call resolves to the full path to the newly created directory.
 *
 * Multiple programs calling this function simultaneously will create different
 * directories. It is the caller's responsibility to remove the directory when
 * no longer needed.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { makeTempDir } from "@std/unstable-make-temp-dir";
 * const tempDirName0 = await makeTempDir();  // e.g. /tmp/2894ea76
 * const tempDirName1 = await makeTempDir({ prefix: 'my_temp' }); // e.g. /tmp/my_temp339c944d
 * ```
 *
 * @tags allow-write
 *
 * @param options The options specified when creating a temporary directory.
 * @returns A promise that resolves to a path to the temporary directory.
 */
export async function makeTempDir(options?: MakeTempOptions): Promise<string> {
  if (isDeno) {
    return Deno.makeTempDir({ ...options });
  } else {
    const {
      dir = undefined,
      prefix = undefined,
      suffix = undefined,
    } = options ?? {};

    try {
      const { mkdtemp, rename } = getNodeFs().promises;
      const { tmpdir } = getNodeOs();
      const { join, sep } = getNodePath();

      if (!options) {
        return await mkdtemp(join(tmpdir(), sep));
      }

      let prependPath = tmpdir();
      if (dir != null) {
        prependPath = typeof dir === "string" ? dir : ".";
        if (prependPath === "") {
          prependPath = ".";
        }
      }

      if (prefix != null && typeof prefix === "string") {
        prependPath = join(prependPath, prefix || sep);
      } else {
        prependPath = join(prependPath, sep);
      }

      if (suffix != null && typeof suffix === "string") {
        const tempPath = await mkdtemp(prependPath);
        const combinedTempPath = "".concat(tempPath, suffix);
        await rename(tempPath, combinedTempPath);
        return combinedTempPath;
      }

      return await mkdtemp(prependPath);
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously creates a new temporary directory in the default directory
 * for temporary files, unless `dir` is specified. Other optional options
 * include prefixing and suffixing the directory name with `prefix` and
 * `suffix` respectively.
 *
 * The full path to the newly created directory is returned.
 *
 * Multiple programs calling this function simultaneously will create different
 * directories. It is the caller's responsibility to remove the directory when
 * no longer needed.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { makeTempDirSync } from "@std/fs/unstable-make-temp-dir";
 * const tempDirName0 = makeTempDirSync();  // e.g. /tmp/2894ea76
 * const tempDirName1 = makeTempDirSync({ prefix: 'my_temp' });  // e.g. /tmp/my_temp339c944d
 * ```
 *
 * @tags allow-write
 *
 * @param options The options specified when creating a temporary directory.
 * @returns The path of the temporary directory.
 */
export function makeTempDirSync(options?: MakeTempOptions): string {
  if (isDeno) {
    return Deno.makeTempDirSync({ ...options });
  } else {
    const {
      dir = undefined,
      prefix = undefined,
      suffix = undefined,
    } = options ?? {};

    try {
      const { mkdtempSync, renameSync } = getNodeFs();
      const { tmpdir } = getNodeOs();
      const { join, sep } = getNodePath();

      if (!options) {
        return mkdtempSync(join(tmpdir(), sep));
      }

      let prependPath = tmpdir();
      if (dir != null) {
        prependPath = typeof dir === "string" ? dir : ".";
        if (prependPath === "") {
          prependPath = ".";
        }
      }

      if (prefix != null && typeof prefix === "string") {
        prependPath = join(prependPath, prefix || sep);
      } else {
        prependPath = join(prependPath, sep);
      }

      if (suffix != null && typeof prefix === "string") {
        const tempPath = mkdtempSync(prependPath);
        const combinedTempPath = "".concat(tempPath, suffix);
        renameSync(tempPath, combinedTempPath);
        return combinedTempPath;
      }

      return mkdtempSync(prependPath);
    } catch (error) {
      throw mapError(error);
    }
  }
}
