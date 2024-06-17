// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export function createAbortError(
  message = "The signal has been aborted",
): DOMException {
  return new DOMException(message, "AbortError");
}

export function exponentialBackoffWithJitter(
  cap: number,
  base: number,
  attempt: number,
  multiplier: number,
  jitter: number,
) {
  const exp = Math.min(cap, base * multiplier ** attempt);
  return (1 - jitter * Math.random()) * exp;
}
