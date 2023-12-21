// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { ALL } from "./constants.ts";
import type { SemVerRange } from "./types.ts";
import {
  CARET_REGEXP,
  STAR_REGEXP,
  TILDE_REGEXP,
  XRANGE_PLAIN,
  XRANGE_REGEXP,
} from "./_shared.ts";
import { parseComparator } from "./parse_comparator.ts";

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
  const groups = comp.match(TILDE_REGEXP)?.groups;
  if (!groups) return comp;
  const { major, minor, patch, prerelease } = groups;
  if (isWildcard(major)) {
    return "";
  } else if (isWildcard(minor)) {
    return `>=${major}.0.0 <${+major + 1}.0.0`;
  } else if (isWildcard(patch)) {
    // ~1.2 == >=1.2.0 <1.3.0
    return `>=${major}.${minor}.0 <${major}.${+minor + 1}.0`;
  } else if (prerelease) {
    return `>=${major}.${minor}.${patch}-${prerelease} <${major}.${
      +minor + 1
    }.0`;
  }
  // ~1.2.3 == >=1.2.3 <1.3.0
  return `>=${major}.${minor}.${patch} <${major}.${+minor + 1}.0`;
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
  const groups = comp.match(CARET_REGEXP)?.groups;
  if (!groups) return comp;
  const { major, minor, patch, prerelease } = groups;

  if (isWildcard(major)) {
    return "";
  } else if (isWildcard(minor)) {
    return `>=${major}.0.0 <${+major + 1}.0.0`;
  } else if (isWildcard(patch)) {
    if (major === `0`) {
      return `>=${major}.${minor}.0 <${major}.${+minor + 1}.0`;
    } else {
      return `>=${major}.${minor}.0 <${+major + 1}.0.0`;
    }
  } else if (prerelease) {
    if (major === "0") {
      if (minor === "0") {
        return `>=${major}.${minor}.${patch}-${prerelease} <${major}.${minor}.${
          +patch + 1
        }`;
      } else {
        return `>=${major}.${minor}.${patch}-${prerelease} <${major}.${
          +minor + 1
        }.0`;
      }
    } else {
      return `>=${major}.${minor}.${patch}-${prerelease} <${+major + 1}.0.0`;
    }
  }
  if (major === "0") {
    if (minor === "0") {
      return `>=${major}.${minor}.${patch} <${major}.${minor}.${+patch + 1}`;
    } else {
      return `>=${major}.${minor}.${patch} <${major}.${+minor + 1}.0`;
    }
  } else {
    return `>=${major}.${minor}.${patch} <${+major + 1}.0.0`;
  }
}

function replaceXRanges(comp: string): string {
  return comp
    .split(/\s+/)
    .map((comp) => replaceXRange(comp))
    .join(" ");
}

function replaceXRange(comp: string): string {
  comp = comp.trim();
  return comp.replace(XRANGE_REGEXP, (ret: string, gtlt, M, m, p, _pr) => {
    const xM: boolean = isWildcard(M);
    const xm: boolean = xM || isWildcard(m);
    const xp: boolean = xm || isWildcard(p);
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

      ret = gtlt + M + `.${m}.${p}`;
    } else if (xm) {
      ret = `>=${M}.0.0 <${+M + 1}.0.0`;
    } else if (xp) {
      ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0`;
    }

    return ret;
  });
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars(comp: string): string {
  return comp.trim().replace(STAR_REGEXP, "");
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 -> >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 -> >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 -> >=1.2.0 <3.5.0
function hyphenReplace(range: string) {
  // convert `1.2.3 - 1.2.4` into `>=1.2.3 <=1.2.4`
  const leftMatch = range.match(new RegExp(`^${XRANGE_PLAIN}`));
  const leftGroup = leftMatch?.groups;
  if (!leftGroup) return range;
  const leftLength = leftMatch[0].length;
  const hyphenMatch = range.slice(leftLength).match(/^\s+-\s+/);
  if (!hyphenMatch) return range;
  const hyphenLength = hyphenMatch[0].length;
  const rightMatch = range.slice(leftLength + hyphenLength).match(
    new RegExp(`^${XRANGE_PLAIN}\\s*$`),
  );
  const rightGroups = rightMatch?.groups;
  if (!rightGroups) return range;
  let from = leftMatch[0];
  let to = rightMatch[0];

  if (isWildcard(leftGroup.major)) {
    from = "";
  } else if (isWildcard(leftGroup.minor)) {
    from = `>=${leftGroup.major}.0.0`;
  } else if (isWildcard(leftGroup.patch)) {
    from = `>=${leftGroup.major}.${leftGroup.minor}.0`;
  } else {
    from = `>=${from}`;
  }

  if (isWildcard(rightGroups.major)) {
    to = "";
  } else if (isWildcard(rightGroups.minor)) {
    to = `<${+rightGroups.major + 1}.0.0`;
  } else if (isWildcard(rightGroups.patch)) {
    to = `<${rightGroups.major}.${+rightGroups.minor + 1}.0`;
  } else if (rightGroups.prerelease) {
    to =
      `<=${rightGroups.major}.${rightGroups.minor}.${rightGroups.patch}-${rightGroups.prerelease}`;
  } else {
    to = `<=${to}`;
  }

  return `${from} ${to}`.trim();
}

function isWildcard(id: string): boolean {
  return !id || id.toLowerCase() === "x" || id === "*";
}

/**
 * Parses a range string into a SemVerRange object or throws a TypeError.
 * @param range The range string
 * @returns A valid semantic version range
 */
export function parseRange(range: string): SemVerRange {
  // handle spaces around and between comparator and version
  range = range.trim().replaceAll(/(?<=<|>|=) /g, "");

  if (range === "") {
    return { ranges: [[ALL]] };
  }

  // Split into groups of comparators, these are considered OR'd together.
  const ranges = range
    .trim()
    .split(/\s*\|\|\s*/)
    .map((range) => {
      range = hyphenReplace(range);
      range = replaceCarets(range);
      range = replaceTildes(range);
      range = replaceXRanges(range);
      range = replaceStars(range);

      // At this point, the range is completely trimmed and
      // ready to be split into comparators.
      // These are considered AND's
      if (range === "") {
        return [ALL];
      } else {
        return range
          .split(" ")
          .filter((r) => r)
          .map((r) => parseComparator(r));
      }
    });

  return { ranges };
}
