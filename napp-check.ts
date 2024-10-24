/**
 * Things to check before publishing:
 * - name and version match (must be able to pull this over from the deno.json)
 * - napp format must pass, and the schema must pass using zod checker
 * - branding files must be present and resolvable to a hash
 * - tools must all resolve
 * - parameters of tools must minimally match the resolution
 * - referenced napps must be resolved
 * - referenced napps must be in the deno imports field
 */
