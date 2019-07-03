// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { safeDump } from "./dumper/dumper.ts";
import { DumperStateOptions } from "./dumper/DumperState.ts";

export type DumpOptions = DumperStateOptions;

export function stringify(obj: object, options?: DumpOptions): string {
  return safeDump(obj, options);
}
