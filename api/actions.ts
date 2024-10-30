// purpose is to turn a napp api into an object with functions
// types correct on the functions and return types

import { assert } from '@std/assert'
import { parse } from '@std/jsonc'
import { nappSchema } from '@artifact/napp-tools'
import type { NappTypes } from './napps-list.ts'
import { z } from 'zod'
import { Ajv } from 'ajv'
import { betterAjvErrors } from '@apideck/better-ajv-errors'
const ajv = new Ajv({ allErrors: true })

type Action = {
  napp: string
  tool: string
  parameters: Record<string, unknown>
  /** An array of filepaths to files and directories that are attached to this
   * action */
  files: string[]
}

/**
 * Given a napp name, generate a set of action creators.
 * @param name the name of the napp to generate functions for
 * @example
 * const functions = await functions('@artifact/files')
 */
const functions = async <T extends keyof NappTypes>(name: T) => {
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

export default functions

const readNappConfig = async (name: string) => {
  const url = import.meta.resolve(name)
  assert(url.endsWith('mod.ts'), 'napp must end in mod.ts')
  const configUrl = url.substring(0, url.length - 'mod.ts'.length) +
    'napp.jsonc'
  const file = await readUrl(configUrl)
  const config = parse(file)

  return nappSchema.parse(config)
}

const readUrl = async (urlString: string) => {
  const url = new URL(urlString)
  if (url.protocol === 'file:') {
    return await Deno.readTextFile(url.pathname)
  } else if (url.protocol === 'http:' || url.protocol === 'https:') {
    // TODO use jsr registry tools to pull in the whole module for reading
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }
    return await response.text()
  } else {
    throw new Error(`Unsupported protocol: ${url.protocol}`)
  }
}

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
type Literal = z.infer<typeof literalSchema>
export type JsonValue = Literal | { [key: string]: JsonValue } | JsonValue[]
export const jsonSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
)

export const serializableError = z.object({
  name: z.string().optional(),
  message: z.string(),
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

export const META_SYMBOL = Symbol.for('settling commit')
export type Meta = {
  parent?: CommitOid
  // TODO add the PID so we know what the id of the branch that returned was
}
export const withMeta = async <T>(promise: MetaPromise<T>) => {
  const result = await promise
  assert(META_SYMBOL in promise, 'missing commit symbol')
  const meta = promise[META_SYMBOL]
  assert(typeof meta === 'object', 'missing meta on promise')
  const { parent } = meta
  if (parent) {
    assert(typeof parent === 'string', 'missing parent commit')
    assert(sha1.test(parent), 'commit not sha1: ' + parent)
  }
  return { result, parent }
}
export type MetaPromise<T> = Promise<T> & { [META_SYMBOL]?: Meta }
