// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import {
  comparatorMax,
  comparatorMin,
  NONE,
  SemVerComparator,
} from "./comparator.ts";
import { parse } from "./parse.ts";
import { ANY } from "./semver.ts";
import { Operator } from "./types.ts";

// The actual regexps
const re: RegExp[] = [];
const src: string[] = [];
let R = 0;

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

const NUMERICIDENTIFIER: number = R++;
src[NUMERICIDENTIFIER] = "0|[1-9]\\d*";

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

const NONNUMERICIDENTIFIER: number = R++;
src[NONNUMERICIDENTIFIER] = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";

// ## Main Version
// Three dot-separated numeric identifiers.

const MAINVERSION: number = R++;
const nid = src[NUMERICIDENTIFIER];
src[MAINVERSION] = `(${nid})\\.(${nid})\\.(${nid})`;

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

const PRERELEASEIDENTIFIER: number = R++;
src[PRERELEASEIDENTIFIER] = "(?:" + src[NUMERICIDENTIFIER] + "|" +
  src[NONNUMERICIDENTIFIER] + ")";

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

const PRERELEASE: number = R++;
src[PRERELEASE] = "(?:-(" +
  src[PRERELEASEIDENTIFIER] +
  "(?:\\." +
  src[PRERELEASEIDENTIFIER] +
  ")*))";

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

const BUILDIDENTIFIER: number = R++;
src[BUILDIDENTIFIER] = "[0-9A-Za-z-]+";

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

const BUILD: number = R++;
src[BUILD] = "(?:\\+(" + src[BUILDIDENTIFIER] + "(?:\\." +
  src[BUILDIDENTIFIER] + ")*))";

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

const FULL: number = R++;
const FULLPLAIN = "v?" + src[MAINVERSION] + src[PRERELEASE] + "?" + src[BUILD] +
  "?";

src[FULL] = "^" + FULLPLAIN + "$";

const GTLT: number = R++;
src[GTLT] = "((?:<|>)?=?)";

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
const XRANGEIDENTIFIER: number = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + "|x|X|\\*";

const XRANGEPLAIN: number = R++;
src[XRANGEPLAIN] = "[v=\\s]*(" +
  src[XRANGEIDENTIFIER] +
  ")" +
  "(?:\\.(" +
  src[XRANGEIDENTIFIER] +
  ")" +
  "(?:\\.(" +
  src[XRANGEIDENTIFIER] +
  ")" +
  "(?:" +
  src[PRERELEASE] +
  ")?" +
  src[BUILD] +
  "?" +
  ")?)?";

const XRANGE: number = R++;
src[XRANGE] = "^" + src[GTLT] + "\\s*" + src[XRANGEPLAIN] + "$";

// Tilde ranges.
// Meaning is "reasonably at or greater than"
const LONETILDE: number = R++;
src[LONETILDE] = "(?:~>?)";

const TILDE: number = R++;
src[TILDE] = "^" + src[LONETILDE] + src[XRANGEPLAIN] + "$";

// Caret ranges.
// Meaning is "at least and backwards compatible with"
const LONECARET: number = R++;
src[LONECARET] = "(?:\\^)";

const CARET: number = R++;
src[CARET] = "^" + src[LONECARET] + src[XRANGEPLAIN] + "$";

// A simple gt/lt/eq thing, or just "" to indicate "any version"
const COMPARATOR: number = R++;
src[COMPARATOR] = "^" + src[GTLT] + "\\s*(" + FULLPLAIN + ")$|^$";

// Something like `1.2.3 - 1.2.4`
const HYPHENRANGE: number = R++;
src[HYPHENRANGE] = "^\\s*(" +
  src[XRANGEPLAIN] +
  ")" +
  "\\s+-\\s+" +
  "(" +
  src[XRANGEPLAIN] +
  ")" +
  "\\s*$";

// Star ranges basically just allow anything at all.
const STAR: number = R++;
src[STAR] = "(<|>)?=?\\s*\\*";

/**
 * Parses a comparator string into a valid SemVerComparator or returns undefined if not valid.
 * @param comparator
 * @returns A valid SemVerComparator or undefined
 */
export function tryParseComparator(
  comparator: string,
): SemVerComparator | undefined {
  try {
    return parseComparator(comparator);
  } catch {
    return undefined;
  }
}

/**
 * Parses a comparator string into a valid SemVerComparator.
 * @param comparator
 * @returns A valid SemVerComparator
 */
export function parseComparator(comparator: string): SemVerComparator {
  const r = re[COMPARATOR];
  const m = comparator.match(r);

  if (!m) {
    return NONE;
  }

  const operator = (m[1] ?? "") as Operator;
  const semver = m[2] ? parse(m[2]) : ANY;
  const min = comparatorMin(semver, operator);
  const max = comparatorMax(semver, operator);
  return {
    operator,
    semver,
    min,
    max,
  };
}
