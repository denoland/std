import { JsonSchema7ObjectType, zodToJsonSchema } from 'zod-to-json-schema'
import { ZodSchema } from 'zod'
import type { Napp } from './nappSchema.ts'

export const inject = (napp: Napp, toolsSchema: ZodSchema) => {
  // convert the schema to jsonschema, strip out anything in the object that
  // is already in the schema, inject everything back into the object, return
  // the new object

  // const schema = zodToJsonSchema(parameters[key])
  // delete schema.$schema
}
