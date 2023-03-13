// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * The semantic version parser.
 *
 * Adapted directly from [semver](https://github.com/npm/node-semver).
 *
 * ## Versions
 *
 * A "version" is described by the `v2.0.0` specification found at
 * <https://semver.org>.
 *
 * A leading `"="` or `"v"` character is stripped off and ignored.
 *
 * ## Ranges
 *
 * A `version range` is a set of `comparators` which specify versions that satisfy
 * the range.
 *
 * A `comparator` is composed of an `operator` and a `version`. The set of
 * primitive `operators` is:
 *
 * - `<` Less than
 * - `<=` Less than or equal to
 * - `>` Greater than
 * - `>=` Greater than or equal to
 * - `=` Equal. If no operator is specified, then equality is assumed, so this
 *   operator is optional, but MAY be included.
 *
 * For example, the comparator `>=1.2.7` would match the versions `1.2.7`, `1.2.8`,
 * `2.5.3`, and `1.3.9`, but not the versions `1.2.6` or `1.1.0`.
 *
 * Comparators can be joined by whitespace to form a `comparator set`, which is
 * satisfied by the **intersection** of all of the comparators it includes.
 *
 * A range is composed of one or more comparator sets, joined by `||`. A version
 * matches a range if and only if every comparator in at least one of the
 * `||`-separated comparator sets is satisfied by the version.
 *
 * For example, the range `>=1.2.7 <1.3.0` would match the versions `1.2.7`,
 * `1.2.8`, and `1.2.99`, but not the versions `1.2.6`, `1.3.0`, or `1.1.0`.
 *
 * The range `1.2.7 || >=1.2.9 <2.0.0` would match the versions `1.2.7`, `1.2.9`,
 * and `1.4.6`, but not the versions `1.2.8` or `2.0.0`.
 *
 * ### Prerelease Tags
 *
 * If a version has a prerelease tag (for example, `1.2.3-alpha.3`) then it will
 * only be allowed to satisfy comparator sets if at least one comparator with the
 * same `[major, minor, patch]` tuple also has a prerelease tag.
 *
 * For example, the range `>1.2.3-alpha.3` would be allowed to match the version
 * `1.2.3-alpha.7`, but it would _not_ be satisfied by `3.4.5-alpha.9`, even though
 * `3.4.5-alpha.9` is technically "greater than" `1.2.3-alpha.3` according to the
 * SemVer sort rules. The version range only accepts prerelease tags on the `1.2.3`
 * version. The version `3.4.5` _would_ satisfy the range, because it does not have
 * a prerelease flag, and `3.4.5` is greater than `1.2.3-alpha.7`.
 *
 * The purpose for this behavior is twofold. First, prerelease versions frequently
 * are updated very quickly, and contain many breaking changes that are (by the
 * author"s design) not yet fit for public consumption. Therefore, by default, they
 * are excluded from range matching semantics.
 *
 * Second, a user who has opted into using a prerelease version has clearly
 * indicated the intent to use _that specific_ set of alpha/beta/rc versions. By
 * including a prerelease tag in the range, the user is indicating that they are
 * aware of the risk. However, it is still not appropriate to assume that they have
 * opted into taking a similar risk on the _next_ set of prerelease versions.
 *
 * Note that this behavior can be suppressed (treating all prerelease versions as
 * if they were normal versions, for the purpose of range matching) by setting the
 * `includePrerelease` flag on the options object to any [functions](#functions)
 * that do range matching.
 *
 * #### Prerelease Identifiers
 *
 * The method `.increment` takes an additional `identifier` string argument that
 * will append the value of the string as a prerelease identifier:
 *
 * ```javascript
 * semver.increment("1.2.3", "prerelease", "beta");
 * // "1.2.4-beta.0"
 * ```
 *
 * ### Build Metadata
 *
 * Build metadata has no affect on comparisons and must be a `.` delimited
 * alpha-numeric string. When parsing a version it is retained on the `build: string[]` field
 * of the semver instance. When incrementing there is an additional parameter that
 * can set the build metadata on the semver instance.
 *
 * To print the full version including build metadata you must call `semver.format({ style: "full" })`.
 *
 * For compatibility reasons the `.version` field will not contain the build metadata, you can only
 * get a full version string by calling the format function.
 *
 * ### Advanced Range Syntax
 *
 * Advanced range syntax desugars to primitive comparators in deterministic ways.
 *
 * Advanced ranges may be combined in the same way as primitive comparators using
 * white space or `||`.
 *
 * #### Hyphen Ranges `X.Y.Z - A.B.C`
 *
 * Specifies an inclusive set.
 *
 * - `1.2.3 - 2.3.4` := `>=1.2.3 <=2.3.4`
 *
 * If a partial version is provided as the first version in the inclusive range,
 * then the missing pieces are replaced with zeroes.
 *
 * - `1.2 - 2.3.4` := `>=1.2.0 <=2.3.4`
 *
 * If a partial version is provided as the second version in the inclusive range,
 * then all versions that start with the supplied parts of the tuple are accepted,
 * but nothing that would be greater than the provided tuple parts.
 *
 * - `1.2.3 - 2.3` := `>=1.2.3 <2.4.0`
 * - `1.2.3 - 2` := `>=1.2.3 <3.0.0`
 *
 * #### X-Ranges `1.2.x` `1.X` `1.2.*` `*`
 *
 * Any of `X`, `x`, or `*` may be used to "stand in" for one of the numeric values
 * in the `[major, minor, patch]` tuple.
 *
 * - `*` := `>=0.0.0` (Any version satisfies)
 * - `1.x` := `>=1.0.0 <2.0.0` (Matching major version)
 * - `1.2.x` := `>=1.2.0 <1.3.0` (Matching major and minor versions)
 *
 * A partial version range is treated as an X-Range, so the special character is in
 * fact optional.
 *
 * - `""` (empty string) := `*` := `>=0.0.0`
 * - `1` := `1.x.x` := `>=1.0.0 <2.0.0`
 * - `1.2` := `1.2.x` := `>=1.2.0 <1.3.0`
 *
 * #### Tilde Ranges `~1.2.3` `~1.2` `~1`
 *
 * Allows patch-level changes if a minor version is specified on the comparator.
 * Allows minor-level changes if not.
 *
 * - `~1.2.3` := `>=1.2.3 <1.(2+1).0` := `>=1.2.3 <1.3.0`
 * - `~1.2` := `>=1.2.0 <1.(2+1).0` := `>=1.2.0 <1.3.0` (Same as `1.2.x`)
 * - `~1` := `>=1.0.0 <(1+1).0.0` := `>=1.0.0 <2.0.0` (Same as `1.x`)
 * - `~0.2.3` := `>=0.2.3 <0.(2+1).0` := `>=0.2.3 <0.3.0`
 * - `~0.2` := `>=0.2.0 <0.(2+1).0` := `>=0.2.0 <0.3.0` (Same as `0.2.x`)
 * - `~0` := `>=0.0.0 <(0+1).0.0` := `>=0.0.0 <1.0.0` (Same as `0.x`)
 * - `~1.2.3-beta.2` := `>=1.2.3-beta.2 <1.3.0` Note that prereleases in the
 *   `1.2.3` version will be allowed, if they are greater than or equal to
 *   `beta.2`. So, `1.2.3-beta.4` would be allowed, but `1.2.4-beta.2` would not,
 *   because it is a prerelease of a different `[major, minor, patch]` tuple.
 *
 * #### Caret Ranges `^1.2.3` `^0.2.5` `^0.0.4`
 *
 * Allows changes that do not modify the left-most non-zero element in the
 * `[major, minor, patch]` tuple. In other words, this allows patch and minor
 * updates for versions `1.0.0` and above, patch updates for versions
 * `0.X >=0.1.0`, and _no_ updates for versions `0.0.X`.
 *
 * Many authors treat a `0.x` version as if the `x` were the major
 * "breaking-change" indicator.
 *
 * Caret ranges are ideal when an author may make breaking changes between `0.2.4`
 * and `0.3.0` releases, which is a common practice. However, it presumes that
 * there will _not_ be breaking changes between `0.2.4` and `0.2.5`. It allows for
 * changes that are presumed to be additive (but non-breaking), according to
 * commonly observed practices.
 *
 * - `^1.2.3` := `>=1.2.3 <2.0.0`
 * - `^0.2.3` := `>=0.2.3 <0.3.0`
 * - `^0.0.3` := `>=0.0.3 <0.0.4`
 * - `^1.2.3-beta.2` := `>=1.2.3-beta.2 <2.0.0` Note that prereleases in the
 *   `1.2.3` version will be allowed, if they are greater than or equal to
 *   `beta.2`. So, `1.2.3-beta.4` would be allowed, but `1.2.4-beta.2` would not,
 *   because it is a prerelease of a different `[major, minor, patch]` tuple.
 * - `^0.0.3-beta` := `>=0.0.3-beta <0.0.4` Note that prereleases in the `0.0.3`
 *   version _only_ will be allowed, if they are greater than or equal to `beta`.
 *   So, `0.0.3-pr.2` would be allowed.
 *
 * When parsing caret ranges, a missing `patch` value desugars to the number `0`,
 * but will allow flexibility within that value, even if the major and minor
 * versions are both `0`.
 *
 * - `^1.2.x` := `>=1.2.0 <2.0.0`
 * - `^0.0.x` := `>=0.0.0 <0.1.0`
 * - `^0.0` := `>=0.0.0 <0.1.0`
 *
 * A missing `minor` and `patch` values will desugar to zero, but also allow
 * flexibility within those values, even if the major version is zero.
 *
 * - `^1.x` := `>=1.0.0 <2.0.0`
 * - `^0.x` := `>=0.0.0 <1.0.0`
 *
 * ### Range Grammar
 *
 * Putting all this together, here is a Backus-Naur grammar for ranges, for the
 * benefit of parser authors:
 *
 * ```bnf
 * range-set  ::= range ( logical-or range ) *
 * logical-or ::= ( " " ) * "||" ( " " ) *
 * range      ::= hyphen | simple ( " " simple ) * | ""
 * hyphen     ::= partial " - " partial
 * simple     ::= primitive | partial | tilde | caret
 * primitive  ::= ( "<" | ">" | ">=" | "<=" | "=" ) partial
 * partial    ::= xr ( "." xr ( "." xr qualifier ? )? )?
 * xr         ::= "x" | "X" | "*" | nr
 * nr         ::= "0" | ["1"-"9"] ( ["0"-"9"] ) *
 * tilde      ::= "~" partial
 * caret      ::= "^" partial
 * qualifier  ::= ( "-" pre )? ( "+" build )?
 * pre        ::= parts
 * build      ::= parts
 * parts      ::= part ( "." part ) *
 * part       ::= nr | [-0-9A-Za-z]+
 * ```
 *
 * Note that, since ranges may be non-contiguous, a version might not be greater
 * than a range, less than a range, _or_ satisfy a range! For example, the range
 * `1.2 <1.2.9 || >2.0.0` would have a hole from `1.2.9` until `2.0.0`, so the
 * version `1.2.10` would not be greater than the range (because `2.0.1` satisfies,
 * which is higher), nor less than the range (since `1.2.8` satisfies, which is
 * lower), and it also does not satisfy the range.
 *
 * If you want to know if a version satisfies or does not satisfy a range, use the
 * {@linkcode satisfies} function.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import * as semver from "https://deno.land/std@$STD_VERSION/semver/mod.ts";
 *
 * semver.valid("1.2.3"); // "1.2.3"
 * semver.valid("a.b.c"); // null
 * semver.satisfies("1.2.3", "1.x || >=2.5.0 || 5.0.0 - 7.2.3"); // true
 * semver.gt("1.2.3", "9.8.7"); // false
 * semver.lt("1.2.3", "9.8.7"); // true
 * semver.minVersion(">=1.0.0"); // "1.0.0"
 * ```
 *
 * @module
 */

export type ReleaseType =
  | "pre"
  | "major"
  | "premajor"
  | "minor"
  | "preminor"
  | "patch"
  | "prepatch"
  | "prerelease";

export type Operator =
  | ""
  | "="
  | "=="
  | "==="
  | "!=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<=";

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: ReadonlyArray<string | number>;
  build: ReadonlyArray<string>;
}

const MAX: SemVer = {
  major: Number.POSITIVE_INFINITY,
  minor: Number.POSITIVE_INFINITY,
  patch: Number.POSITIVE_INFINITY,
  prerelease: [],
  build: [],
};

const MIN: SemVer = {
  major: 0,
  minor: 0,
  patch: 0,
  prerelease: [],
  build: [],
};

const MAX_LENGTH = 256;

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

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (let i = 0; i < R; i++) {
  if (!re[i]) {
    re[i] = new RegExp(src[i]);
  }
}

export class Comparator {
  constructor(
    public readonly operator: Operator,
    public readonly semver: SemVer,
  ) {
  }

  /**
   * The minimum version that could match this comparator.
   * @returns the version, the next patch version or 0.0.0
   */
  public min(): SemVer {
    switch (this.operator) {
      case ">":
        return {
          major: this.semver.major,
          minor: this.semver.minor,
          patch: this.semver.patch + 1,
          prerelease: [],
          build: [],
        };
      case "!=":
      case "!==":
      case "<=":
      case "<":
        return MIN;
      case ">=":
      case "":
      case "=":
      case "==":
      case "===":
        return this.semver;
    }
  }

  /**
   * The maximum version that could match this comparator.
   * @returns the version, any version, the next smallest patch version
   */
  public max(): SemVer {
    switch (this.operator) {
      case "!=":
      case "!==":
      case ">":
      case ">=":
        return MAX;
      case "":
      case "=":
      case "==":
      case "===":
      case "<=":
        return this.semver;
      case "<": {
        const patch = this.semver.patch - 1;
        const minor = patch >= 0 ? this.semver.minor : this.semver.minor - 1;
        const major = minor >= 0 ? this.semver.major : 0;
        return {
          major,
          minor: minor >= 0 ? minor : Number.POSITIVE_INFINITY,
          patch: patch >= 0 ? patch : Number.POSITIVE_INFINITY,
          prerelease: [],
          build: [],
        };
      }
    }
  }

  public test(version: SemVer): boolean {
    return cmp(version, this.operator, this.semver);
  }

  /**
   * Returns true if the range of possible versions intersects with the other comparators set of possible versions
   * @param comp The other comparator whose range of versions will be checked for intersection
   * @returns True if the range of possible versions of both comparators intersects
   */
  public intersects(comp: Comparator): boolean {
    const l0 = this.min();
    const l1 = this.max();
    const r0 = comp.min();
    const r1 = comp.max();

    // We calculate the min and max ranges of both comparators.
    // The minimum min is 0.0.0, the maximum max is ANY.
    //
    // Comparators with equality operators have the same min and max.
    //
    // We then check to see if the min's of either range falls within the span of the other range.
    //
    // A couple of intersection examples:
    // ```
    // l0 ---- l1
    //     r0 ---- r1
    // ```
    // ```
    //     l0 ---- l1
    // r0 ---- r1
    // ```
    // ```
    // l0 ------ l1
    //    r0--r1
    // ```
    //
    // non-intersection example
    // ```
    // l0 -- l1
    //          r0 -- r1
    // ```
    return true &&
      gte(l0, r0) && lte(l0, r1) ||
      gte(r0, l0) && lte(r0, l1);
  }

  public toString(): string {
    return `${this.operator}${format(this.semver)}`;
  }
}

export class Range {
  constructor(
    public readonly min: SemVer,
    public readonly max: SemVer,
  ) {
  }

  public test(version: SemVer): boolean {
    return gte(version, this.min) && lte(version, this.max);
  }

  public intersects(range: Range): boolean {
    return true &&
      gte(this.min, range.min) && lte(this.min, range.max) ||
      gte(range.min, this.min) && lte(range.min, this.max);
  }

  toString(): string {
    return `${format(this.min)}-${format(this.max)}}`;
  }
}

/**
 * Attempt to parse a string as a semantic version, returning either a `SemVer`
 * object or `null`.
 */
export function parse(version: string): SemVer {
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
  const prerelease = (m[4] ?? [])
    .split(".")
    .map((id: string) => {
      const num = parseInt(id);
      if (isNaN(num)) {
        return id;
      } else {
        if (num > Number.MAX_SAFE_INTEGER || num < 0) {
          throw new TypeError("Invalid prerelease version");
        }
        return num;
      }
    });

  const build = parseBuild(m[5]);
  return {
    major,
    minor,
    patch,
    prerelease,
    build,
  };
}

function formatNumber(value: number) {
  return value === Number.POSITIVE_INFINITY ||
    value === Number.NEGATIVE_INFINITY
    ? "*"
    : `${value.toFixed(0)}`;
}

/**
 * Format a SemVer object into a string.
 *
 * If major, minor or patch version are NaN then a TypeError will be thrown.
 *
 * If major, minor or patch are positive or negative infinity then '*' will be printed instead.
 *
 * @param semver The semantic version to format
 * @returns The string representation of a smenatic version.
 */
export function format(semver: SemVer) {
  const major = formatNumber(semver.major);
  const minor = formatNumber(semver.minor);
  const patch = formatNumber(semver.patch);
  const pre = semver.prerelease.join(".");
  const build = semver.build.join(".");

  const primary = `${major}.${minor}.${patch}`;
  const release = [primary, pre].join("-");
  const full = [release, build].join("+");

  if (isNaN(semver.major) || isNaN(semver.minor) || isNaN(semver.patch)) {
    throw new TypeError(`Invalid Semver: ${full}`);
  }
  //           ┌───── full
  //       ┌───┴───┐
  //       ├───────── release
  //   ┌───┴───┐   │
  //   ├───────────── primary
  // ┌─┴─┐     │   │
  // 1.2.3-pre.1+b.1
  // │ │ │ └─┬─┘ └┬┘
  // │ │ │   │    └── build
  // │ │ │   └─────── pre
  // │ │ └─────────── patch
  // │ └───────────── minor
  // └─────────────── major
  return full;
}

function isValidNumber(value: number) {
  return true &&
    !isNaN(value) &&
    value !== Number.POSITIVE_INFINITY &&
    value !== Number.NEGATIVE_INFINITY &&
    value < Number.MAX_SAFE_INTEGER &&
    value >= 0;
}

function isValidString(value: string) {
  return value.length > 0 && value.length <= MAX_LENGTH &&
    value.match(/[0-9A-Za-z-]+/);
}

/**
 * Returns true if the value is a valid version and adds a Type Assertion
 */
export function isValid(value: SemVer | undefined | null): value is SemVer {
  const { major, minor, patch, build, prerelease } = value ?? {};
  return (
    typeof major === "number" && isValidNumber(major) &&
    typeof minor === "number" && isValidNumber(minor) &&
    typeof patch === "number" && isValidNumber(patch) &&
    Array.isArray(prerelease) &&
    Array.isArray(build) &&
    !prerelease.some((v) => v == null) &&
    !prerelease.filter((v) => typeof v === "string").some((v) =>
      !isValidString(v)
    ) &&
    !prerelease.filter((v) => typeof v === "number").some((v) =>
      !isValidNumber(v)
    ) &&
    !build.some((v) => typeof v !== "string" && isValidString(v))
  );
}

/** Returns the parsed version, or undefined if it's not valid. */
export function valid(
  version: string | undefined | null,
): SemVer | undefined {
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
 * Returns the version incremented by the release type
 * (major, minor, patch, or prerelease), or null if it's not valid.
 *
 * `premajor` in one call will bump the version up to the next major version and
 * down to a prerelease of that major version. `preminor`, and `prepatch` work
 * the same way.
 *
 * If called from a non-prerelease version, the `prerelease` will work the same
 * as `prepatch`. It increments the patch version, then makes a prerelease. If
 * the input version is already a prerelease it simply increments it.
 *
 * If the original version has build metadata and the `metadata` parameter is
 * `undefined`, then it will be unchanged.
 */
export function increment(
  version: SemVer,
  release: ReleaseType,
  identifier?: string,
  metadata?: string,
): SemVer {
  switch (release) {
    case "premajor":
      return {
        major: version.major + 1,
        minor: 0,
        patch: 0,
        prerelease: pre(version.prerelease, identifier),
        build: parseBuild(metadata),
      };
    case "preminor":
      return {
        major: version.major,
        minor: version.minor + 1,
        patch: 0,
        prerelease: pre(version.prerelease, identifier),
        build: parseBuild(metadata),
      };
    case "prepatch":
      return {
        major: version.major,
        minor: version.minor,
        patch: version.patch + 1,
        prerelease: pre(version.prerelease, identifier),
        build: parseBuild(metadata),
      };
    // If the input is a non-prerelease version, this acts the same as
    // prepatch.
    case "prerelease":
      if (version.prerelease.length === 0) {
        return {
          major: version.major,
          minor: version.minor,
          patch: version.patch + 1,
          prerelease: pre(version.prerelease, identifier),
          build: parseBuild(metadata),
        };
      } else {
        return {
          major: version.major,
          minor: version.minor,
          patch: version.patch,
          prerelease: pre(version.prerelease, identifier),
          build: parseBuild(metadata),
        };
      }
    case "major":
      // If this is a pre-major version, bump up to the same major version.
      // Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      if (
        version.minor !== 0 ||
        version.patch !== 0 ||
        version.prerelease.length === 0
      ) {
        return {
          major: version.major + 1,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: parseBuild(metadata),
        };
      } else {
        return {
          major: version.major,
          minor: 0,
          patch: 0,
          prerelease: [],
          build: parseBuild(metadata),
        };
      }
    case "minor":
      // If this is a pre-minor version, bump up to the same minor version.
      // Otherwise increment minor.
      // 1.2.0-5 bumps to 1.2.0
      // 1.2.1 bumps to 1.3.0
      if (
        version.patch !== 0 ||
        version.prerelease.length === 0
      ) {
        return {
          major: version.major,
          minor: version.minor + 1,
          patch: 0,
          prerelease: [],
          build: parseBuild(metadata),
        };
      } else {
        return {
          major: version.major,
          minor: version.minor,
          patch: 0,
          prerelease: [],
          build: parseBuild(metadata),
        };
      }
    case "patch":
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (version.prerelease.length === 0) {
        return {
          major: version.major,
          minor: version.minor,
          patch: version.patch + 1,
          prerelease: [],
          build: parseBuild(metadata),
        };
      } else {
        return {
          major: version.major,
          minor: version.minor,
          patch: version.patch,
          prerelease: [],
          build: parseBuild(metadata),
        };
      }
    // 1.0.0 "pre" would become 1.0.0-0
    // 1.0.0-0 would become 1.0.0-1
    // 1.0.0-beta.0 would be come 1.0.0-beta.1
    // switching the pre identifier resets the number to 0
    case "pre":
      return {
        major: version.major,
        minor: version.minor,
        patch: version.patch,
        prerelease: pre(version.prerelease, identifier),
        build: parseBuild(metadata),
      };
    default:
      throw new Error(`invalid increment argument: ${release}`);
  }
}

function pre(
  prerelease: ReadonlyArray<string | number>,
  identifier: string | undefined,
) {
  let values = [...prerelease];

  // In reality this will either be 0, 1 or 2 entries.
  let i: number = values.length;
  while (--i >= 0) {
    if (typeof values[i] === "number") {
      // deno-fmt-ignore
      (values[i] as number)++;
      i = -2;
    }
  }

  if (i === -1) {
    // didn't increment anything
    values.push(0);
  }

  if (identifier) {
    // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
    // 1.2.0-beta.foobar or 1.2.0-beta bumps to 1.2.0-beta.0
    if (values[0] === identifier) {
      if (isNaN(values[1] as number)) {
        values = [identifier, 0];
      }
    } else {
      values = [identifier, 0];
    }
  }
  return values;
}

function parseBuild(metadata: string | undefined) {
  return (metadata ?? "").split(".");
}

/**
 * Returns difference between two versions by the release type  (`major`,
 * `premajor`, `minor`, `preminor`, `patch`, `prepatch`, or `prerelease`), or
 * null if the versions are the same.
 */
export function difference(
  v1: SemVer,
  v2: SemVer,
): ReleaseType | undefined {
  if (eq(v1, v2)) {
    return undefined;
  } else {
    let prefix = "";
    let defaultResult: ReleaseType | undefined = undefined;
    if (v1 && v2) {
      if (v1.prerelease.length || v2.prerelease.length) {
        prefix = "pre";
        defaultResult = "prerelease";
      }

      for (const key in v1) {
        if (key === "major" || key === "minor" || key === "patch") {
          if (v1[key] !== v2[key]) {
            return (prefix + key) as ReleaseType;
          }
        }
      }
    }
    return defaultResult; // may be undefined
  }
}

export function compareNumber(
  a: number,
  b: number,
): 1 | 0 | -1 {
  if (isNaN(a) || isNaN(b)) {
    throw new Error("Comparison against non-numbers");
  }

  return a === b ? 0 : a < b ? -1 : 1;
}

export function rcompareNumber(
  a: number,
  b: number,
): 1 | 0 | -1 {
  return compareNumber(b, a);
}

/**
 * Returns `0` if `v1 == v2`, or `1` if `v1` is greater, or `-1` if `v2` is
 * greater. Sorts in ascending order if passed to `Array.sort()`,
 */
export function compare(
  v1: SemVer,
  v2: SemVer,
): 1 | 0 | -1 {
  return (
    compareNumber(v1.major, v2.major) ||
    compareNumber(v1.minor, v2.minor) ||
    compareNumber(v1.patch, v2.patch) ||
    compareIdentifier(v1.prerelease, v2.prerelease) ||
    compareIdentifier(v1.build, v2.build)
  );
}

export function compareIdentifier(
  v1: ReadonlyArray<string | number>,
  v2: ReadonlyArray<string | number>,
): 1 | 0 | -1 {
  // NOT having a prerelease is > having one
  if (v1.length && !v2.length) {
    return -1;
  } else if (!v1.length && v2.length) {
    return 1;
  } else if (!v1.length && !v2.length) {
    return 0;
  }

  let i = 0;
  do {
    const a = v1[i];
    const b = v2[i];
    if (a === undefined && b === undefined) {
      // same length is equal
      return 0;
    } else if (b === undefined) {
      // longer > shorter
      return 1;
    } else if (a === undefined) {
      // shorter < longer
      return -1;
    } else if (typeof a === "string" && typeof b === "number") {
      // string < number
      return -1;
    } else if (typeof a === "number" && typeof b === "string") {
      // number > string
      return 1;
    } else if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      // If they're equal, continue comparing segments.
      continue;
    }
  } while (++i);

  // It can't ever reach here, but typescript doesn't realize that so
  // add this line so the return type is inferred correctly.
  return 0;
}

