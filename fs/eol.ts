// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/** End-of-line character for POSIX platforms such as macOS and Linux. */
export const LF = "\n" as const;

/** End-of-line character for Windows platforms. */
export const CRLF = "\r\n" as const;

/**
 * End-of-line character evaluated for the current platform.
 *
 * @example Usage
 * ```ts ignore
 * import { EOL } from "@std/fs/eol";
 *
 * EOL; // "\n" on POSIX platforms and "\r\n" on Windows
 * ```
 */
export const EOL: "\n" | "\r\n" =
  // deno-lint-ignore no-explicit-any
  (globalThis as any).Deno?.build.os === "windows" ? CRLF : LF;

const regDetect = /(?:\r?\n)/g;

/**
 * Returns the detected EOL character(s) detected in the input string. If no EOL
 * character is detected, `null` is returned.
 *
 * @param content The input string to detect EOL characters.
 *
 * @returns The detected EOL character(s) or `null` if no EOL character is detected.
 *
 * @example Usage
 * ```ts ignore
 * import { detect } from "@std/fs/eol";
 *
 * detect("deno\r\nis not\r\nnode"); // "\r\n"
 * detect("deno\nis not\r\nnode"); // "\r\n"
 * detect("deno\nis not\nnode"); // "\n"
 * detect("deno is not node"); // null
 * ```
 */
export function detect(content: string): typeof EOL | null {
  const d = content.match(regDetect);
  if (!d || d.length === 0) {
    return null;
  }
  const hasCRLF = d.some((x: string): boolean => x === CRLF);

  return hasCRLF ? CRLF : LF;
}

/**
 * Normalize the input string to the targeted EOL.
 *
 * @param content The input string to normalize.
 * @param eol The EOL character(s) to normalize the input string to.
 *
 * @returns The input string normalized to the targeted EOL.
 *
 * @example Usage
 * ```ts ignore
 * import { LF, format } from "@std/fs/eol";
 *
 * const CRLFinput = "deno\r\nis not\r\nnode";
 *
 * format(CRLFinput, LF); // "deno\nis not\nnode"
 * ```
 */
export function format(content: string, eol: typeof EOL): string {
  return content.replace(regDetect, eol);
}
