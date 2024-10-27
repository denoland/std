// purpose is to turn a napp api into an object with functions
// types correct on the functions and return types

import type { Napp } from '@artifact/napp-tools/mod.ts'

// depending on whatever api is dropped in, this can generate functions
// externally or internally.  Internally, the comparment would generate these
// functions 



const functions = (napp: Napp, api: NappApi ) => {

    // the napp should have its code module loaded too ?
    // So this is how we get the types of the functions we are going to call ?
    // this is a way to turn a js function into a json object

    // should the addressing be done in the api ?

    // where is the code import ?  Might not be able to be typed ?
    // types could be a convention and be exported by all types of packages.
    // like a header file that is 

    const actions: DispatchFunctions = {}
    for (const functionName in this.#napp.parameters) {
      actions[functionName] = this.#toFunction(functionName, api)
    }
    return actions as T
  }
  #toFunction(functionName: string, api: IA) {
    return (parameters?: Params) => {
      log('dispatch: %o', functionName)
      if (parameters === undefined) {
        parameters = {}
      }
      const schema = this.#napp.parameters[functionName]
      const path = this.#isolate + '/' + functionName
      try {
        schema.parse(parameters)
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        throw new Error(
          `Zod schema parameters validation error at path: ${path}\nError: ${message}`,
        )
      }
      return Promise.resolve(
        this.#napp.functions[functionName](parameters, api),
      )
        .then((result) => {
          const schema = this.#napp.returns[functionName]
          const parsed = schema.safeParse(result)
          if (!parsed.success) {
            throw new Error(
              `Unrecoverable system error in ${path}. ${parsed.error.message}`,
            )
          }
          return result
        })
    }
  }