// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import {
  bgGreen,
  bgRed,
  bold,
  gray,
  green,
  red,
  white,
} from "../fmt/colors.ts";

interface FarthestPoint {
  y: number;
  id: number;
}

export const DIFF_TYPES = ["added", "removed", "common"] as const;

export type DiffType = typeof DIFF_TYPES[number];

export interface DiffResult<T> {
  type: DiffType;
  value: T;
  details?: DiffResult<T>[];
}

const REMOVED = 1;
const COMMON = 2;
const ADDED = 3;

function createCommon<T>(A: T[], B: T[], reverse?: boolean): T[] {
  const common = [];
  if (A.length === 0 || B.length === 0) return [];
  for (let i = 0; i < Math.min(A.length, B.length); i += 1) {
    if (
      A[reverse ? A.length - i - 1 : i] === B[reverse ? B.length - i - 1 : i]
    ) {
      common.push(A[reverse ? A.length - i - 1 : i]);
    } else {
      return common;
    }
  }
  return common;
}

/**
 * Renders the differences between the actual and expected values
 * @param A Actual value
 * @param B Expected value
 */
export function diff<T>(A: T[], B: T[]): DiffResult<T>[] {
  const prefixCommon = createCommon(A, B);
  const suffixCommon = createCommon(
    A.slice(prefixCommon.length),
    B.slice(prefixCommon.length),
    true,
  ).reverse();
  A = suffixCommon.length
    ? A.slice(prefixCommon.length, -suffixCommon.length)
    : A.slice(prefixCommon.length);
  B = suffixCommon.length
    ? B.slice(prefixCommon.length, -suffixCommon.length)
    : B.slice(prefixCommon.length);
  const swapped = B.length > A.length;
  [A, B] = swapped ? [B, A] : [A, B];
  const M = A.length;
  const N = B.length;
  if (!M && !N && !suffixCommon.length && !prefixCommon.length) return [];
  if (!N) {
    return [
      ...prefixCommon.map((
        value,
      ) => ({ type: "common", value } as DiffResult<T>)),
      ...A.map((
        value,
      ) => ({ type: swapped ? "added" : "removed", value } as DiffResult<T>)),
      ...suffixCommon.map((
        value,
      ) => ({ type: "common", value } as DiffResult<T>)),
    ];
  }

  const offset = N;
  const delta = M - N;
  const size = M + N + 1;
  const fp: FarthestPoint[] = Array.from(
    { length: size },
    () => ({ y: -1, id: -1 }),
  );
  /**
   * INFO:
   * This buffer is used to save memory and improve performance.
   * The first half is used to save route and last half is used to save diff
   * type.
   * This is because, when I kept new uint8array area to save type,performance
   * worsened.
   */
  const routes = new Uint32Array((M * N + size + 1) * 2);
  const diffTypesPtrOffset = routes.length / 2;
  let ptr = 0;
  let p = -1;

  function backTrace<T>(
    A: T[],
    B: T[],
    current: FarthestPoint,
    swapped: boolean,
  ): DiffResult<T>[] {
    const result: DiffResult<T>[] = [];
    let a = A.length - 1;
    let b = B.length - 1;
    let j = routes[current.id];
    let type = routes[current.id + diffTypesPtrOffset];

    while (j || type) {
      const prev = j;
      let diffType: DiffType = "common";
      let value = A[a];
      switch (type) {
        case REMOVED:
          diffType = swapped ? "removed" : "added";
          value = B[b];
          b--;
          break;
        case ADDED:
          diffType = swapped ? "added" : "removed";
          a--;
          break;
        default:
          a--;
          b--;
      }
      result.unshift({ type: diffType, value });
      j = routes[prev];
      type = routes[prev + diffTypesPtrOffset];
    }

    return result;
  }

  function createFP(
    slide: FarthestPoint,
    down: FarthestPoint,
    k: number,
    M: number,
  ): FarthestPoint {
    if (!slide || slide.y === -1) {
      return { y: 0, id: 0 };
    }
    if (!down || down.y === -1 || k === M || slide.y > down.y + 1) {
      const prev = slide.id;
      ptr++;
      routes[ptr] = prev;
      routes[ptr + diffTypesPtrOffset] = ADDED;
      return { y: slide.y, id: ptr };
    } else {
      const prev = down.id;
      ptr++;
      routes[ptr] = prev;
      routes[ptr + diffTypesPtrOffset] = REMOVED;
      return { y: down.y + 1, id: ptr };
    }
  }

  function snake<T>(
    k: number,
    slide: FarthestPoint,
    down: FarthestPoint,
    _offset: number,
    A: T[],
    B: T[],
  ): FarthestPoint {
    const M = A.length;
    const N = B.length;
    if (k < -N || M < k) return { y: -1, id: -1 };
    const fp = createFP(slide, down, k, M);
    while (fp.y + k < M && fp.y < N && A[fp.y + k] === B[fp.y]) {
      const prev = fp.id;
      fp.id = ++ptr;
      fp.y++;
      routes[fp.id] = prev;
      routes[fp.id + diffTypesPtrOffset] = COMMON;
    }
    return fp;
  }

  while (fp[delta + offset].y < N) {
    p = p + 1;
    for (let k = -p; k < delta; ++k) {
      fp[k + offset] = snake(
        k,
        fp[k - 1 + offset],
        fp[k + 1 + offset],
        offset,
        A,
        B,
      );
    }
    for (let k = delta + p; k > delta; --k) {
      fp[k + offset] = snake(
        k,
        fp[k - 1 + offset],
        fp[k + 1 + offset],
        offset,
        A,
        B,
      );
    }
    fp[delta + offset] = snake(
      delta,
      fp[delta - 1 + offset],
      fp[delta + 1 + offset],
      offset,
      A,
      B,
    );
  }

  return [
    ...prefixCommon.map((c) => ({ type: "common", value: c } as DiffResult<T>)),
    ...backTrace(A, B, fp[delta + offset], swapped),
    ...suffixCommon.map((c) => ({ type: "common", value: c } as DiffResult<T>)),
  ];
}

