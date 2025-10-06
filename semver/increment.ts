// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { parseBuild, parsePrerelease } from "./_shared.ts";
import type { ReleaseType, SemVer } from "./types.ts";

function bumpPrereleaseNumber(prerelease: ReadonlyArray<string | number> = []) {
  const values = [...prerelease];

  let index = values.length;
  while (index >= 0) {
    const value = values[index];
    if (typeof value === "number") {
      values[index] = value + 1;
      break;
    }
    index -= 1;
  }
  // if no number was bumped
  if (index === -1) values.push(0);

  return values;
}

function bumpPrerelease(
  currentPrerelease: ReadonlyArray<string | number> = [],
  newPrerelease: string | undefined,
): (string | number)[] {
  const bumpedPrerelease = bumpPrereleaseNumber(currentPrerelease);

  // If the identifier is not provided, return the bumped prerelease
  if (!newPrerelease) return bumpedPrerelease;

  let newIdentifiers = parsePrerelease(newPrerelease);

  if (newIdentifiers.every((id) => typeof id === "string")) {
    // When the give prerelease has no number and are all included in the existing prerelease
    // it should just bump the number
    if (
      newIdentifiers.every((id, i) => id === bumpedPrerelease[i]) &&
      typeof bumpedPrerelease[newIdentifiers.length] === "number"
    ) {
      return bumpedPrerelease;
    }
    newIdentifiers = [...newIdentifiers, 0];
  }

  return newIdentifiers;
}

/** Options for {@linkcode increment}. */
export interface IncrementOptions {
  /** The pre-release of the new version. */
  prerelease?: string;
  /** The build metadata of the new version. */
  build?: string;
}

/**
 * Returns the new SemVer resulting from an increment by release type.
 *
 * `premajor`, `preminor` and `prepatch` will bump the version up to the next version,
 * based on the type, and will also add prerelease metadata.
 *
 * If called from a non-prerelease version, the `prerelease` will work the same as
 * `prepatch`. The patch version is incremented and then is made into a prerelease. If
 * the input version is already a prerelease it will simply increment the prerelease
 * metadata.
 *
 * If a `prerelease` option is specified without a number then a number will be added.
 * For example `pre` will result in `pre.0`. If the existing version already has a
 * prerelease with a number and its the same prerelease identifier then the number
 * will be incremented. If the identifier differs from the new identifier then the new
 * identifier is applied and the number is reset to `0`.
 *
 * If a prerelease is specified with a number then that exact prerelease will be used.
 *
 * If the input version has build metadata it will be preserved on the resulting version
 * unless a new build parameter is specified. Specifying `""` will unset existing build
 * metadata.
 *
 * @example Usage
 * ```ts
 * import { increment, parse } from "@std/semver";
 * import { assertEquals } from "@std/assert";
 *
 * const version = parse("1.2.3");
 * assertEquals(increment(version, "major"), parse("2.0.0"));
 * assertEquals(increment(version, "minor"), parse("1.3.0"));
 * assertEquals(increment(version, "patch"), parse("1.2.4"));
 * assertEquals(increment(version, "prerelease"), parse("1.2.4-0"));
 *
 * assertEquals(increment(parse("1.2.3-beta.0"), "prerelease"), parse("1.2.3-beta.1"));
 * assertEquals(increment(parse("1.2.3-beta.3"), "prerelease", { prerelease: "rc" }), parse("1.2.3-rc.0"));
 * assertEquals(increment(parse("1.2.3-beta.3"), "prerelease", { prerelease: "rc.1" }), parse("1.2.3-rc.1"));
 * ```
 *
 * @param version The version to increment
 * @param release The type of increment to perform
 * @param options Additional options
 * @returns The new version
 */
export function increment(
  version: SemVer,
  release: ReleaseType,
  options: IncrementOptions = {},
): SemVer {
  const build = options.build !== undefined
    ? parseBuild(options.build)
    : version.build ?? [];

  switch (release) {
    case "premajor":
      return {
        major: version.major + 1,
        minor: 0,
        patch: 0,
        prerelease: bumpPrerelease(version.prerelease, options.prerelease),
        build,
      };
    case "preminor":
      return {
        major: version.major,
        minor: version.minor + 1,
        patch: 0,
        prerelease: bumpPrerelease(version.prerelease, options.prerelease),
        build,
      };
    case "prepatch":
      return {
        major: version.major,
        minor: version.minor,
        patch: version.patch + 1,
        prerelease: bumpPrerelease(version.prerelease, options.prerelease),
        build,
      };
    case "prerelease": {
      // If the input is a non-prerelease version, this acts the same as prepatch.
      const isPrerelease = (version.prerelease ?? []).length === 0;
      const patch = isPrerelease ? version.patch + 1 : version.patch;
      return {
        major: version.major,
        minor: version.minor,
        patch,
        prerelease: bumpPrerelease(version.prerelease, options.prerelease),
        build,
      };
    }
    case "major": {
      // If this is a pre-major version, bump up to the same major version. Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      const isPrerelease = (version.prerelease ?? []).length === 0;
      const major = isPrerelease || version.minor !== 0 || version.patch !== 0
        ? version.major + 1
        : version.major;
      return {
        major,
        minor: 0,
        patch: 0,
        prerelease: [],
        build,
      };
    }
    case "minor": {
      // If this is a pre-minor version, bump up to the same minor version. Otherwise increment minor.
      // 1.2.0-5 bumps to 1.2.0
      // 1.2.1 bumps to 1.3.0
      const isPrerelease = (version.prerelease ?? []).length === 0;
      const minor = isPrerelease || version.patch !== 0
        ? version.minor + 1
        : version.minor;
      return {
        major: version.major,
        minor,
        patch: 0,
        prerelease: [],
        build,
      };
    }
    case "patch": {
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      const isPrerelease = (version.prerelease ?? []).length === 0;
      const patch = isPrerelease ? version.patch + 1 : version.patch;
      return {
        major: version.major,
        minor: version.minor,
        patch,
        prerelease: [],
        build,
      };
    }
    case "pre": {
      // 1.0.0 "pre" would become 1.0.0-0
      // 1.0.0-0 would become 1.0.0-1
      // 1.0.0-beta.0 would be come 1.0.0-beta.1
      // switching the pre identifier resets the number to 0
      return {
        major: version.major,
        minor: version.minor,
        patch: version.patch,
        prerelease: bumpPrerelease(version.prerelease, options.prerelease),
        build,
      };
    }
    default:
      throw new TypeError(
        `Cannot increment version: invalid argument ${release}`,
      );
  }
}
