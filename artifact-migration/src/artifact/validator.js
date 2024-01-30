import Ajv from 'npm:ajv'

import assert from 'npm:assert-fast'

export default (schema) => {
  const ajv = loadAjv()
  const validate = ajv.compile(schema)

  return (parameters) => {
    if (!validate(parameters)) {
      throwIfNotValid(validate.errors)
    }
  }
}

let _ajv
const loadAjv = () => {
  if (!_ajv) {
    _ajv = new Ajv({ allErrors: true })
  }
  return _ajv
}
const throwIfNotValid = (ajvErrors) => {
  if (!ajvErrors) {
    return
  }
  assert(Array.isArray(ajvErrors))
  const reasons = ajvErrors
    .map((obj) => JSON.stringify(obj, null, '  '))
    .join('\n')
  const error = new Error(`Parameters Validation Error: ${reasons}`)
  throw error
}
