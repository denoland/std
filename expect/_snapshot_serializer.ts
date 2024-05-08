// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { SnapshotPlugin } from "./_types.ts";

let INTERNAL_PLUGINS: SnapshotPlugin[] = [
  // Todo: support serialize plugin
];

export function addSerializer(plugin: SnapshotPlugin): void {
  INTERNAL_PLUGINS = [plugin, ...INTERNAL_PLUGINS];
}

export function getSerializer() {
  return INTERNAL_PLUGINS;
}
