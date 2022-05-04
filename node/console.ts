// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { Console } from "./internal/console/constructor.mjs";

export default Object.assign({}, console, { Console });

export { Console };
export const {
  assert,
  clear,
  count,
  countReset,
  debug,
  dir,
  dirxml,
  error,
  group,
  groupCollapsed,
  groupEnd,
  info,
  log,
  table,
  time,
  timeEnd,
  timeLog,
  trace,
  warn,
} = console;
