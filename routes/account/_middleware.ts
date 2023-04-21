// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { State } from "@/routes/_middleware.ts";
import type { Session } from "@supabase/supabase-js";
import { ensureLoggedInMiddleware } from "@/utils/auth.ts";

export interface AccountState extends State {
  session: Session;
}

export const handler = ensureLoggedInMiddleware;
