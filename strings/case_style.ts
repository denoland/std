// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

export enum caseStyle {
  // eg : LastName
  pascalCase = "pascalCase",
  // eg : lastName
  camelCase = "camelCase",
  // eg : last_name
  snakeCase = "snakeCase",
  // eg : last-name
  kebabCase = "kebabCase",
  // eg : LAST_NAME
  screamingSnakeCase = "screamingSnakeCase",
  // eg : LAST-NAME
  screamingKebabCase = "screamingKebabCase"
}

const validators = {
  pascalCase: /[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*/,
  camelCase: /[a-z][a-z0-9]+(?:[A-Z][a-z0-9]+)*/,
  snakeCase: /[a-z][a-z0-9]+(?:[_][a-z][a-z0-9]+)*/,
  screamingSnakeCase: /[A-Z][A-Z0-9]+(?:[_][A-Z][A-Z0-9]+)*/,
  kebabCase: /[a-z][a-z0-9]+(?:[-][a-z][a-z0-9]+)*/,
  screamingKebabCase: /[A-Z][A-Z0-9]+(?:[-][A-Z][A-Z0-9]+)*/
};

/**
 * Validate the string into the caseStyle wanted
 * @param str String to validate
 * @param caseStyle caseStyle to validate the string into
 */
export function validate(str: string, style: caseStyle): boolean {
  const m = validators[style].exec(str);
  return m && m[0] === str;
}

/**
 * Format the string into the caseStyle wanted
 * @param str String to format
 * @param caseStyle caseStyle to format the string into
 * TODO (zekth): handle diacritics
 */
export function format(str: string, style: caseStyle): string {
  const acc = [];
  const reg = /([a-zA-Z0-9À-ž]+)/gm;
  str = str.trim().toLowerCase();
  const m = str.match(reg);
  switch (style) {
    case caseStyle.pascalCase:
    case caseStyle.camelCase:
      for (let i = 0; i < m.length; i++) {
        if (
          style === caseStyle.pascalCase ||
          (style === caseStyle.camelCase && i !== 0)
        ) {
          acc.push(m[i][0].toUpperCase() + m[i].slice(1));
        } else {
          acc.push(m[i]);
        }
      }
      return acc.join("");
    case caseStyle.snakeCase:
      return m.join("_");
    case caseStyle.kebabCase:
      return m.join("-");
    case caseStyle.screamingSnakeCase:
      return m.join("_").toUpperCase();
    case caseStyle.screamingKebabCase:
      return m.join("-").toUpperCase();
    default:
      throw Error("Unknown case style");
  }
}
