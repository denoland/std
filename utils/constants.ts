// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export const SITE_NAME = "Deno Hunt (Beta)";
export const SITE_DESCRIPTION = "Discover new Deno projects. Share your own.";

/**
 * These are base styles for some elements. This approach is chosen as it avoids more complex alternatives:
 * 1. Writing custom classes in Tailwind CSS (see https://tailwindcss.com/docs/reusing-styles#compared-to-css-abstractions)
 * 2. Writing custom components which offer no additional functionality beyond styling
 */
export const BUTTON_STYLES =
  "px-4 py-2 bg-primary text-white rounded-lg border-1 border-primary transition duration-300 disabled:(opacity-50 cursor-not-allowed) hover:enabled:(bg-transparent text-primary)";
export const INPUT_STYLES =
  "px-4 py-2 bg-transparent rounded rounded-lg outline-none border-1 border-gray-300 hover:border-black transition duration-300 disabled:(opacity-50 cursor-not-allowed) dark:(hover:border-white)";
export const SITE_BAR_STYLES = "flex justify-between p-4 gap-4";
export const NAV_STYLES =
  "flex flex-wrap justify-start gap-x-8 gap-y-4 items-center justify-between h-full";
export const LINK_STYLES =
  "text-gray-500 transition duration-300 hover:(text-black dark:text-white)";
export const ACTIVE_LINK_STYLES = LINK_STYLES + " !text-black !dark:text-white";
export const HEADING_STYLES = "text-3xl font-bold";
export const HEADING_WITH_MARGIN_STYLES = HEADING_STYLES + " mb-8";
