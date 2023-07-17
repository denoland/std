// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Options } from "$fresh/plugins/twindv1.ts";
import { defineConfig, Preset } from "@twind/core";
// twind preset
import presetTailWind from "twind-preset-tailwind/base";
import * as colors from "twind-preset-tailwind/colors";
import ext from "twind-preset-ext";

/** @todo Remove the need for type-assertions */
export default {
  selfURL: import.meta.url,
  // <BaseTheme, Preset<any>[]>
  ...defineConfig({
    presets: [
      /**
       * Note: `presetAutoprefix()` was removed as it seemed to make no visual or functional difference to the website.
       * If styling issues re-occur in the future, try adding `presetAutoprefix()` back here.
       * @see {@link https://github.com/denoland/saaskit/pull/282}
       */
      presetTailWind({
        colors: {
          // This line is required. Otherwise, if removed, the values of other colors with be removed.
          ...colors,
          // Modify primary and secondary colors according to your color-scheme
          primary: "#be185d",
          secondary: "#4338ca",
        },
        // deno-lint-ignore no-explicit-any
      }) as Preset<any>,
      ext() as Preset,
    ],
  }),
} as Options;