/**
 * Returns `0` if `v1 == v2`, or `-1` if `v1` is greater, or `1` if `v2` is
 * greater. Sorts in descending order if passed to `Array.sort()`,
 */
export function rcompare(
  v1: SemVer,
  v2: SemVer,
): 1 | 0 | -1 {
  return compare(v2, v1);
}

export function sort<T extends SemVer>(
  list: T[],
): T[] {
  return list.sort((a, b) => {
    return compare(a, b);
  });
}

export function rsort<T extends SemVer>(
  list: T[],
): T[] {
  return list.sort((a, b) => compare(b, a));
}

/** Greater than comparison */
export function gt(
  v1: SemVer,
  v2: SemVer,
): boolean {
  return compare(v1, v2) > 0;
}

/** Less than comparison */
export function lt(
  v1: SemVer,
  v2: SemVer,
): boolean {
  return compare(v1, v2) < 0;
}

/**
 * This is true if they're logically equivalent, even if they're not the exact
 * same string.
 */
export function eq(
  v1: SemVer,
  v2: SemVer,
): boolean {
  return compare(v1, v2) === 0;
}

/**
 * This is true if they're not logically equivalent, even if they're the exact
 * same string.
 */
export function neq(
  v1: SemVer,
  v2: SemVer,
): boolean {
  return compare(v1, v2) !== 0;
}

