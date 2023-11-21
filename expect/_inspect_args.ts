// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

export function inspectArgs(args: unknown[]): string {
  return args.map(inspectArg).join(", ");
}

export function inspectArg(arg: unknown): string {
  return typeof Deno !== "undefined" && Deno.inspect
    ? Deno.inspect(arg)
    : String(arg);
}
