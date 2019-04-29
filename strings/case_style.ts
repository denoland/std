// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

export enum caseStyle {
  pascalCase = "pascalCase",
  camelCase = "camelCase",
  snakeCase = "snakeCase",
  kebabCase = "kebabCase"
}

const validators = {
  pascalCase: /[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*/,
  camelCase: /[a-z][a-z0-9]+(?:[A-Z][a-z0-9]+)*/,
  snakeCase: /[a-z][a-z0-9]+(?:[_][a-z][a-z0-9]+)*/,
  kebabCase: /[a-z][a-z0-9]+(?:[-][a-z][a-z0-9]+)*/
};

export function validate(str: string, style: caseStyle): boolean {
  const m = validators[style].exec(str);
  return m[0] === str;
}
