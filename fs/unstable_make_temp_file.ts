// Copyright 2018-2026 the Deno authors. MIT license.

import { getNodeOs, getNodePath, isDeno, randomId } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import type { MakeTempOptions } from "./unstable_types.ts";
import {
  writeTextFile,
  writeTextFileSync,
} from "./unstable_write_text_file.ts";

/**
 * Creates a new temporary file in the default directory for temporary files,
 * unless `dir` is specified.
 *
 * Other options include prefixing and suffixing the directory name with
 * `prefix` and `suffix` respectively.
 *
 * This call resolves to the full path to the newly created file.
 *
 * Multiple programs calling this function simultaneously will create different
 * files. It is the caller's responsibility to remove the file when no longer
 * needed.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { makeTempFile } from "@std/fs/unstable-make-temp-file";
 * const tmpFileName0 = await makeTempFile();  // e.g. /tmp/419e0bf2
 * const tmpFileName1 = await makeTempFile({ prefix: 'my_temp' });  // e.g. /tmp/my_temp754d3098
 * ```
 *
 * @tags allow-write
 *
 * @param options The options specified when creating a temporary file.
 * @returns A Promise that resolves to a file path to the temporary file.
 */
export async function makeTempFile(options?: MakeTempOptions): Promise<string> {
  if (isDeno) {
    return Deno.makeTempFile({ ...options });
  } else {
    const {
      dir,
      prefix,
      suffix,
    } = options ?? {};
    try {
      const { tmpdir } = getNodeOs();
      const { join } = getNodePath();

      let tempFilePath;
      if (!options) {
        tempFilePath = join(tmpdir(), randomId());
        await writeTextFile(tempFilePath, "", { mode: 0o600 });
        return tempFilePath;
      }

      tempFilePath = tmpdir();
      if (dir != null) {
        tempFilePath = typeof dir === "string" ? dir : ".";
        if (tempFilePath === "") {
          tempFilePath = ".";
        }
      }

      if (prefix != null && typeof prefix === "string") {
        tempFilePath = join(tempFilePath, prefix + randomId());
      } else {
        tempFilePath = join(tempFilePath, randomId());
      }

      if (suffix != null && typeof suffix === "string") {
        tempFilePath += suffix;
      }

      await writeTextFile(tempFilePath, "", { mode: 0o600 });
      return tempFilePath;
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously creates a new temporary file in the default directory for
 * temporary files, unless `dir` is specified.
 *
 * Other options include prefixing and suffixing the directory name with
 * `prefix` and `suffix` respectively.
 *
 * The full path to the newly created file is returned.
 *
 * Multiple programs calling this function simultaneously will create different
 * files. It is the caller's responsibility to remove the file when no longer
 * needed.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { makeTempFileSync } from "@std/fs/unstable-make-temp-file";
 * const tempFileName0 = makeTempFileSync(); // e.g. /tmp/419e0bf2
 * const tempFileName1 = makeTempFileSync({ prefix: 'my_temp' });  // e.g. /tmp/my_temp754d3098
 * ```
 *
 * @tags allow-write
 *
 * @param options The options specified when creating a temporary file.
 * @returns The file path to the temporary file.
 */
export function makeTempFileSync(options?: MakeTempOptions): string {
  if (isDeno) {
    return Deno.makeTempFileSync({ ...options });
  } else {
    const {
      dir,
      prefix,
      suffix,
    } = options ?? {};

    try {
      const { tmpdir } = getNodeOs();
      const { join } = getNodePath();

      let tempFilePath;
      if (!options) {
        tempFilePath = join(tmpdir(), randomId());
        writeTextFileSync(tempFilePath, "", { mode: 0o600 });
        return tempFilePath;
      }

      tempFilePath = tmpdir();
      if (dir != null) {
        tempFilePath = typeof dir === "string" ? dir : ".";
        if (tempFilePath === "") {
          tempFilePath = ".";
        }
      }

      if (prefix != null && typeof prefix === "string") {
        tempFilePath = join(tempFilePath, prefix + randomId());
      } else {
        tempFilePath = join(tempFilePath, randomId());
      }

      if (suffix != null && typeof suffix === "string") {
        tempFilePath += suffix;
      }

      writeTextFileSync(tempFilePath, "", { mode: 0o600 });
      return tempFilePath;
    } catch (error) {
      throw mapError(error);
    }
  }
}
