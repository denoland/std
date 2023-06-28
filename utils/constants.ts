// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export const SITE_NAME = "Deno Hunt (Beta)";
export const SITE_DESCRIPTION = "Discover new Deno projects. Share your own.";
export const REDIRECT_PATH_AFTER_LOGIN = "/";

/**
 * These are base styles for some elements. This approach is chosen as it avoids more complex alternatives:
 * 1. Writing custom classes in Tailwind CSS (see https://tailwindcss.com/docs/reusing-styles#compared-to-css-abstractions)
 * 2. Writing custom components which offer no additional functionality beyond styling
 */
export const BUTTON_STYLES =
  "px-4 py-2 bg-primary text-white text-lg rounded-lg border-1 border-primary transition duration-300 disabled:(opacity-50 cursor-not-allowed) hover:(bg-transparent text-primary)";
export const INPUT_STYLES =
  "px-4 py-2 bg-transparent rounded rounded-lg outline-none border-1 border-gray-300 hover:border-black transition duration-300 disabled:(opacity-50 cursor-not-allowed) dark:(hover:border-white)";
export const SITE_WIDTH_STYLES = "mx-auto max-w-7xl w-full";
