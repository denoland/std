#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write
// Copyright 2018-2026 the Deno authors. MIT license.

// JSON version of the full canonical list of named HTML entities
// https://html.spec.whatwg.org/multipage/named-characters.html
// This is a one-off codegen fetch of a spec data file, not a project
// dependency, so it is imported directly rather than via the import map.
// deno-lint-ignore no-import-prefix
import entityList from "https://html.spec.whatwg.org/entities.json" with {
  type: "json",
};

const data = Object.fromEntries(
  Object.entries(entityList).map(([k, v]) => [k, v.characters]),
);

await Deno.writeTextFile(
  new URL(import.meta.resolve("../named_entity_list.json")),
  JSON.stringify(data, null, 2) + "\n",
);
