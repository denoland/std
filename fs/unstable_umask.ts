// Copyright 2018-2026 the Deno authors. MIT license.

import { mapError } from "./_map_error.ts";
import { getNodeProcess, isDeno } from "./_utils.ts";

/** Retrieve the process umask.  If `mask` is provided, sets the process umask.
 * This call always returns what the umask was before the call.
 * @example Usage
 *
 * ```ts ignore
 * import { assert } from "@std/assert";
 * import { umask } from "@std/fs/unstable-umask";
 *
 * const prevUmaskValue = Deno.umask(0o077);
 * const currentUmaskValue = Deno.umask();
 * assert(prevUmaskValue !== currentUmaskValue)
 * ```
 *
 * This API is under consideration to determine if permissions are required to
 * call it.
 *
 * *Note*: This API is not implemented on Windows
 *
 * @category File System
 * @param mask The new process mask
 * @returns The previous mask
 */
export function umask(mask?: number): number {
  if (isDeno) {
    return Deno.umask(mask);
  } else {
    try {
      return getNodeProcess().umask(mask);
    } catch (error) {
      throw mapError(error);
    }
  }
}
