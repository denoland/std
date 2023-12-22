// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { ALL } from "./constants.ts";
import type { SemVerRange } from "./types.ts";
import { OPERATOR_REGEXP, XRANGE_PLAIN } from "./_shared.ts";
import { parseComparator } from "./parse_comparator.ts";

function isWildcard(id: string): boolean {
  return !id || id.toLowerCase() === "x" || id === "*";
}

type RegExpGroups = {
  operator: string;
  major: string;
  minor: string;
  patch: string;
  prerelease?: string;
  build?: string;
};

function parseHyphenRange(range: string) {
  // remove spaces between comparator and groups
  range = range.replace(/(?<=<|>|=) +/, "");

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
function handleCaretOperator(groups: {
  minor: string;
  major: string;
  patch: string;
  prerelease?: string;
}) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);

  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;

  if (majorIsWildcard) return ALL;
  if (minorIsWildcard) {
    return [
      parseComparator(`>=${major}.0.0`),
      parseComparator(`<${major + 1}.0.0`),
    ];
  }
  if (patchIsWildcard) {
    if (major === 0) {
      return [
        parseComparator(`>=${major}.${minor}.0`),
        parseComparator(`<${major}.${minor + 1}.0`),
      ];
    }
    return [
      parseComparator(`>=${major}.${minor}.0`),
      parseComparator(`<${major + 1}.0.0`),
    ];
  }

  const prerelease = groups.prerelease ? `-${groups.prerelease}` : "";

  if (major === 0) {
    if (minor === 0) {
      return [
        parseComparator(
          `>=${major}.${minor}.${patch}${prerelease}`,
        ),
        parseComparator(
          `<${major}.${minor}.${patch + 1}`,
        ),
      ];
    }
    return [
      parseComparator(
        `>=${major}.${minor}.${patch}${prerelease}`,
      ),
      parseComparator(
        `<${major}.${minor + 1}.0`,
      ),
    ];
  }
  return [
    parseComparator(
      `>=${major}.${minor}.${patch}${prerelease}`,
    ),
    parseComparator(
      `<${major + 1}.0.0`,
    ),
  ];
}
function handleTildeOperator(
  groups: RegExpGroups,
) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);

  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;

  if (majorIsWildcard) return ALL;
  if (minorIsWildcard) {
    return [
      parseComparator(`>=${major}.0.0`),
      parseComparator(`<${major + 1}.0.0`),
    ];
  }
  if (patchIsWildcard) {
    return [
      parseComparator(`>=${major}.${minor}.0`),
      parseComparator(`<${major}.${minor + 1}.0`),
    ];
  }
  const prerelease = groups.prerelease ? `-${groups.prerelease}` : "";

  return [
    parseComparator(
      `>=${major}.${minor}.${patch}${prerelease}`,
    ),
    parseComparator(
      `<${major}.${minor + 1}.0`,
    ),
  ];
}
function handleLessThanOperator(
  groups: RegExpGroups,
) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);

  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;

  if (majorIsWildcard) return parseComparator("<0.0.0");
  if (minorIsWildcard) {
    if (patchIsWildcard) return parseComparator(`<${major}.0.0`);
    return parseComparator(`<${major}.${minor}.0`);
  }
  if (patchIsWildcard) return parseComparator(`<${major}.${minor}.0`);
  return parseComparator(
    `<${major}.${minor}.${patch}${
      groups.prerelease ? `-${groups.prerelease}` : ""
    }${groups.build ? `+${groups.build}` : ""}`,
  );
}
function handleLessThanOrEqualOperator(
  groups: RegExpGroups,
) {
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);

  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;

  if (minorIsWildcard) {
    if (patchIsWildcard) return parseComparator(`<${major + 1}.0.0`);
    return parseComparator(`<${major}.${minor + 1}.0`);
  }
  if (patchIsWildcard) return parseComparator(`<${major}.${minor + 1}.0`);
  return parseComparator(
    `<=${major}.${minor}.${patch}${
      groups.prerelease ? `-${groups.prerelease}` : ""
    }${groups.build ? `+${groups.build}` : ""}`,
  );
}
function handleGreaterThanOperator(
  groups: RegExpGroups,
) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);

  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;

  if (majorIsWildcard) return parseComparator("<0.0.0");
  if (minorIsWildcard) {
    if (patchIsWildcard) return parseComparator(`>=${major + 1}.0.0`);
    return parseComparator(`>${major}.${minor + 1}.0`);
  }
  if (patchIsWildcard) return parseComparator(`>${major}.${minor + 1}.0`);
  return parseComparator(
    `>${major}.${minor}.${patch}${
      groups.prerelease ? `-${groups.prerelease}` : ""
    }${groups.build ? `+${groups.build}` : ""}`,
  );
}
function handleGreaterOrEqualOperator(
  groups: RegExpGroups,
) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);

  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;

  if (majorIsWildcard) return ALL;
  if (minorIsWildcard) {
    if (patchIsWildcard) return parseComparator(`>=${major}.0.0`);
    return parseComparator(`>=${major}.${minor}.0`);
  }
  if (patchIsWildcard) return parseComparator(`>=${major}.${minor}.0`);
  return parseComparator(
    `>=${major}.${minor}.${patch}${
      groups.prerelease ? `-${groups.prerelease}` : ""
    }${groups.build ? `+${groups.build}` : ""}`,
  );
}
function handleEqualOperator(groups: RegExpGroups) {
  const majorIsWildcard = isWildcard(groups.major);
  const minorIsWildcard = isWildcard(groups.minor);
  const patchIsWildcard = isWildcard(groups.patch);

  const major = +groups.major;
  const minor = +groups.minor;
  const patch = +groups.patch;

  if (majorIsWildcard) return ALL;
  if (minorIsWildcard) {
    return [
      parseComparator(`>=${major}.0.0`),
      parseComparator(`<${major + 1}.0.0`),
    ];
  }
  if (patchIsWildcard) {
    return [
      parseComparator(
        `>=${major}.${minor}.0`,
      ),
      parseComparator(
        `<${major}.${minor + 1}.0`,
      ),
    ];
  }
  return parseComparator(
    `${major}.${minor}.${patch}${
      groups.prerelease ? `-${groups.prerelease}` : ""
    }${groups.build ? `+${groups.build}` : ""}`,
  );
}

function parseRangeString(string: string) {
  const groups = string.match(OPERATOR_REGEXP)?.groups as RegExpGroups;
  if (!groups) return parseComparator(string);

  switch (groups.operator) {
    case "^":
      return handleCaretOperator(groups);
    case "~":
    case "~>":
      return handleTildeOperator(groups);
    case "<":
      return handleLessThanOperator(groups);
    case "<=":
      return handleLessThanOrEqualOperator(groups);
    case ">":
      return handleGreaterThanOperator(groups);
    case ">=":
      return handleGreaterOrEqualOperator(groups);
    case "=":
    case "":
      return handleEqualOperator(groups);
    default:
      throw new Error(`'${groups.operator}' is not a valid operator.`);
  }
}

/**
 * Parses a range string into a SemVerRange object or throws a TypeError.
 * @param rangeSet The range set string
 * @returns A valid semantic groups range
 */
export function parseRange(rangeSet: string): SemVerRange {
  const ranges = rangeSet
    .split(/\s*\|\|\s*/)
    .map((range) => parseHyphenRange(range).flatMap(parseRangeString));
  return { ranges };
}
