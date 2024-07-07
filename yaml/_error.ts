// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Mark } from "./_mark.ts";

export class YamlError extends Error {
  constructor(message: string, mark?: Mark) {
    super(mark ? `${message} ${mark}` : message);
    this.name = this.constructor.name;
  }
}
