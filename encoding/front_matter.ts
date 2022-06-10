// Working version of https://github.com/jxson/front-matter/blob/36f139ef797bd9e5196a9ede03ef481d7fbca18e/index.js

import { parse } from "./yaml.ts";

const pattern = "^(" +
  "\\ufeff?" + // Maybe byte order mark
  "(= yaml =|---)" +
  "$([\\s\\S]*?)" +
  "^(?:\\2|\\.\\.\\.)\\s*" +
  "$" +
  (Deno.build.os === "windows" ? "\\r?" : "") +
  "(?:\\n)?)";
const regex = new RegExp(pattern, "m");

export type Extract<T> = {
  yaml: string;
  body: string;
  attrs: T;
};

// deno-lint-ignore no-explicit-any
const defaultExtract: Extract<any> = {
  yaml: "",
  body: "",
  attrs: {},
};

// deno-lint-ignore no-explicit-any
export function extract<T = any>(str: string): Extract<T> {
  const lines = str.split(/(\r?\n)/);
  if (lines[0] == undefined) return defaultExtract;

  if (/= yaml =|---/.test(lines[0])) {
    const match = regex.exec(str);
    if (!match) return defaultExtract;
    const yaml = match.at(-1)?.replace(/^\s+|\s+$/g, "") || "";
    const attrs = parse(yaml) as T;
    const body = str.replace(match[0], "");
    return { yaml, body, attrs };
  }

  return defaultExtract;
}