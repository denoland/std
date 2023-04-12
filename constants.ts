// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export const SITE_NAME = "Your SaaS";
export const SITE_DESCRIPTION = "Some details about your SaaS.";

export const AUTHENTICATED_REDIRECT_PATH = "/dashboard";

export const STRIPE_PREMIUM_PLAN_PRICE_ID = "price_1MPiEkD6QJts4RaYcp1SevPe";

export const FREE_PLAN_TODOS_LIMIT = 5;

/**
 * These are base styles for some elements. This approach is chosen as it avoids more complex alternatives:
 * 1. Writing custom classes in Tailwind CSS (see https://tailwindcss.com/docs/reusing-styles#compared-to-css-abstractions)
 * 2. Writing custom components which offer no additional funtionality beyond styling
 */
export const BASE_BUTTON_STYLES =
  "px-4 py-2 bg-pink-700 text-white text-lg rounded-full hover:bg-black transition duration-300 disabled:(opacity-50 cursor-not-allowed)";
export const BASE_INPUT_STYLES =
  "px-4 py-2 bg-white rounded-full border-1 border-gray-300 hover:border-black transition duration-300 disabled:(opacity-50 cursor-not-allowed)";
