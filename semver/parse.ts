import {
  comparatorMax,
  comparatorMin,
  NONE,
  SemVerComparator,
} from "./comparator.ts";
import { SemVerRange } from "./range.ts";
import { ANY, SemVer } from "./semver.ts";
import { Operator } from "./types.ts";
import { isSemVer, isValidNumber, MAX_LENGTH } from "./validity.ts";

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
export function parse(version: string | SemVer): SemVer {
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
  return {
    major,
    minor,
    patch,
    prerelease,
    build,
  };
}

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

/**
 * A tries to parse a valid SemVerRange string or returns undefined
 * @param range The range string
 * @returns A SemVerRange object if valid otherwise `undefined`
 */
export function tryParseRange(
  range: string,
): SemVerRange | undefined {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return parseRange(range);
  } catch {
    return undefined;
  }
}

/**
 * Parses a range string into a SemVerRange object or throws a TypeError.
 * @param range The range string
 * @returns A valid semantic version range
 */
export function parseRange(range: string): SemVerRange {
  range = range.trim();

  // Split into groups of comparators, these are considered OR'd together.
  const ranges = range
    .trim()
    .split(/\s*\|\|\s*/)
    .map((range) => {
      // convert `1.2.3 - 1.2.4` into `>=1.2.3 <=1.2.4`
      const hr: RegExp = re[HYPHENRANGE];
      range = range.replace(hr, hyphenReplace);
      range = replaceCarets(range);
      range = replaceTildes(range);
      range = replaceXRanges(range);
      range = replaceStars(range);

      // At this point, the range is completely trimmed and
      // ready to be split into comparators.
      // These are considered AND's
      return range
        .split(" ")
        .map((r) => parseComparator(r));
    })
    .filter((c) => c && c.length);

  return { ranges };
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
// 1.2 - 3.4.5 -> >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 -> >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 -> >=1.2.0 <3.5.0
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
