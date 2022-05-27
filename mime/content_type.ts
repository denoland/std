// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
// Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
// Copyright (c) 2020-2022 the oak authors
// mime_db is copied from https://raw.githubusercontent.com/jshttp/mime-db/v1.52.0/db.json

import db from "./mime_db.json" assert { type: "json" };

const EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
const TEXT_TYPE_REGEXP = /^text\//i;

const extensionToType = new Map<string, string>();

for (const [name, type] of Object.entries(db)) {
  if ("extensions" in type) {
    let mimeType = name;
    const cs = charset(mimeType, "charset" in type ? type.charset : undefined);
    if (cs) {
      mimeType += `; charset=${cs}`;
    }
    for (const ext of type.extensions) {
      extensionToType.set(`.${ext}`, mimeType);
    }
  }
}

function charset(
  type: string,
  defaultCharset: string | undefined,
): string | undefined {
  const m = EXTRACT_TYPE_REGEXP.exec(type);
  if (!m) return undefined;
  const [match] = m;

  if (defaultCharset) {
    return defaultCharset;
  }

  if (TEXT_TYPE_REGEXP.test(match)) {
    return "UTF-8";
  }

  return undefined;
}

/**
 * `contentType` returns the MIME type associated with the file extension `ext`.
 * The extension `ext` should begin with a leading dot, as in ".html". When
 * `ext` has no associated type, this function returns `undefined`.
 */
export function contentType(ext: string): string | undefined {
  return extensionToType.get(ext.toLowerCase());
}
