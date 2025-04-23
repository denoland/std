// Copyright 2018-2025 the Deno authors. MIT license.

export function resolve(
  specifier: string,
  referrer: string,
) {
  return (specifier.startsWith("./") || specifier.startsWith("../"))
    ? new URL(specifier, referrer).href
    : import.meta.resolve(specifier);
}