/**
 * Renders the differences between the actual and expected strings
 * Partially inspired from https://github.com/kpdecker/jsdiff
 * @param A Actual string
 * @param B Expected string
 */
export function diffstr(A: string, B: string) {
  function unescape(string: string): string {
    // unescape invisible characters.
    // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences
    return string
      .replaceAll("\b", "\\b")
      .replaceAll("\f", "\\f")
      .replaceAll("\t", "\\t")
      .replaceAll("\v", "\\v")
      .replaceAll( // does not remove line breaks
        /\r\n|\r|\n/g,
        (str) => str === "\r" ? "\\r" : str === "\n" ? "\\n\n" : "\\r\\n\r\n",
      );
  }

  function tokenize(string: string, { wordDiff = false } = {}): string[] {
    if (wordDiff) {
      // Split string on whitespace symbols
      const tokens = string.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);
      // Extended Latin character set
      const words =
        /^[a-zA-Z\u{C0}-\u{FF}\u{D8}-\u{F6}\u{F8}-\u{2C6}\u{2C8}-\u{2D7}\u{2DE}-\u{2FF}\u{1E00}-\u{1EFF}]+$/u;

      // Join boundary splits that we do not consider to be boundaries and merge empty strings surrounded by word chars
      for (let i = 0; i < tokens.length - 1; i++) {
        if (
          !tokens[i + 1] && tokens[i + 2] && words.test(tokens[i]) &&
          words.test(tokens[i + 2])
        ) {
          tokens[i] += tokens[i + 2];
          tokens.splice(i + 1, 2);
          i--;
        }
      }
      return tokens.filter((token) => token);
    } else {
      // Split string on new lines symbols
      const tokens = [], lines = string.split(/(\n|\r\n)/);

      // Ignore final empty token when text ends with a newline
      if (!lines[lines.length - 1]) {
        lines.pop();
      }

      // Merge the content and line separators into single tokens
      for (let i = 0; i < lines.length; i++) {
        if (i % 2) {
          tokens[tokens.length - 1] += lines[i];
        } else {
          tokens.push(lines[i]);
        }
      }
      return tokens;
    }
  }

  // Create details by filtering relevant word-diff for current line
  // and merge "space-diff" if surrounded by word-diff for cleaner displays
  function createDetails(
    line: DiffResult<string>,
    tokens: DiffResult<string>[],
  ) {
    return tokens.filter(({ type }) => type === line.type || type === "common")
      .map((result, i, t) => {
        if (
          (result.type === "common") && (t[i - 1]) &&
          (t[i - 1]?.type === t[i + 1]?.type) && /\s+/.test(result.value)
        ) {
          return {
            ...result,
            type: t[i - 1].type,
          };
        }
        return result;
      });
  }

  // Compute multi-line diff
  const diffResult = diff(
    tokenize(`${unescape(A)}\n`),
    tokenize(`${unescape(B)}\n`),
  );

  const added: DiffResult<string>[] = [];
  const removed: DiffResult<string>[] = [];
  for (const result of diffResult) {
    if (result.type === "added") {
      added.push(result);
    }
    if (result.type === "removed") {
      removed.push(result);
    }
  }

  // Compute word-diff
  const hasMoreRemovedLines = added.length < removed.length;
  const aLines = hasMoreRemovedLines ? added : removed;
  const bLines = hasMoreRemovedLines ? removed : added;
  for (const a of aLines) {
    let tokens: DiffResult<string>[] = [];
    let b: undefined | DiffResult<string>;
    // Search another diff line with at least one common token
    while (bLines.length) {
      b = bLines.shift();
      const tokenized = [
        tokenize(a.value, { wordDiff: true }),
        tokenize(b?.value ?? "", { wordDiff: true }),
      ] as string[][];
      if (hasMoreRemovedLines) tokenized.reverse();
      tokens = diff(tokenized[0], tokenized[1]);
      if (
        tokens.some(({ type, value }) =>
          type === "common" && value.trim().length
        )
      ) {
        break;
      }
    }
    // Register word-diff details
    a.details = createDetails(a, tokens);
    if (b) {
      b.details = createDetails(b, tokens);
    }
  }

  return diffResult;
}

