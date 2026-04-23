// Copyright 2018-2026 the Deno authors. MIT license.

export function checkWindows(): boolean {
  // deno-lint-ignore no-explicit-any
  const global = globalThis as any;

  const platform = global.process?.platform;
  if (typeof platform === "string") return platform.startsWith("win");
  const os = global.Deno?.build?.os;
  if (typeof os === "string") return os === "windows";
  return global.navigator?.platform?.startsWith("Win") ?? false;
}
