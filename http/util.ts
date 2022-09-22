// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/** Returns true if the etags match. Weak etag comparisons are handled. */
export function compareEtag(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  if (a.startsWith("W/") && !b.startsWith("W/")) {
    return a.slice(2) === b;
  }
  if (!a.startsWith("W/") && b.startsWith("W/")) {
    return a === b.slice(2);
  }
  return false;
}
