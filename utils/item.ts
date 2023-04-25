// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Database } from "@/utils/supabase_types.ts";

export type Item = Database["public"]["Tables"]["items"]["Row"];
