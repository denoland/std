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

/**
 * Parses `accept-language` header
 * @param header Request header value
 * @returns Array of locale identifiers, ordered by q-factor from highest to lowest. A wildcard (`*`) identifier is returns as a `null` value.
 */
export function parseAcceptLanguage(header: string): (Intl.Locale | string)[] {
  return header
    .split(", ")
    .map((tag) => {
      const [language, q] = tag.split(";q=");
      return {
        locale: language === "*" ? "*" : new Intl.Locale(language),
        q: Number(q) || 1,
      };
    })
    .sort((a, b) => b.q - a.q)
    .map(({ locale }) => locale);
}
