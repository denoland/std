// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { ALL } from "./constants.ts";
import type { SemVerRange } from "./types.ts";
import {
  HYPHENRANGE_REGEXP,
  OPERATOR_REGEXP,
  STAR_REGEXP,
  XRANGE_REGEXP,
} from "./_shared.ts";
import { parseComparator } from "./parse_comparator.ts";

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceCaret(
  groups: { major: string; minor: string; patch: string; prerelease: string[] },
) {
  const { major, minor, patch, prerelease } = groups;

  if (isX(major)) {
    return "";
  } else if (isX(minor)) {
    return ">=" + major + ".0.0 <" + (+major + 1) + ".0.0";
  } else if (isX(patch)) {
    // ~1.2 == >=1.2.0 <1.3.0
    return ">=" + major + "." + minor + ".0 <" + major + "." +
      (+minor + 1) +
      ".0";
  } else if (prerelease) {
    return ">=" +
      major +
      "." +
      minor +
      "." +
      patch +
      "-" +
      prerelease +
      " <" +
      major +
      "." +
      (+minor + 1) +
      ".0";
  }
  // ~1.2.3 == >=1.2.3 <1.3.0
  return ">=" + major + "." + minor + "." + patch + " <" + major + "." +
    (+minor + 1) + ".0";
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceTile(
  groups: { major: string; minor: string; patch: string; prerelease: string[] },
) {
  const {
    major,
    minor,
    patch,
    prerelease,
  } = groups;

  if (isX(major)) {
    return "";
  } else if (isX(minor)) {
    return ">=" + major + ".0.0 <" + (+major + 1) + ".0.0";
  } else if (isX(patch)) {
    if (major === "0") {
      return ">=" + major + "." + minor + ".0 <" + major + "." +
        (+minor + 1) +
        ".0";
    } else {
      return ">=" + major + "." + minor + ".0 <" + (+major + 1) +
        ".0.0";
    }
  } else if (prerelease) {
    if (major === "0") {
      if (minor === "0") {
        return ">=" +
          major +
          "." +
          minor +
          "." +
          patch +
          "-" +
          prerelease +
          " <" +
          major +
          "." +
          minor +
          "." +
          (+patch + 1);
      } else {
        return ">=" +
          major +
          "." +
          minor +
          "." +
          patch +
          "-" +
          prerelease +
          " <" +
          major +
          "." +
          (+minor + 1) +
          ".0";
      }
    } else {
      return ">=" + major + "." + minor + "." + patch + "-" +
        prerelease +
        " <" +
        (+major + 1) +
        ".0.0";
    }
  } else {
    if (major === "0") {
      if (minor === "0") {
        return ">=" + major + "." + minor + "." + patch + " <" + major +
          "." +
          minor + "." +
          (+patch + 1);
      } else {
        return ">=" + major + "." + minor + "." + patch + " <" + major +
          "." +
          (+minor + 1) + ".0";
      }
    } else {
      return ">=" + major + "." + minor + "." + patch + " <" +
        (+major + 1) +
        ".0.0";
    }
  }
}

function replaceOperators(comp: string) {
  return comp
    .trim()
    .split(/\s+/)
    .map((comp) => {
      const groups = OPERATOR_REGEXP.exec(comp)?.groups as unknown as {
        operator: string;
        major: string;
        minor: string;
        patch: string;
        prerelease: string[];
      };
      if (!groups) return comp;
      switch (groups.operator) {
        case "~":
        case "~>":
          return replaceCaret(groups);
        case "^":
          return replaceTile(groups);
      }
    })
    .join(" ");
}

function replaceXRanges(comp: string): string {
  return comp
    .split(/\s+/)
    .map((comp) => replaceXRange(comp))
    .join(" ");
}

function replaceXRange(comp: string): string {
  comp = comp.trim();
  const groups = XRANGE_REGEXP.exec(comp)?.groups;
  if (!groups) return comp;
  let { operator } = groups;
  const xM: boolean = isX(groups.major);
  const xm: boolean = xM || isX(groups.minor);
  const xp: boolean = xm || isX(groups.patch);

  let major = +groups.major;
  let minor = +groups.minor;
  let patch = +groups.patch;

  const anyX: boolean = xp;

  if (operator === "=" && anyX) {
    operator = "";
  }

  if (xM) {
    if (operator === ">" || operator === "<") {
      // nothing is allowed
      return "<0.0.0";
    } else {
      // nothing is forbidden
      return "*";
    }
  } else if (operator && anyX) {
    // we know patch is an x, because we have any x at all.
    // replace X with 0
    if (xm) {
      minor = 0;
    }
    patch = 0;

    if (operator === ">") {
      // >1 => >=2.0.0
      // >1.2 => >=1.3.0
      // >1.2.3 => >= 1.2.4
      operator = ">=";
      if (xm) {
        major = +major + 1;
        minor = 0;
        patch = 0;
      } else {
        minor = +minor + 1;
        patch = 0;
      }
    } else if (operator === "<=") {
      // <=0.7.x is actually <0.8.0, since any 0.7.x should
      // pass.  Similarly, <=7.x is actually <8.0.0, etc.
      operator = "<";
      if (xm) {
        major = +major + 1;
      } else {
        minor = +minor + 1;
      }
    }

    return operator + major + "." + minor + "." + patch;
  } else if (xm) {
    return ">=" + major + ".0.0 <" + (+major + 1) + ".0.0";
  } else if (xp) {
    return ">=" + major + "." + minor + ".0 <" + major + "." + (+minor + 1) +
      ".0";
  }
  return comp;
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

function isX(id: string): boolean {
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
      // convert `1.2.3 - 1.2.4` into `>=1.2.3 <=1.2.4`
      const hr: RegExp = HYPHENRANGE_REGEXP;
      range = range.replace(hr, hyphenReplace);
      range = replaceOperators(range);
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
