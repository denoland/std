// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { dump } from "./dumper/dumper.ts";
import { DumperStateOptions } from "./dumper/dumper_state.ts";

export type DumpOptions = DumperStateOptions;

export function stringify(obj: object, options?: DumpOptions): string {
  return dump(obj, options);
}
