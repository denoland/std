// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RedirectStatus } from "std/http/http_status.ts";

export function redirect(location: string, status: RedirectStatus = 303) {
  return new Response(null, {
    headers: {
      location,
    },
    status,
  });
}
