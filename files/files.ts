import Debug from 'debug'
import type * as schemas from './zod.ts'
import type { z, ZodSchema } from 'zod'

// export const functions: Functions<Api> = {
type ToApi<P extends ZodSchema, R extends ZodSchema> = (
  params: z.infer<P>,
) => z.infer<R> | Promise<z.infer<R>>

// this is the api we export to the world
type Write = ToApi<
  typeof schemas.write.parameters,
  typeof schemas.write.returns
>
type WriteApi = Function<Write>

export const write: WriteApi = ({ path, content = '' }, api) => {
  log('add', path, content)
  // api.write(path, content)
  return { charactersWritten: content.length }
}

export type Functions<Api> = {
  [K in keyof Api]: Function<Api[K]>
}

type Function<T> = T extends (...args: infer Args) => infer R
  ? (...args: [...Args, string]) => R
  : never

export type Returns<T extends Record<string, ZodSchema>> = {
  [K in keyof T]: ZodSchema
}
// TODO ensure that function return types are inferred from returns object
export type ToApiType<
  P extends Record<string, ZodSchema>,
  R extends Returns<P>,
> = {
  [K in keyof P]: (
    params: z.infer<P[K]>,
  ) => z.infer<R[K]> | Promise<z.infer<R[K]>>
}

const log = Debug('AI:files')
// export const functions: Functions<Api> = {
//   write: ({ path, content = '' }, api) => {
//     log('add', path, content)
//     api.write(path, content)
//     return { charactersWritten: content.length }
//   },
//   ls: async ({ path = '.', count, all }, api) => {
//     log('ls', path)
//     let result = await api.ls(path)
//     if (!all) {
//       result = result.filter((name) => !name.startsWith('.'))
//     }
//     if (count) {
//       return result.length
//     }
//     return result
//   },
//   read: async ({ path }, api) => {
//     log('read', path, print(api.pid))
//     const result = await api.read(path)
//     log('read result', result)
//     return result
//   },
//   // TODO migrate this to be linecount updates, not regex
//   update: async ({ expectedMatches, path, regex, replacement }, api) => {
//     log('update', expectedMatches, path, regex, replacement)
//     const contents = await api.read(path)
//     const { matches, result } = replace(contents, regex, replacement)
//     if (matches.length !== expectedMatches) {
//       throw new Error(
//         `Expected ${expectedMatches} matches but found ${matches.length}`,
//       )
//     }
//     api.write(path, result)
//     return { matchesUpdated: matches.length }
//   },
//   // TODO make a json update tool that specifies a path in the object to change
//   // by using a standard json path specification
//   rm: ({ path }, api) => {
//     log('rm', path)
//     api.delete(path)
//   },
//   mv: ({ from, to }, api) => {
//     log('mv', from, to)
//     return api.mv(from, to)
//   },
//   cp: ({ from, to }, api) => {
//     log('cp', from, to)
//     return api.cp(from, to)
//   },
//   search: async ({ query }, api) => {
//     log('search', query, print(api.pid))

//     // to start with, this function should just return all the file paths ?
//     // or, read everything in, and make a call based on the contents of all ?

//     // read all files and then pump into context, who cares about the price ?
//     // or vector store them all based on dir hashes ?
//     const ls = await api.ls()
//     return ls.map((path) => ({ path, description: '' }))
//   },
// }
export const replace = (
  contents: string,
  regex: string,
  replacement: string,
) => {
  const matches = contents.match(new RegExp(regex, 'g')) || []
  const result = contents.replace(new RegExp(regex, 'g'), replacement)
  return { matches, result }
}
