// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { parseVersion } from "../text/parse_version.ts";
import { zip } from "../collections/zip.ts";
import { AssertionError } from "./assertion_error.ts";

/**
 * Asserts that the specified versions of the given systems meet the required criteria.
 *
 * @example
 * ```ts
 * import { assertVersions } from "https://deno.land/std@$STD_VERSION/assert/assert_versions.ts";
 * assertVersions({
 *   deno: {
 *     min: [1, 25],
 *     max: [4],
 *   },
 *   v8: {
 *     max: [20],
 *     min: [11, 6],
 *   },
 *   typescript: {
 *     max: [99],
 *     min: [2, 3, 4],
 *   },
 * });
 * ```
 * @param {Object} options - An object containing version information for different systems.
 * @param {Object} options.typescript - Version information for TypeScript.
 * @param {number[]} [options.typescript.min] - Minimum required version for TypeScript.
 * @param {number[]} [options.typescript.max] - Maximum allowed version for TypeScript.
 * @param {Object} options.v8 - Version information for V8.
 * @param {number[]} [options.v8.min] - Minimum required version for V8.
 * @param {number[]} [options.v8.max] - Maximum allowed version for V8.
 * @param {Object} options.deno - Version information for Deno.
 * @param {number[]} [options.deno.min] - Minimum required version for Deno.
 * @param {number[]} [options.deno.max] - Maximum allowed version for Deno.
 *
 * @throws {AssertionError} Throws an AssertionError if any system's version does not meet the specified criteria.
 */
export function assertVersions(options: {
  typescript?: {
    min?: number[];
    max?: number[];
  };
  v8?: {
    min?: number[];
    max?: number[];
  };
  deno?: {
    min?: number[];
    max?: number[];
  };
}): void {
  for (const [whichSystem, minMax] of Object.entries(options)) {
    const { min, max } = { ...minMax };
    const versionInfo = { ...Deno?.version }[whichSystem];
    if (typeof versionInfo == "string") {
      const existingVersion = parseVersion(versionInfo);
      if (min instanceof Array) {
        const throwMin = () => {
          throw new AssertionError(
            `Current version of ${whichSystem} is ${versionInfo}, however the code requires a minimum version of ${
              min.join(".")
            }`,
          );
        };
        for (const [eachExisting, eachMin] of zip(existingVersion, min)) {
          if (typeof eachExisting !== typeof eachMin) {
            throwMin();
          } else if (typeof eachExisting == "string") {
            // @ts-ignore it complains "dont do string!=number" but beacuse of the if statement above this will never have that case
            if (eachExisting !== eachMin) {
              throwMin();
            }
          } else if (typeof eachExisting == "number") {
            if (eachExisting < eachMin) {
              throwMin();
            }
          }
        }
      }
      if (max instanceof Array) {
        const throwMax = () => {
          throw new AssertionError(
            `Current version of ${whichSystem} is ${versionInfo}, however the code requires a maximum version of ${
              max.join(".")
            }`,
          );
        };
        for (const [eachExisting, eachMax] of zip(existingVersion, max)) {
          if (typeof eachExisting !== typeof eachMax) {
            throwMax();
          } else if (typeof eachExisting == "string") {
            // @ts-ignore it complains "dont do string!=number" but beacuse of the if statement above this will never have that case
            if (eachExisting !== eachMax) {
              throwMax();
            }
          } else if (typeof eachExisting == "number") {
            if (eachExisting > eachMax) {
              throwMax();
            }
          }
        }
      }
    }
  }
}
