/**
 * Things to check before publishing:
 * - name and version match (must be able to pull this over from the deno.json)
 * - napp format must pass, and the schema must pass using zod checker
 * - branding files must be present and resolvable to a hash
 * - tools must all resolve
 * - parameters of tools must minimally match the resolution
 * - referenced napps must be resolved
 * - referenced napps must be in the deno imports field
 * - napp does not reference itself by its own name
 * - napp does not reference itself using a dependencies map
 */

// verify the exported zod schema generates the same json-schema as the
// napp.jsonc, and if so, use the zod schema.
// also allow generation of ajv compiled schemas for speed

// this would be a convention on the exports of the module, that is specific for
// a particular runtime, like deno can have some defaults like zod schemas or
// ajv compilations, but these can be overridden on the runtime object.

// if the runtime is a string, use the defaults, else can override and see what
// the defaults are.

// do we need to make a tooling function that can retrieve an md file from a
// package but importing the package, then reading from the url ?
