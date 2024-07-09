// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Format } from "./_types.ts";

const RECOGNIZE_YAML_REGEXP = /^---yaml|= yaml =|---$/im;
const RECOGNIZE_TOML_REGEXP = /^---toml|\+\+\+|= toml =$/im;
const RECOGNIZE_JSON_REGEXP = /^---json|= json =$/im;

export const RECOGNIZE_REGEXP_MAP = {
  yaml: RECOGNIZE_YAML_REGEXP,
  toml: RECOGNIZE_TOML_REGEXP,
  json: RECOGNIZE_JSON_REGEXP,
} as const;

const EXTRACT_YAML_REGEXP =
  /^\ufeff?(?:---yaml|= yaml =|---)$([\s\S]+?)^(?:---|= yaml =)\s*$\r?\n?/im;
const EXTRACT_TOML_REGEXP =
  /^\ufeff?(?:---toml|\+\+\+|= toml =)$([\s\S]+?)^(?:---|\+\+\+|= toml =)\s*$\r?\n?/im;
const EXTRACT_JSON_REGEXP =
  /^\ufeff?(?:---json|= json =)$([\s\S]+?)^(?:---|= json =)\s*$\r?\n?/im;

export const EXTRACT_REGEXP_MAP: Record<Format, RegExp> = {
  yaml: EXTRACT_YAML_REGEXP,
  toml: EXTRACT_TOML_REGEXP,
  json: EXTRACT_JSON_REGEXP,
} as const;
