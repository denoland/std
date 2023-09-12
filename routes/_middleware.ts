// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { setSessionState } from "@/middleware/session.ts";

export const handler = [
  setSessionState,
];
