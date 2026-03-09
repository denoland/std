// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import type { SemVer } from "./types.ts";
import { parse } from "./parse.ts";

const MAX_SAFE_COMPONENT_LENGTH = 16;

const PRERELEASE_IDENTIFIER = "(?:0|[1-9]\\d*|\\d*[a-zA-Z-][a-zA-Z0-9-]*)";
const PRERELEASE = `(?:-(?<prerelease>${PRERELEASE_IDENTIFIER}(?:\\.${PRERELEASE_IDENTIFIER})*))`;
const BUILD_IDENTIFIER = "[0-9A-Za-z-]+";
const BUILD = `(?:\\+(?<buildmetadata>${BUILD_IDENTIFIER}(?:\\.${BUILD_IDENTIFIER})*))`;

const COERCE_PLAIN =
  `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})` +
  `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
  `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`;

const COERCE_RE = new RegExp(`${COERCE_PLAIN}(?:$|[^\\d])`);
const COERCE_FULL_RE = new RegExp(
  `${COERCE_PLAIN}${PRERELEASE}?${BUILD}?(?:$|[^\\d])`,
);
const COERCE_RTL_RE = new RegExp(COERCE_RE.source, "g");
const COERCE_RTL_FULL_RE = new RegExp(COERCE_FULL_RE.source, "g");

/** Options for {@linkcode coerce}. */
export interface CoerceOptions {
  /**
   * When `true`, the coercion will also include prerelease and build metadata.
   *
   * @default {false}
   */
  includePrerelease?: boolean;
  /**
   * When `true`, the coercion will search from right to left.
   * For example, `coerce("1.2.3.4", { rtl: true })` returns `parse("2.3.4")`
   * instead of `parse("1.2.3")`.
   *
   * @default {false}
   */
  rtl?: boolean;
}

/**
 * Coerces a version string or number into a valid SemVer, or returns
 * `undefined` if no coercible value is found.
 *
 * This is useful for extracting semver-like versions from strings that are
 * not strictly valid semver (e.g., `"v1"` becomes `1.0.0`, `"3.4.5.6"`
 * becomes `3.4.5`).
 *
 * @example Usage
 * ```ts
 * import { coerce } from "@std/semver/coerce";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(coerce("v1"), { major: 1, minor: 0, patch: 0, prerelease: [], build: [] });
 * assertEquals(coerce("42.6.7.9.3-alpha"), { major: 42, minor: 6, patch: 7, prerelease: [], build: [] });
 * assertEquals(coerce("invalid"), undefined);
 * ```
 *
 * @param version The value to coerce into a SemVer.
 * @param options Options for coercion.
 * @returns A valid SemVer, or `undefined` if the value cannot be coerced.
 */
export function coerce(
  version: string | number,
  options?: CoerceOptions,
): SemVer | undefined {
  if (typeof version === "number") {
    version = String(version);
  }

  if (typeof version !== "string") {
    return;
  }

  const includePrerelease = options?.includePrerelease ?? false;

  let match: RegExpExecArray | null = null;

  if (!options?.rtl) {
    match = version.match(
      includePrerelease ? COERCE_FULL_RE : COERCE_RE,
    ) as RegExpExecArray | null;
  } else {
    const coerceRtlRegex = includePrerelease
      ? COERCE_RTL_FULL_RE
      : COERCE_RTL_RE;
    let next: RegExpExecArray | null;
    while (
      (next = coerceRtlRegex.exec(version)) &&
      (!match || match.index + match[0].length !== version.length)
    ) {
      if (
        !match ||
        next.index + next[0].length !== match.index + match[0].length
      ) {
        match = next;
      }
      coerceRtlRegex.lastIndex = next.index + next[1]!.length + next[2]!.length;
    }
    coerceRtlRegex.lastIndex = -1;
  }

  if (match === null) {
    return;
  }

  const major = match[2]!;
  const minor = match[3] ?? "0";
  const patch = match[4] ?? "0";
  const prerelease = includePrerelease && match[5] ? `-${match[5]}` : "";
  const build = includePrerelease && match[6] ? `+${match[6]}` : "";

  try {
    return parse(`${major}.${minor}.${patch}${prerelease}${build}`);
  } catch {}
}
