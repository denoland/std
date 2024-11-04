// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { SnapshotPlugin } from "./_types.ts";

const INTERNAL_PLUGINS: SnapshotPlugin[] = [
  // TODO(eryue0220): support internal snapshot serializer plugins
];

export function addSnapshotSerializer(plugin: SnapshotPlugin) {
  INTERNAL_PLUGINS.unshift(plugin);
}

export function getSnapshotSerializer() {
  return INTERNAL_PLUGINS;
}
