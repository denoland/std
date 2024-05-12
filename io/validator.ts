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

export default (schema: object, functionName: string) => {
  const ajv = loadAjv()
  const validate = ajv.compile(schema)

  return (parameters: object) => {
    if (!validate(parameters)) {
      assert(validate.errors, 'validate.errors is missing')
      throwIfNotValid(validate.errors, functionName)
    }
  }
}

const throwIfNotValid = (ajvErrors: ErrorObject[], functionName: string) => {
  const reasons = ajvErrors
    .map((obj) => JSON.stringify(obj, null, '  '))
    .join('\n')
  const msg = `Parameters Validation Error in ${functionName}: ${reasons}`
  throw new Error(msg)
}
