import ajvModule, { ErrorObject } from 'ajv'
const Ajv = ajvModule.default

import { assert } from '@utils'

export default (schema: object) => {
  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(schema)

  return (parameters: object) => {
    if (!validate(parameters)) {
      assert(validate.errors, 'validate.errors is missing')
      throwIfNotValid(validate.errors)
    }
  }
}

const throwIfNotValid = (ajvErrors: ErrorObject[]) => {
  const reasons = ajvErrors
    .map((obj) => JSON.stringify(obj, null, '  '))
    .join('\n')
  const error = new Error(`Parameters Validation Error: ${reasons}`)
  throw error
}
