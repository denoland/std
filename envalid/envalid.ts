import { CleanOptions, ValidatorSpec } from "./types.ts";
import { getSanitizedEnv } from "./core.ts";
import { applyDefaultMiddleware } from "./middleware.ts";

/**
 * Returns a sanitized, immutable environment object. _Only_ the variables
 * specified in the `specs` parameter will be accessible on the returned
 * object.
 *
 * @param environment An object containing the variables, e.g. `Deno.env.toObject()`.
 * @param specs The specification to enforce on the environment.
 * @param options
 */
export function cleanEnv<T extends Record<never, never>>(
  environment: unknown,
  specs: { [K in keyof T]: ValidatorSpec<T[K]> },
  options: CleanOptions<T> = {},
): Readonly<T> {
  const cleaned = getSanitizedEnv(environment, specs, options);
  return Object.freeze(applyDefaultMiddleware(cleaned, environment));
}

/**
 * Returns a sanitized, immutable environment object, and passes it through a custom
 * `applyMiddleware` function. This won't be required in most use cases.
 *
 * @param environment An object containing the variables, e.g. `Deno.env.toObject()`.
 * @param specs  The specification to enforce on the environment.
 * @param applyMiddleware A function that applies transformations to the cleaned environment.
 * @param options
 */
export function customCleanEnv<T, MW>(
  environment: unknown,
  specs: { [K in keyof T]: ValidatorSpec<T[K]> },
  applyMiddleware: (cleaned: T, rawEnv: unknown) => MW,
  options: CleanOptions<T> = {},
): Readonly<MW> {
  const cleaned = getSanitizedEnv(environment, specs, options);
  return Object.freeze(applyMiddleware(cleaned, environment));
}
