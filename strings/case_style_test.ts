// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assert } from "../testing/asserts.ts";
import { validate, caseStyle } from "./case_style.ts";

test({
  name: "[string] Case style validator",
  fn(): void {
    assert(validate("jaime-les-fruits-au-sirop", caseStyle.kebabCase));
    assert(validate("jaime_les_fruits_au_sirop", caseStyle.snakeCase));
    assert(validate("jaimeLesFruitsAuSirop", caseStyle.camelCase));
    assert(validate("JaimeLesFruitsAuSirop", caseStyle.pascalCase));
    assert(!validate("OhMyGodASnake", caseStyle.snakeCase));
    assert(!validate("imNotPascal", caseStyle.pascalCase));
    assert(!validate("SmokingIsBad", caseStyle.camelCase));
    assert(!validate("salade_TomateOignons", caseStyle.kebabCase));
  }
});
