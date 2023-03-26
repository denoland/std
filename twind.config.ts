import type { Options } from "$fresh/plugins/twind.ts";
import * as colors from "twind/colors";

export default {
  selfURL: import.meta.url,
  theme: {
    colors: {
      // This line is required. Otherwise, if removed, the values of other colors with be removed.
      ...colors,
      // Modify primary and secondary colors according to your color-scheme
      primary: "#4f06be",
      secondary: "#170139",
    },
  },
} as Options;
