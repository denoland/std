// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { ALL } from "./constants.ts";
import type { SemVerRange } from "./types.ts";
import { OPERATOR_REGEXP, XRANGE_PLAIN } from "./_shared.ts";
import { parseComparator } from "./parse_comparator.ts";

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 -> >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 -> >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 -> >=1.2.0 <3.5.0
function hyphenReplace(range: string) {
  // convert `1.2.3 - 1.2.4` into `>=1.2.3 <=1.2.4`
  const leftMatch = range.match(new RegExp(`^${XRANGE_PLAIN}`));
  const leftGroup = leftMatch?.groups;
  if (!leftGroup) return range.split(/\s+/);
  const leftLength = leftMatch[0].length;
  const hyphenMatch = range.slice(leftLength).match(/^\s+-\s+/);
  if (!hyphenMatch) return range.split(/\s+/);
  const hyphenLength = hyphenMatch[0].length;
  const rightMatch = range.slice(leftLength + hyphenLength).match(
    new RegExp(`^${XRANGE_PLAIN}\\s*$`),
  );
  const rightGroups = rightMatch?.groups;
  if (!rightGroups) return range.split(/\s+/);
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

  return [from, to];
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

  if (range === "") return { ranges: [[ALL]] };

  // Split into groups of comparators, these are considered OR'd together.
  const ranges = range
    .split(/\s*\|\|\s*/)
    .map((range) => {
      // handle space between comparator and version
      range = range.replace(/(?<=<|>|=) /, "");

      const entries = hyphenReplace(range)
        .flatMap((comp) => {
          const groups = comp.match(OPERATOR_REGEXP)?.groups;
          if (!groups) return comp.split(/\s+/);

          const majorIsWildcard = isWildcard(groups.major);
          const minorIsWildcard = isWildcard(groups.minor);
          const patchIsWildcard = isWildcard(groups.patch);

          const major = +groups.major;
          const minor = +groups.minor;
          const patch = +groups.patch;

          switch (groups.operator) {
            case "^": {
              if (majorIsWildcard) return [""];
              if (minorIsWildcard) {
                return [`>=${major}.0.0`, `<${major + 1}.0.0`];
              }
              if (patchIsWildcard) {
                if (major === 0) {
                  return [`>=${major}.${minor}.0`, `<${major}.${minor + 1}.0`];
                }
                return [`>=${major}.${minor}.0`, `<${major + 1}.0.0`];
              }

              const prerelease = groups.prerelease
                ? `-${groups.prerelease}`
                : "";

              if (major === 0) {
                if (minor === 0) {
                  return [
                    `>=${major}.${minor}.${patch}${prerelease}`,
                    `<${major}.${minor}.${patch + 1}`,
                  ];
                }
                return [
                  `>=${major}.${minor}.${patch}${prerelease}`,
                  `<${major}.${minor + 1}.0`,
                ];
              }
              return [
                `>=${major}.${minor}.${patch}${prerelease}`,
                `<${major + 1}.0.0`,
              ];
            }
            case "~":
            case "~>": {
              if (majorIsWildcard) return [""];
              if (minorIsWildcard) {
                return [`>=${major}.0.0`, `<${major + 1}.0.0`];
              }
              if (patchIsWildcard) {
                return [`>=${major}.${minor}.0`, `<${major}.${minor + 1}.0`];
              }
              const prerelease = groups.prerelease
                ? `-${groups.prerelease}`
                : "";

              return [
                `>=${major}.${minor}.${patch}${prerelease}`,
                `<${major}.${minor + 1}.0`,
              ];
            }
            case "<": {
              if (majorIsWildcard) return ["<0.0.0"];
              if (minorIsWildcard) {
                if (patchIsWildcard) return [`<${major}.0.0`];
                return [`<${major}.${minor}.0`];
              }
              if (patchIsWildcard) return [`<${major}.${minor}.0`];
              break;
            }
            case ">": {
              if (majorIsWildcard) return ["<0.0.0"];
              if (minorIsWildcard) {
                if (patchIsWildcard) return [`>=${major + 1}.0.0`];
                return [`>${major}.${minor + 1}.0`];
              }
              if (patchIsWildcard) return [`>${major}.${minor + 1}.0`];
              break;
            }
            case "<=": {
              if (minorIsWildcard) {
                if (patchIsWildcard) return [`<${major + 1}.0.0`];
                return [`<${major}.${minor + 1}.0`];
              }
              if (patchIsWildcard) return [`<${major}.${minor + 1}.0`];
              break;
            }
            case ">=": {
              if (majorIsWildcard) return [""];
              if (minorIsWildcard) {
                if (patchIsWildcard) return [`>=${major}.0.0`];
                return [`>=${major}.${minor}.0`];
              }
              if (patchIsWildcard) return [`>=${major}.${minor}.0`];
              break;
            }
            default: {
              if (majorIsWildcard) return [""];
              if (minorIsWildcard) {
                return [`>=${major}.0.0`, `<${major + 1}.0.0`];
              }
              if (patchIsWildcard) {
                return [`>=${major}.${minor}.0`, `<${major}.${minor + 1}.0`];
              }
            }
          }
          return comp.split(/\s+/);
        });

      return entries.map((r) => parseComparator(r)) ?? [ALL];
    });

  return { ranges };
}
