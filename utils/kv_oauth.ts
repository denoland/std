// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { createClient } from "deno_kv_oauth";

export const client = createClient("github");
