// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Status, STATUS_TEXT } from "./http_status.ts";
import { deepMerge } from "../collections/deep_merge.ts";

/**
 * Internal utility for returning a standardized response, automatically defining the body, status code and status text, according to the response type.
 */
export function createCommonResponse(
  status: Status,
  body?: BodyInit | null,
  init?: ResponseInit,
): Response {
  if (body === undefined) {
    body = STATUS_TEXT[status];
  }
  init = deepMerge({
    status,
    statusText: STATUS_TEXT[status],
  }, init ?? {});
  return new Response(body, init);
}
