// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

const JSDOC_REGEX = /\/\*\*\s*(?<jsdoc>[\s\S]*?)\s*\*\//;
const LINE_REGEX =
  /^\s*(?:\/\*\*|\* *)?(?:@(?<name>\w+))? *(?<content>.*?)?(?:\s*\*\/)?$/;

interface Entry {
  name?: string;
  content?: string;
}

export function parse(input: string): Entry[] {
  const result: Entry[] = [];
  const match = JSDOC_REGEX.exec(input);
  const jsdoc = match?.groups?.jsdoc;
  if (!jsdoc) throw new SyntaxError(`input could not be parsed.`);
  const lines = jsdoc?.split(/\r?\n/);
  for (const line of lines) {
    const groups = LINE_REGEX.exec(line)?.groups;
    if (groups) {
      const object: Entry = {};
      if (groups.name) {
        object.name = groups.name;
      }
      if (groups.content) {
        object.content = groups.content;
      }
      if (Object.keys(object).length === 0) continue;
      result.push(object);
    }
  }
  return result;
}

export function stringify(entries: Entry[]) {
  let value = "";
  value += `/**`;
  for (const entry of entries) {
    value += "\n";
    value += " * ";
    if (entry.name) {
      value += "@";
      value += entry.name;
      if (entry.content) {
        value += " ";
        value += entry.content;
      }
    } else if (entry.content) {
      value += entry.content;
    }
  }
  value += "\n";
  value += ` */`;
  return value;
}