/** Greater than or equal comparison */
export function gte(
  v1: SemVer,
  v2: SemVer,
): boolean {
  return compare(v1, v2) >= 0;
}

/** Less than or equal comparison */
export function lte(
  v1: SemVer,
  v2: SemVer,
): boolean {
  return compare(v1, v2) <= 0;
}

/**
 * Pass in a comparison string, and it'll call the corresponding comparison
 * function. `"==="` and `"!=="` do simple string comparison, but are included
 * for completeness. Throws if an invalid comparison string is provided.
 */
export function cmp(
  v1: SemVer,
  operator: Operator,
  v2: SemVer,
): boolean {
  switch (operator) {
    case "":
    case "=":
    case "==":
    case "===":
      return eq(v1, v2);

    case "!=":
    case "!==":
      return neq(v1, v2);

    case ">":
      return gt(v1, v2);

    case ">=":
      return gte(v1, v2);

    case "<":
      return lt(v1, v2);

    case "<=":
      return lte(v1, v2);

    default:
      throw new TypeError(`Invalid operator: ${operator}`);
  }
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
export function parseComparator(comp: string): Comparator {
  comp = replaceCarets(comp);
  comp = replaceTildes(comp);
  comp = replaceXRanges(comp);
  comp = replaceStars(comp);

  const r = re[COMPARATOR];
  const m = comp.match(r);

  if (!m) {
    throw new TypeError(`Invalid comparator: ${comp}`);
  }

  const operator = (m[1] ?? "") as Operator;
  const semver = !m[2] ? MIN : parse(m[2]);
  return new Comparator(
    operator,
    semver,
  );
}

export function parseRange(range: string): Range {
  range = range.trim();
  // convert `1.2.3 - 1.2.4` into `>=1.2.3 <=1.2.4`
  const hr: RegExp = re[HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);

  // normalize spaces
  range = range.replace(/\s+/g, " ");

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.
  const [l, r] = range
    .split(" ")
    .map((comp) => parseComparator(comp));

  return new Range(l.min(), r.max());
}

function isX(id: string): boolean {
  return !id || id.toLowerCase() === "x" || id === "*";
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes(comp: string): string {
  return comp
    .trim()
    .split(/\s+/)
    .map((comp) => replaceTilde(comp))
    .join(" ");
}

function replaceTilde(comp: string): string {
  const r: RegExp = re[TILDE];
  return comp.replace(
    r,
    (_: string, M: string, m: string, p: string, pr: string) => {
      let ret: string;

      if (isX(M)) {
        ret = "";
      } else if (isX(m)) {
        ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
      } else if (isX(p)) {
        // ~1.2 == >=1.2.0 <1.3.0
        ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
      } else if (pr) {
        ret = ">=" +
          M +
          "." +
          m +
          "." +
          p +
          "-" +
          pr +
          " <" +
          M +
          "." +
          (+m + 1) +
          ".0";
      } else {
        // ~1.2.3 == >=1.2.3 <1.3.0
        ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
      }

      return ret;
    },
  );
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets(comp: string): string {
  return comp
    .trim()
    .split(/\s+/)
    .map((comp) => replaceCaret(comp))
    .join(" ");
}

function replaceCaret(comp: string): string {
  const r: RegExp = re[CARET];
  return comp.replace(r, (_: string, M, m, p, pr) => {
    let ret: string;

    if (isX(M)) {
      ret = "";
    } else if (isX(m)) {
      ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
    } else if (isX(p)) {
      if (M === "0") {
        ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
      } else {
        ret = ">=" + M + "." + m + ".0 <" + (+M + 1) + ".0.0";
      }
    } else if (pr) {
      if (M === "0") {
        if (m === "0") {
          ret = ">=" +
            M +
            "." +
            m +
            "." +
            p +
            "-" +
            pr +
            " <" +
            M +
            "." +
            m +
            "." +
            (+p + 1);
        } else {
          ret = ">=" +
            M +
            "." +
            m +
            "." +
            p +
            "-" +
            pr +
            " <" +
            M +
            "." +
            (+m + 1) +
            ".0";
        }
      } else {
        ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + (+M + 1) +
          ".0.0";
      }
    } else {
      if (M === "0") {
        if (m === "0") {
          ret = ">=" + M + "." + m + "." + p + " <" + M + "." + m + "." +
            (+p + 1);
        } else {
          ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
        }
      } else {
        ret = ">=" + M + "." + m + "." + p + " <" + (+M + 1) + ".0.0";
      }
    }

    return ret;
  });
}

function replaceXRanges(comp: string): string {
  return comp
    .split(/\s+/)
    .map((comp) => replaceXRange(comp))
    .join(" ");
}

function replaceXRange(comp: string): string {
  comp = comp.trim();
  const r: RegExp = re[XRANGE];
  return comp.replace(r, (ret: string, gtlt, M, m, p, _pr) => {
    const xM: boolean = isX(M);
    const xm: boolean = xM || isX(m);
    const xp: boolean = xm || isX(p);
    const anyX: boolean = xp;

    if (gtlt === "=" && anyX) {
      gtlt = "";
    }

    if (xM) {
      if (gtlt === ">" || gtlt === "<") {
        // nothing is allowed
        ret = "<0.0.0";
      } else {
        // nothing is forbidden
        ret = "*";
      }
    } else if (gtlt && anyX) {
      // we know patch is an x, because we have any x at all.
      // replace X with 0
      if (xm) {
        m = 0;
      }
      p = 0;

      if (gtlt === ">") {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        // >1.2.3 => >= 1.2.4
        gtlt = ">=";
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === "<=") {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = "<";
        if (xm) {
          M = +M + 1;
        } else {
          m = +m + 1;
        }
      }

      ret = gtlt + M + "." + m + "." + p;
    } else if (xm) {
      ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
    } else if (xp) {
      ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
    }

    return ret;
  });
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars(comp: string): string {
  return comp.trim().replace(re[STAR], "");
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace(
  _$0: string,
  from: string,
  fM: string,
  fm: string,
  fp: string,
  _fpr: string,
  _fb: string,
  to: string,
  tM: string,
  tm: string,
  tp: string,
  tpr: string,
  _tb: string,
) {
  if (isX(fM)) {
    from = "";
  } else if (isX(fm)) {
    from = ">=" + fM + ".0.0";
  } else if (isX(fp)) {
    from = ">=" + fM + "." + fm + ".0";
  } else {
    from = ">=" + from;
  }

  if (isX(tM)) {
    to = "";
  } else if (isX(tm)) {
    to = "<" + (+tM + 1) + ".0.0";
  } else if (isX(tp)) {
    to = "<" + tM + "." + (+tm + 1) + ".0";
  } else if (tpr) {
    to = "<=" + tM + "." + tm + "." + tp + "-" + tpr;
  } else {
    to = "<=" + to;
  }

  return (from + " " + to).trim();
}

/** Returns true if the version satisfies the range. */
export function satisfies(
  version: SemVer,
  range: Range,
): boolean {
  return range.test(version);
}

/**
 * Returns the highest version in the list that satisfies the range, or `null`
 * if none of them do.
 */
export function maxSatisfying(
  versions: SemVer[],
  range: Range,
): SemVer | undefined {
  const satisfying = versions.filter((v) => range.test(v));
  const sorted = sort(satisfying);
  return sorted[-1];
}

/**
 * Returns the lowest version in the list that satisfies the range, or `null` if
 * none of them do.
 */
export function minSatisfying(
  versions: SemVer[],
  range: Range,
): SemVer | undefined {
  const satisfying = versions.filter((v) => range.test(v));
  const sorted = sort(satisfying);
  return sorted[0];
}

/** Returns the valid range or null if it's not valid. */
export function validRange(
  range: string,
): Range | undefined {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return parseRange(range);
  } catch {
    return undefined;
  }
}

/**
 * Returns true if version is less than all the versions possible in the range.
 */
export function ltr(
  version: SemVer,
  range: Range,
): boolean {
  return outside(version, range, "<");
}

/**
 * Returns true if version is greater than all the versions possible in the range.
 */
export function gtr(
  version: SemVer,
  range: Range,
): boolean {
  return outside(version, range, ">");
}

/**
 * Returns true if the version is outside the bounds of the range in either the
 * high or low direction. The hilo argument must be either the string '>' or
 * '<'. (This is the function called by {@linkcode gtr} and {@linkcode ltr}.)
 */
export function outside(
  version: SemVer,
  range: Range,
  hilo?: ">" | "<",
): boolean {
  switch (hilo) {
    case ">":
      return gt(version, range.max);
    case "<":
      return lt(version, range.min);
    default:
      return gt(version, range.max) || lt(version, range.min);
  }
}

/** Returns true if the two supplied ranges or comparators intersect. */
export function intersects(
  range1: Range,
  range2: Range,
): boolean {
  return range1.intersects(range2);
}
