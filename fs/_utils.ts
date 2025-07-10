// Copyright 2018-2025 the Deno authors. MIT license.
// deno-lint-ignore-file no-explicit-any

/**
 * True if the runtime is Deno, false otherwise.
 */
export const isDeno = navigator.userAgent?.includes("Deno");

/**
 * @returns The Node.js `fs` module.
 */
export function getNodeFs() {
  return (globalThis as any).process.getBuiltinModule("node:fs");
}

/**
 * @returns The Node.js `os` module.
 */
export function getNodeOs() {
  return (globalThis as any).process.getBuiltinModule("node:os");
}

/**
 * @returns The Node.js `path` module.
 */
export function getNodePath() {
  return (globalThis as any).process.getBuiltinModule("node:path");
}

/**
 * @returns The Node.js `process` module.
 */
export function getNodeProcess() {
  return (globalThis as any).process.getBuiltinModule("node:process");
}

/**
 * @returns The Node.js `stream` module.
 */
export function getNodeStream() {
  return (globalThis as any).process.getBuiltinModule("node:stream");
}

/**
 * @returns The Node.js `tty` module.
 */
export function getNodeTty() {
  return (globalThis as any).process.getBuiltinModule("node:tty");
}

/**
 * @returns The Node.js `util` module.
 */
export function getNodeUtil() {
  return (globalThis as any).process.getBuiltinModule("node:util");
}

/**
 * Used for naming temporary files. See {@linkcode makeTempFile} and
 * {@linkcode makeTempFileSync}.
 * @returns A randomized 6-digit hexadecimal string.
 */
export function randomId(): string {
  const n = (Math.random() * 0xfffff * 1_000_000).toString(16);
  return "".concat(n.slice(0, 6));
}
