// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

export enum caseStyle {
  pascalCase = "pascalCase",
  camelCase = "camelCase",
  snakeCase = "snakeCase",
  kebabCase = "kebabCase",
  screamingSnakeCase = "screamingSnakeCase",
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
 */
export function format(str: string, style: caseStyle): string {
  const acc = [];
  const reg = /([a-zA-Z0-9À-ž]+)/gm;
  str = str.trim();
  const m = str.match(reg);
  for (let i = 0; i < m.length; i++) {
    let match = m[i];
    if (style === caseStyle.camelCase && i === 0) {
      acc.push(match[0].toLowerCase() + match.slice(1));
    } else if (
      style === caseStyle.pascalCase ||
      style === caseStyle.camelCase
    ) {
      acc.push(match[0].toUpperCase() + match.slice(1).toLowerCase());
    } else if (
      style === caseStyle.screamingSnakeCase ||
      style === caseStyle.screamingKebabCase
    ) {
      acc.push(match[0].toUpperCase() + match.slice(1).toUpperCase());
    } else {
      acc.push(match[0].toLowerCase() + match.slice(1).toLowerCase());
    }
  }
  switch (style) {
    case caseStyle.pascalCase:
    case caseStyle.camelCase:
      return acc.join("");
    case caseStyle.snakeCase:
    case caseStyle.screamingSnakeCase:
      return acc.join("_");
    case caseStyle.kebabCase:
    case caseStyle.screamingKebabCase:
      return acc.join("-");
    default:
      throw Error("Unknown case style");
  }
}
