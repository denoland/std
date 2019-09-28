import { globrex } from "./globrex.ts";
import { isAbsolute, join } from "./path/mod.ts";
import { WalkInfo, walk, walkSync } from "./walk.ts";
const { cwd } = Deno;

export interface GlobOptions {
  extended?: boolean;
  globstar?: boolean;
  strict?: boolean;
}

export interface GlobToRegExpOptions extends GlobOptions {
  flags?: string;
}

/**
 * Generate a regex based on glob pattern and options
 * This was meant to be using the the `fs.walk` function
 * but can be used anywhere else.
 * Examples:
 *
 *     Looking for all the `ts` files:
 *     walkSync(".", {
 *       match: [globToRegExp("*.ts")]
 *     })
 *
 *     Looking for all the `.json` files in any subfolder:
 *     walkSync(".", {
 *       match: [globToRegExp(join("a", "**", "*.json"),{
 *         flags: "g",
 *         extended: true,
 *         globstar: true
 *       })]
 *     })
 *
 * @param glob - Glob pattern to be used
 * @param options - Specific options for the glob pattern
 * @returns A RegExp for the glob pattern
 */
export function globToRegExp(
  glob: string,
  options: GlobToRegExpOptions = {}
): RegExp {
  const result = globrex(glob, { ...options, filepath: true });
  return result.path!.regex;
}

/** Test whether the given string is a glob */
export function isGlob(str: string): boolean {
  const chars: Record<string, string> = { "{": "}", "(": ")", "[": "]" };
  /* eslint-disable-next-line max-len */
  const regex = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;

  if (str === "") {
    return false;
  }

  let match: RegExpExecArray | null;

  while ((match = regex.exec(str))) {
    if (match[2]) return true;
    let idx = match.index + match[0].length;

    // if an open bracket/brace/paren is escaped,
    // set the index to the next closing character
    const open = match[1];
    const close = open ? chars[open] : null;
    if (open && close) {
      const n = str.indexOf(close, idx);
      if (n !== -1) {
        idx = n + 1;
      }
    }

    str = str.slice(idx);
  }

  return false;
}

export interface ExpandGlobOptions extends GlobOptions {
  root?: string;
  includeDirs?: boolean;
}

/**
 * Expand the glob string from the specified `root` directory and yield each
 * result as a `WalkInfo` object.
 */
// TODO: Use a proper glob expansion algorithm.
// This is a very incomplete solution. The whole directory tree from `root` is
// walked and parent paths are not supported.
export async function* expandGlob(
  globString: string,
  {
    root = cwd(),
    includeDirs = true,
    extended = false,
    globstar = false,
    strict = false
  }: ExpandGlobOptions = {}
): AsyncIterableIterator<WalkInfo> {
  const absoluteGlob = isAbsolute(globString)
    ? globString
    : join(root, globString);
  yield* walk(root, {
    match: [globToRegExp(absoluteGlob, { extended, globstar, strict })],
    includeDirs
  });
}

/** Synchronous version of `expandGlob()`. */
// TODO: As `expandGlob()`.
export function* expandGlobSync(
  globString: string,
  {
    root = cwd(),
    includeDirs = true,
    extended = false,
    globstar = false,
    strict = false
  }: ExpandGlobOptions = {}
): IterableIterator<WalkInfo> {
  const absoluteGlob = isAbsolute(globString)
    ? globString
    : join(root, globString);
  yield* walkSync(root, {
    match: [globToRegExp(absoluteGlob, { extended, globstar, strict })],
    includeDirs
  });
}
