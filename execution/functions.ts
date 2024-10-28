// purpose is to turn a napp api into an object with functions
// types correct on the functions and return types

import { assert } from '@std/assert'
import { parse } from '@std/jsonc'
import { nappSchema } from '@artifact/napp-tools'
// deno has no dynamic runtime imports, so this is a workaround
import napps from './napps-import.ts'
import { fromFileUrl, toFileUrl } from '@std/path'

import { Ajv } from 'ajv'
import { betterAjvErrors } from '@apideck/better-ajv-errors'
const ajv = new Ajv({ allErrors: true })

type Action = {
  napp: string
  tool: string
  parameters: Record<string, unknown>
}

/**
 * Given a napp name, generate
 * @param name the name of the napp to generate functions for
 * @example
 * const functions = await functions('@artifact/files')
 */
const functions = async (name: keyof typeof napps) => {
  const napp = napps[name]

  const config = await readNappConfig(name)

  // now we need to resolve all the imported tools

  const actionCreators = {} as Record<
    string,
    (params?: Record<string, unknown>) => Action
  >
  if (!config.tools) {
    return actionCreators
  }
  for (const [tool, schema] of Object.entries(config.tools)) {
    if (typeof schema === 'string') {
      console.log('string tool', tool)
      // const toolConfig = await readNappConfig(tool)
    } else {
      const { parameters, returns } = schema
      if (parameters) {
        assert(returns, 'tool must have returns: ' + tool)
        actionCreators[tool] = (params: Record<string, unknown> = {}) => {
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
          }
        }
      }
    }
  }
  console.log(config.tools)

  return actionCreators

  // should the schema be resolved as part of the publication step ?
  // what about rewiring the imports ?

  // read in the direct schema
  // read in the resolved schema
  console.log('napp', napp)

  // turn the zod object into action creators

  // the napp might actually not be importable, but the schemas should be
  // whether it is zod or jsonschema, we should be able to get the types from
  // them

  // then from the schemas, product action creators

  // should the addressing be done in the api ?

  // where is the code import ?  Might not be able to be typed ?
  // types could be a convention and be exported by all types of packages.
  // like a header file that is
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
