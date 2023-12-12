// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { ALL } from "./constants.ts";
import type { SemVerRange } from "./types.ts";
import { OPERATOR_REGEXP, SEMVER_REGEXP } from "./_shared.ts";
import { parseComparator } from "./parse_comparator.ts";

interface OperatorVersion {
  operator: string;
  major: number | string;
  minor: number | string;
  patch: number | string;
  prerelease?: string;
}
function stringify(version: OperatorVersion) {
  return `${version.operator}${version.major}.${version.minor}.${version.patch}${
    version.prerelease ? `-${version.prerelease}` : ""
  }`;
}

function stringifyRange(min: OperatorVersion, max: OperatorVersion) {
  return `${stringify(min)} ${stringify(max)}`;
}
// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceCaret(
  groups: { major: string; minor: string; patch: string; prerelease?: string },
) {
  const { major, minor, patch, prerelease } = groups;

  if (isX(major)) {
    return "";
  } else if (isX(minor)) {
    return stringifyRange({
      operator: ">=",
      major,
      minor: 0,
      patch: 0,
    }, {
      operator: "<",
      major: +major + 1,
      minor: 0,
      patch: 0,
    });
  } else if (isX(patch)) {
    // ~1.2 == >=1.2.0 <1.3.0
    return stringifyRange({
      operator: ">=",
      major,
      minor,
      patch: 0,
    }, {
      operator: "<",
      major: major,
      minor: +minor + 1,
      patch: 0,
    });
  }
  // ~1.2.3 == >=1.2.3 <1.3.0
  return stringifyRange({
    operator: ">=",
    major,
    minor,
    patch,
    prerelease,
  }, {
    operator: "<",
    major: major,
    minor: +minor + 1,
    patch: 0,
  });
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceTile(
  groups: { major: string; minor: string; patch: string; prerelease?: string },
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
    return stringifyRange({
      operator: ">=",
      major,
      minor: 0,
      patch: 0,
    }, {
      operator: "<",
      major: +major + 1,
      minor: 0,
      patch: 0,
    });
  } else if (isX(patch)) {
    if (major === "0") {
      return stringifyRange({
        operator: ">=",
        major,
        minor,
        patch: 0,
      }, {
        operator: "<",
        major,
        minor: +minor + 1,
        patch: 0,
      });
    } else {
      return stringifyRange({
        operator: ">=",
        major,
        minor,
        patch: 0,
      }, {
        operator: "<",
        major: +major + 1,
        minor: 0,
        patch: 0,
      });
    }
  } else if (prerelease) {
    if (major === "0") {
      if (minor === "0") {
        return stringifyRange({
          operator: ">=",
          major,
          minor,
          patch,
          prerelease,
        }, {
          operator: "<",
          major: major,
          minor,
          patch: +patch + 1,
        });
      } else {
        return stringifyRange({
          operator: ">=",
          major,
          minor,
          patch,
          prerelease,
        }, {
          operator: "<",
          major: major,
          minor: +minor + 1,
          patch: 0,
        });
      }
    } else {
      return stringifyRange({
        operator: ">=",
        major,
        minor,
        patch,
        prerelease,
      }, {
        operator: "<",
        major: +major + 1,
        minor: 0,
        patch: 0,
      });
    }
  } else {
    if (major === "0") {
      if (minor === "0") {
        return stringifyRange({
          operator: ">=",
          major,
          minor,
          patch,
          prerelease,
        }, {
          operator: "<",
          major,
          minor,
          patch: +patch + 1,
        });
      } else {
        return stringifyRange({
          operator: ">=",
          major,
          minor,
          patch,
          prerelease,
        }, {
          operator: "<",
          major,
          minor: +minor + 1,
          patch: 0,
        });
      }
    } else {
      return stringifyRange({
        operator: ">=",
        major,
        minor,
        patch,
        prerelease,
      }, {
        operator: "<",
        major: +major + 1,
        minor: 0,
        patch: 0,
      });
    }
  }
}

