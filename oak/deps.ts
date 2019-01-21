// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

// This file contains the external dependencies that oak depends upon

export {
  Response as ServerResponse,
  serve,
  ServerRequest
} from "../http/mod.ts";
export { Status, STATUS_TEXT } from "../http/http_status.ts";
export {
  basename,
  extname,
  join,
  isAbsolute,
  normalize,
  parse,
  resolve,
  sep
} from "../fs/path/mod.ts";
export { contentType } from "../media_types/mod.ts";
