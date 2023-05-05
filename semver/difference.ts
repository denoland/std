// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "./semver.ts";
import { ReleaseType } from "./types.ts";
import { parse } from "./parse.ts";
import { eq } from "./eq.ts";

/** Returns difference between two versions by the release type, or
 * `undefined` if the versions are the same. */
export function difference(
  s0: SemVer,
  s1: SemVer,
): ReleaseType | undefined;
/** (will be removed after 0.189.0) Use `difference(s0: SemVer, s1: SemVer)` instead.
 *
 * Returns difference between two versions by the release type, or
 * `undefined` if the versions are the same. */
export function difference(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): ReleaseType | undefined;
/** Returns difference between two versions by the release type, or
 * `undefined` if the versions are the same. */
export function difference(
  sv0: string | SemVer,
  sv1: string | SemVer,
  options?: { includePrerelease: boolean },
): ReleaseType | undefined {
  const s0 = typeof sv0 === "string" ? parse(sv0) : sv0;
  const s1 = typeof sv1 === "string" ? parse(sv1) : sv1;
  const includePrerelease = options?.includePrerelease ?? true;
  if (eq(s0, s1)) {
    return undefined;
  } else {
    let prefix = "";
    let defaultResult: ReleaseType | undefined = undefined;
    if (s0 && s1) {
      if (includePrerelease && (s0.prerelease.length || s1.prerelease.length)) {
        prefix = "pre";
        defaultResult = "prerelease";
      }

      for (const key in s0) {
        if (key === "major" || key === "minor" || key === "patch") {
          if (s0[key] !== s1[key]) {
            return (prefix + key) as ReleaseType;
          }
        }
      }
    }
    return defaultResult; // may be undefined
  }
}
