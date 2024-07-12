// Ported and adapted from js-yaml-js-types v1.0.0:
// https://github.com/nodeca/js-yaml-js-types/tree/ac537e7bbdd3c2cbbd9882ca3919c520c2dc022b
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Type } from "../_type.ts";

const REGEXP = /^\/(?<regexp>[\s\S]+)\/(?<modifiers>[gismuy]*)$/;

export const regexp: Type<RegExp> = {
  tag: "tag:yaml.org,2002:js/regexp",
  kind: "scalar",
  // deno-lint-ignore no-explicit-any
  resolve(data: any) {
    if ((data === null) || (!data.length)) {
      return false;
    }

    const regexp = `${data}`;
    if (regexp.charAt(0) === "/") {
      // Ensure regex is properly terminated
      if (!REGEXP.test(data)) {
        return false;
      }
      // Check no duplicate modifiers
      const modifiers = [...(regexp.match(REGEXP)?.groups?.modifiers ?? "")];
      if (new Set(modifiers).size < modifiers.length) {
        return false;
      }
    }

    return true;
  },
  construct(data: string) {
    const { regexp = `${data}`, modifiers = "" } =
      `${data}`.match(REGEXP)?.groups ?? {};
    return new RegExp(regexp, modifiers);
  },
  predicate(object: unknown) {
    return object instanceof RegExp;
  },
  represent(object: RegExp) {
    return object.toString();
  },
};
