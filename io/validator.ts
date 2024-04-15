import ajvModule, { ErrorObject } from 'ajv'
const Ajv = ajvModule.default

import { assert } from '@utils'

let _ajv: typeof Ajv.prototype | undefined
const loadAjv = () => {
  if (!_ajv) {
    _ajv = new Ajv({ allErrors: true })
  }
  return _ajv
}

export default (schema: object) => {
  const ajv = loadAjv()
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