function replaceXRange(
  groups: {
    operator: string;
    major: string;
    minor: string;
    patch: string;
    prerelease?: string;
  },
) {
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
      return stringify({ operator: "<", major: 0, minor: 0, patch: 0 });
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
    return stringify({ operator, major, minor, patch });
  } else if (xm) {
    return stringifyRange({ operator: ">=", major, minor: 0, patch: 0 }, {
      operator: "<",
      major: +major + 1,
      minor: 0,
      patch: 0,
    });
  } else if (xp) {
    return stringifyRange({ operator: ">=", major, minor, patch: 0 }, {
      operator: "<",
      major: major,
      minor: +minor + 1,
      patch: 0,
    });
  }
  return stringify(groups);
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 -> >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 -> >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 -> >=1.2.0 <3.5.0
function replaceHyphen(range: string) {
  const fromMatch = SEMVER_REGEXP.exec(range);
  if (fromMatch) {
    const hypthenIndex = fromMatch[0].length;
    const hyphenMatch = /^\s*\-\s*/.exec(range.slice(hypthenIndex));
    if (hyphenMatch) {
      const toMatch = SEMVER_REGEXP.exec(
        range.slice(hypthenIndex + hyphenMatch[0].length),
      );
      if (toMatch) {
        let from = fromMatch[0];
        let to = toMatch[0];
        const fromGroups = fromMatch.groups!;
        const toGroups = toMatch.groups!;

        if (isX(fromGroups.major)) {
          from = "";
        } else if (isX(fromGroups.minor)) {
          from = stringify({
            operator: ">=",
            major: fromGroups.major,
            minor: 0,
            patch: 0,
          });
        } else if (isX(fromGroups.patch)) {
          from = stringify({
            operator: ">=",
            major: fromGroups.major,
            minor: fromGroups.minor,
            patch: 0,
          });
        } else {
          from = ">=" + from;
        }

        if (isX(toGroups.major)) {
          to = "";
        } else if (isX(toGroups.minor)) {
          to = stringify({
            operator: "<",
            major: +toGroups.major + 1,
            minor: 0,
            patch: 0,
          });
        } else if (isX(toGroups.patch)) {
          to = stringify({
            operator: "<",
            major: toGroups.major,
            minor: +toGroups.minor + 1,
            patch: 0,
          });
        } else if (toGroups.prerelease) {
          to = stringify({
            operator: "<=",
            major: toGroups.major,
            minor: toGroups.minor,
            patch: toGroups.patch,
            prerelease: toGroups.prerelease,
          });
        } else {
          to = "<=" + to;
        }
        return (from + " " + to).trim();
      }
    }
  }
  return range;
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
  range = range.replaceAll(/(?<=<|>|=) /g, "");
  if (range === "") return { ranges: [[ALL]] };

  // Split into groups of comparators, these are considered OR'd together.
  const ranges = range
    .split(/\s*\|\|\s*/)
    .map((range) => {
      range = replaceHyphen(range)
        .split(/\s+/)
        .map((comp) => {
          const operatorMatch = OPERATOR_REGEXP.exec(comp);
          if (!operatorMatch) return comp;
          const groups = comp.slice(operatorMatch[0].length)
            .match(SEMVER_REGEXP)?.groups as {
              major: string;
              minor: string;
              patch: string;
              prerelease?: string;
            } | undefined;

          if (!groups) return comp;
          const operator = operatorMatch.groups!.operator;
          switch (operator) {
            case "~":
            case "~>":
              return replaceCaret(groups);
            case "^":
              return replaceTile(groups);
            case "=":
            case "<":
            case "<=":
            case ">":
            case ">=":
            case "":
              return replaceXRange({ operator, ...groups });
          }
        })
        .join(" ");

      if (range.includes("*") || range === "") {
        return [ALL];
      }
      // At this point, the range is completely trimmed and
      // ready to be split into comparators.
      // These are considered AND's

      return range
        .split(" ")
        .filter((r) => r)
        .map((r) => parseComparator(r));
    });

  return { ranges };
}
