// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assert, assertEquals } from "../testing/asserts.ts";
import { validate, format, caseStyle } from "./case_style.ts";

test({
  name: "[string] Case style validator",
  fn(): void {
    assert(validate("jaime-les-fruits-au-sirop", caseStyle.kebabCase));
    assert(validate("jaime_les_fruits_au_sirop", caseStyle.snakeCase));
    assert(validate("jaimeLesFruitsAuSirop", caseStyle.camelCase));
    assert(validate("JaimeLesFruitsAuSirop", caseStyle.pascalCase));
    assert(validate("DIZ_IZ_DA_GLOBAL_VAL", caseStyle.screamingSnakeCase));
    assert(validate("SALADE-TOMATE-OIGNONS", caseStyle.screamingKebabCase));
    assert(!validate("OhMyGodASnake", caseStyle.snakeCase));
    assert(!validate("imNotPascal", caseStyle.pascalCase));
    assert(!validate("SmokingIsBad", caseStyle.camelCase));
    assert(!validate("salade_TomateOignons", caseStyle.kebabCase));
    assert(
      !validate("jaime-les-fruits-au-sirop", caseStyle.screamingSnakeCase)
    );
    assert(
      !validate("jaime_les_fruits_au_sirop", caseStyle.screamingKebabCase)
    );
  }
});

test({
  name: "[string] Case style validator",
  fn(): void {
    const input = `deja vu i've just been in this place before
    Higher on the street
And I know it's my time to go…`;
    assertEquals(
      format(input, caseStyle.kebabCase),
      "deja-vu-i-ve-just-been-in-this-place-before-higher-on-the-street-and-i-know-it-s-my-time-to-go"
    );
    assertEquals(
      format(input, caseStyle.snakeCase),
      "deja_vu_i_ve_just_been_in_this_place_before_higher_on_the_street_and_i_know_it_s_my_time_to_go"
    );
    assertEquals(
      format(input, caseStyle.camelCase),
      "dejaVuIVeJustBeenInThisPlaceBeforeHigherOnTheStreetAndIKnowItSMyTimeToGo"
    );
    assertEquals(
      format(input, caseStyle.pascalCase),
      "DejaVuIVeJustBeenInThisPlaceBeforeHigherOnTheStreetAndIKnowItSMyTimeToGo"
    );
    assertEquals(
      format(input, caseStyle.screamingSnakeCase),
      "DEJA_VU_I_VE_JUST_BEEN_IN_THIS_PLACE_BEFORE_HIGHER_ON_THE_STREET_AND_I_KNOW_IT_S_MY_TIME_TO_GO"
    );
    assertEquals(
      format(input, caseStyle.screamingKebabCase),
      "DEJA-VU-I-VE-JUST-BEEN-IN-THIS-PLACE-BEFORE-HIGHER-ON-THE-STREET-AND-I-KNOW-IT-S-MY-TIME-TO-GO"
    );
  }
});
