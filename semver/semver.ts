// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export {
  /**
   * @deprecated (will be removed after 0.189.0) Import from `std/semver/constants.ts` instead.
   *
   * ANY is a sentinel value used by some range calculations. It is not a valid
   * SemVer object and should not be used directly.
   * @example
   * ```ts
   * import { eq } from "https://deno.land/std@$STD_VERSION/semver/eq.ts";
   * import { parse } from "https://deno.land/std@$STD_VERSION/semver/parse.ts";
   * import { ANY } from "https://deno.land/std@$STD_VERSION/semver/semver.ts"
   * eq(parse("1.2.3"), ANY); // false
   * ```
   */
  ANY,
  /**
   * @deprecated (will be removed after 0.189.0) Import from `std/semver/constants.ts` instead.
   *
   * A sentinel value used to denote an invalid SemVer object
   * which may be the result of impossible ranges or comparator operations.
   * @example
   * ```ts
   * import { eq } from "https://deno.land/std@$STD_VERSION/semver/eq.ts";
   * import { parse } from "https://deno.land/std@$STD_VERSION/semver/parse.ts";
   * import { INVALID } from "https://deno.land/std@$STD_VERSION/semver/semver.ts"
   * eq(parse("1.2.3"), INVALID);
   * ```
   */
  INVALID,
  /**
   * @deprecated (will be removed after 0.189.0) Import from `std/semver/constants.ts` instead.
   *
   * MAX is a sentinel value used by some range calculations.
   * It is equivalent to `∞.∞.∞`.
   */
  MAX,
  /**
   * @deprecated (will be removed after 0.189.0) Import from `std/semver/constants.ts` instead.
   *
   * The minimum valid SemVer object. Equivalent to `0.0.0`.
   */
  MIN,
} from "./constants.ts";

export type {
  /**
   * @deprecated (will be removed after 0.189.0) Import from `std/semver/types.ts` instead.
   *
   * The possible release types are used as an operator for the
   * increment function and as a result of the difference function.
   */
  SemVer,
} from "./types.ts";
