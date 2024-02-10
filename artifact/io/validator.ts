import Ajv, { ErrorObject } from 'https://esm.sh/ajv@8.12.0'

export default (schema: object) => {
  const ajv = loadAjv()
  const validate = ajv.compile(schema)

  return (parameters: object) => {
    if (!validate(parameters)) {
      if (!validate.errors) {
        return
      }
      throwIfNotValid(validate.errors)
    }
  }
}

let _ajv: Ajv | undefined
const loadAjv = () => {
  if (!_ajv) {
    _ajv = new Ajv({ allErrors: true })
  }
  return _ajv
}
const throwIfNotValid = (ajvErrors: ErrorObject[]) => {
  if (!ajvErrors) {
    return
  }
  const reasons = ajvErrors
    .map((obj) => JSON.stringify(obj, null, '  '))
    .join('\n')
  const error = new Error(`Parameters Validation Error: ${reasons}`)
  throw error
}
