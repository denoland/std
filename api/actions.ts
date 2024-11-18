import { readNappConfig } from '@artifact/napp-tools'
import { assert } from '@std/assert'
import type { NappTypes } from './napps-list.ts'
import { z } from 'zod'
import { Ajv } from 'ajv'
import { betterAjvErrors } from '@apideck/better-ajv-errors'
const ajv = new Ajv({ allErrors: true })

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
type Literal = z.infer<typeof literalSchema>
export type JsonValue =
  | Literal
  | { [key: string]: JsonValue | undefined }
  | JsonValue[]
export const jsonSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema.optional())])
)

const nappName = z.string()

export const actionSchema = z.object({
  napp: nappName,
  tool: z.string(),
  parameters: z.record(jsonSchema),
  /** An array of filepaths to files and directories that are attached to this
   * action */
  files: z.array(z.string()).optional(),
})
export type Action = z.infer<typeof actionSchema>

/**
 * Given a napp name, generate a set of action creators.
 * @param name the name of the napp to generate functions for
 * @example
 * const functions = await actionCreators('@artifact/files')
 */
const actionCreators = async <T extends keyof NappTypes>(name: T) => {
  const config = await readNappConfig(name)
  type Tools = NappTypes[T]

  const actionCreators = {} as {
    [K in keyof Tools]: (
      params: Parameters<Tools[K]>[0],
    ) => Action
  }

  if (!config.tools) {
    return actionCreators
  }
  for (const [tool, schema] of Object.entries(config.tools)) {
    if (typeof schema === 'string') {
      console.log('string tool', tool, schema)
      // const toolConfig = await readNappConfig(tool)
    } else {
      const { parameters, returns } = schema
      if (parameters) {
        assert(returns, 'tool must have returns: ' + tool)
        type Params = Parameters<Tools[typeof tool]>[0]
        actionCreators[tool as keyof Tools] = (params: Params = {}): Action => {
          if (typeof params !== 'object') {
            throw new Error('parameters must be an object')
          }
          if (params === null) {
            throw new Error('parameters must not be null')
          }

          const valid = ajv.validate(parameters, params)

          if (!valid) {
            const betterErrors = betterAjvErrors({
              basePath: 'parameters',
              schema: parameters,
              data: params,
              errors: ajv.errors,
            })
            const message = betterErrors.map((e) => JSON.stringify(e, null, 2))
              .join('\n')
            throw new Error('Invalid parameters: ' + message)
          }
          return {
            napp: name,
            tool,
            parameters: params,
            files: [],
          }
        }
      }
    }
  }

  return actionCreators

  // need to include the types in the package, and sniff for them
}

export default actionCreators

export const serializableError = z.object({
  name: z.string().optional(),
  message: z.string().optional(),
  stack: z.string().optional(),
})
export type SerializableError = z.infer<typeof serializableError>

export const outcomeSchema = z.object({
  result: jsonSchema.optional(),
  error: serializableError.optional(),
}).refine((data) => {
  if (data.error !== undefined) {
    return data.result === undefined
  }
  return true
}, 'result and error are mutually exclusive')

export type Outcome = { result?: JsonValue; error?: SerializableError }
