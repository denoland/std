// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "./types.ts";
import { isSemVer, isValidNumber, MAX_LENGTH } from "./validity.ts";
import { FULL, NUMERICIDENTIFIER, re, src } from "./_shared.ts";

/**
 * Returns the parsed version, or undefined if it's not valid.
 * @param version The version string to parse
 * @returns A valid SemVer or `undefined`
 */
export function tryParse(version?: string): SemVer | undefined {
  if (version == null) {
    return undefined;
  }
  try {
    return parse(version);
  } catch {
    return undefined;
  }
}

/**
 * Attempt to parse a string as a semantic version, returning either a `SemVer`
 * object or throws a TypeError.
 * @param version The version string to parse
 * @returns A valid SemVer
 */
export function parse(version: string | SemVer): SemVer;
/** @deprecated (will be removed after 0.191.0) Use parse(version: string | SemVer) instead. */
export function parse(
  version: string | SemVer | null,
  options?: { includePrerelease: boolean },
): SemVer;
/**
 * Attempt to parse a string as a semantic version, returning either a `SemVer`
 * object or throws a TypeError.
 * @param version The version string to parse
 * @returns A valid SemVer
 */
export function parse(
  version: string | SemVer | null,
  options?: { includePrerelease: boolean },
): SemVer {
  const includePrerelease = options?.includePrerelease ?? true;
  if (typeof version === "object") {
    if (isSemVer(version)) {
      return version;
    } else {
      throw new TypeError(`not a valid SemVer object`);
    }
  }
  if (typeof version !== "string") {
    throw new TypeError(
      `version must be a string`,
    );
  }

  if (version.length > MAX_LENGTH) {
    throw new TypeError(
      `version is longer than ${MAX_LENGTH} characters`,
    );
  }

  version = version.trim();

  const r = re[FULL];
  const m = version.match(r);
  if (!m) {
    throw new TypeError(`Invalid Version: ${version}`);
  }

  // these are actually numbers
  const major = parseInt(m[1]);
  const minor = parseInt(m[2]);
  const patch = parseInt(m[3]);

  if (major > Number.MAX_SAFE_INTEGER || major < 0) {
    throw new TypeError("Invalid major version");
  }

  if (minor > Number.MAX_SAFE_INTEGER || minor < 0) {
    throw new TypeError("Invalid minor version");
  }

  if (patch > Number.MAX_SAFE_INTEGER || patch < 0) {
    throw new TypeError("Invalid patch version");
  }

  // number-ify any prerelease numeric ids
  const numericIdentifier = new RegExp(`^${src[NUMERICIDENTIFIER]}$`);
  const prerelease = (m[4] ?? "")
    .split(".")
    .filter((id) => id)
    .map((id: string) => {
      const num = parseInt(id);
      if (id.match(numericIdentifier) && isValidNumber(num)) {
        return num;
      } else {
        return id;
      }
    });

  const build = m[5]?.split(".")?.filter((m) => m) ?? [];
  if (includePrerelease) {
    return {
      major,
      minor,
      patch,
      prerelease,
      build,
    };
  } else {
    return {
      major,
      minor,
      patch,
      prerelease: [],
      build: [],
    };
  }
}

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/parse_comparator.ts` instead.
   *
   * Parses a comparator string into a valid SemVerComparator.
   * @param comparator
   * @returns A valid SemVerComparator
   */
  parseComparator,
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/parse_comparator.ts` instead.
   *
   * Parses a comparator string into a valid SemVerComparator or returns undefined if not valid.
   * @param comparator
   * @returns A valid SemVerComparator or undefined
   */
  tryParseComparator,
} from "./parse_comparator.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/parse_range.ts` instead.
   *
   * Parses a range string into a SemVerRange object or throws a TypeError.
   * @param range The range string
   * @returns A valid semantic version range
   */
  parseRange,
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/parse_range.ts` instead.
   *
   * A tries to parse a valid SemVerRange string or returns undefined
   * @param range The range string
   * @returns A SemVerRange object if valid otherwise `undefined`
   */
  tryParseRange,
} from "./parse_range.ts";
