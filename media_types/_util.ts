// Copyright 2018-2026 the Deno authors. MIT license.

export interface DBEntry {
  source: string;
  compressible?: boolean;
  charset?: string;
  extensions?: string[];
}

export function consumeToken(v: string): [token: string, rest: string] {
  const notPos = indexOf(v, isNotTokenChar);
  if (notPos === -1) {
    return [v, ""];
  }
  if (notPos === 0) {
    return ["", v];
  }
  return [v.slice(0, notPos), v.slice(notPos)];
}

export function consumeValue(v: string): [value: string, rest: string] {
  if (!v) {
    return ["", v];
  }
  if (v[0] !== `"`) {
    return consumeToken(v);
  }
  let value = "";
  for (let i = 1; i < v.length; i++) {
    const r = v[i];
    if (r === `"`) {
      return [value, v.slice(i + 1)];
    }
    const next = v[i + 1];
    if (r === "\\" && typeof next === "string" && isTSpecial(next)) {
      value += next;
      i++;
      continue;
    }
    if (r === "\r" || r === "\n") {
      return ["", v];
    }
    value += v[i];
  }
  return ["", v];
}

export function consumeMediaParam(
  v: string,
): [key: string, value: string, rest: string] {
  let rest = v.trimStart();
  if (!rest.startsWith(";")) {
    return ["", "", v];
  }
  rest = rest.slice(1);
  rest = rest.trimStart();
  let param: string;
  [param, rest] = consumeToken(rest);
  param = param.toLowerCase();
  if (!param) {
    return ["", "", v];
  }
  rest = rest.slice(1);
  rest = rest.trimStart();
  const [value, rest2] = consumeValue(rest);
  if (value === "" && rest2 === rest) {
    return ["", "", v];
  }
  rest = rest2;
  return [param, value, rest];
}

export function percentDecode(v: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < v.length; i++) {
    if (v[i] === "%" && i + 2 < v.length) {
      const hex = v.slice(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(v.charCodeAt(i));
  }
  return new Uint8Array(bytes);
}

export function decode2331Encoding(v: string): string | undefined {
  const sv = v.split(`'`, 3);
  if (sv.length !== 3) {
    return undefined;
  }
  const [sv0, , sv2] = sv as [string, string, string];
  const charset = sv0.toLowerCase();
  if (!charset) {
    return undefined;
  }
  if (charset !== "us-ascii" && charset !== "utf-8") {
    return undefined;
  }
  if (!sv2) {
    return undefined;
  }
  const bytes = percentDecode(sv2);
  try {
    const decoder = new TextDecoder(charset, { fatal: true });
    return decoder.decode(bytes);
  } catch {
    return undefined;
  }
}

function indexOf<T>(s: Iterable<T>, fn: (s: T) => boolean): number {
  let i = -1;
  for (const v of s) {
    i++;
    if (fn(v)) {
      return i;
    }
  }
  return -1;
}

export function isIterator<T>(obj: unknown): obj is Iterable<T> {
  if (obj === null || obj === undefined) {
    return false;
  }
  // deno-lint-ignore no-explicit-any
  return typeof (obj as any)[Symbol.iterator] === "function";
}

export function isToken(s: string): boolean {
  if (!s) {
    return false;
  }
  return indexOf(s, isNotTokenChar) < 0;
}

function isNotTokenChar(r: string): boolean {
  return !isTokenChar(r);
}

function isTokenChar(r: string): boolean {
  const code = r.charCodeAt(0);
  return code > 0x20 && code < 0x7f && !isTSpecial(r);
}

export function isTSpecial(r: string): boolean {
  return r[0] ? `()<>@,;:\\"/[]?=`.includes(r[0]) : false;
}

const CHAR_CODE_SPACE = " ".charCodeAt(0);
const CHAR_CODE_TILDE = "~".charCodeAt(0);

export function needsEncoding(s: string): boolean {
  for (const b of s) {
    const charCode = b.charCodeAt(0);
    if (
      (charCode < CHAR_CODE_SPACE || charCode > CHAR_CODE_TILDE) && b !== "\t"
    ) {
      return true;
    }
  }
  return false;
}