/**
 * Colors the output of assertion diffs
 * @param diffType Difference type, either added or removed
 */
function createColor(
  diffType: DiffType,
  { background = false } = {},
): (s: string) => string {
  // TODO(@littledivy): Remove this when we can detect
  // true color terminals.
  // https://github.com/denoland/deno_std/issues/2575
  background = false;
  switch (diffType) {
    case "added":
      return (s: string): string =>
        background ? bgGreen(white(s)) : green(bold(s));
    case "removed":
      return (s: string): string => background ? bgRed(white(s)) : red(bold(s));
    default:
      return white;
  }
}

/**
 * Prefixes `+` or `-` in diff output
 * @param diffType Difference type, either added or removed
 */
function createSign(diffType: DiffType): string {
  switch (diffType) {
    case "added":
      return "+   ";
    case "removed":
      return "-   ";
    default:
      return "    ";
  }
}

export function buildMessage(
  diffResult: ReadonlyArray<DiffResult<string>>,
  { stringDiff = false } = {},
): string[] {
  const messages: string[] = [], diffMessages: string[] = [];
  messages.push("");
  messages.push("");
  messages.push(
    `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${
      green(bold("Expected"))
    }`,
  );
  messages.push("");
  messages.push("");
  diffResult.forEach((result: DiffResult<string>) => {
    const c = createColor(result.type);
    const line = result.details?.map((detail) =>
      detail.type !== "common"
        ? createColor(detail.type, { background: true })(detail.value)
        : detail.value
    ).join("") ?? result.value;
    diffMessages.push(c(`${createSign(result.type)}${line}`));
  });
  messages.push(...(stringDiff ? [diffMessages.join("")] : diffMessages));
  messages.push("");

  return messages;
}
