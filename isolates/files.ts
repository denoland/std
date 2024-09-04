import { Debug } from '@utils'
import { Functions, print, toApi, ToApiType } from '@/constants.ts'
import { z } from 'zod'
const log = Debug('AI:files')

export const parameters = {
  write: z.object({
    path: z.string().describe('the relative path to the file'),
    content: z.string().optional().describe(
      'the contents of the file to be written',
    ),
  }).describe(
    'Write to a file with optional contents.  Will overwrite existing files.  Will create all required parent directories. Returns the number of characters written in the operation',
  ),
  ls: z.object({
    path: z.string().optional().describe(
      'the relative path to the directory you want to list',
    ),
    count: z.boolean().optional().describe(
      'count the number of files and return this instead of the names of the files',
    ),
    all: z.boolean().optional().describe(
      'include all files including hidden files in the operation',
    ),
  }).describe(
    'List files for a given path. Returns file names with directory names ending in "/".  The root ("/") is actually just ".".  To count the number of files instead of list them, set "count" to true.  To include hidden files in the list or count, set "all" to true.',
  ),
  read: z.object({
    reasoning: z.array(z.string()).describe(
      'the brief step by step reasoning why this function was called and what it is trying to achieve',
    ),
    path: z.string().describe('the relative path to the file you want to read'),
  }).describe('Read a file.  The contents will be returned as a string.'),
  update: z.object({
    path: z.string().describe(
      'the relative path to the file you want to update',
    ),
    regex: z.string().describe('a regular expression string'),
    replacement: z.string().describe('the replacement string'),
  }).describe(
    'Update a file using a regex and a replacement string.  The number of occurrences replaced will be returned to you as an integer.  If you want to append something to a file, you can use a regex to match the end of the file and replace it with the contents you want to append.  To delete portions of a file, you can use a regex to match the contents you want to delete and replace it with an empty string.  Path must be relative.',
  ),
  rm: z.object({
    path: z.string().describe(
      'the relative path to the file you want to remove',
    ),
  }).describe('Remove a file.  This is recursive.'),
  mv: z.object({
    from: z.string().describe('the relative path to the file you want to move'),
    to: z.string().describe(
      'the relative path to the new location of the file',
    ),
  }).describe('Move a file efficiently. This is a rename operation.'),
  search: z.object({
    query: z.string().describe(
      'the relative path to the file or directory you want to find',
    ),
  }).describe(
    'Search for a file or directory.  Returns the relative path to the first match.',
  ),
}
export const returns = {
  write: z.object({
    charactersWritten: z.number(),
  }),
  ls: z.union([z.array(z.string()), z.number()]),
  read: z.string(),
  update: z.object({ matchesUpdated: z.number() }),
  rm: z.void(),
  mv: z.void(),
  search: z.array(
    z.object({ path: z.string(), description: z.string() }),
  ),
}

export const api = toApi(parameters)

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  // TODO this should be a full mirror of the IsolateApi functions
  write: ({ path, content = '' }, api) => {
    log('add', path, content)
    api.write(path, content)
    return { charactersWritten: content.length }
  },
  ls: async ({ path = '.', count, all }, api) => {
    log('ls', path)
    let result = await api.ls(path)
    if (!all) {
      result = result.filter((name) => !name.startsWith('.'))
    }
    if (count) {
      return result.length
    }
    return result
  },
  read: async ({ path }, api) => {
    log('read', path, print(api.pid))
    const result = await api.read(path)
    log('read result', result)
    return result
  },
  update: async ({ path, regex, replacement }, api) => {
    log('update', path, regex, replacement)
    const contents = await api.read(path)
    const matches = contents.match(new RegExp(regex, 'g')) || []
    const result = contents.replace(new RegExp(regex, 'g'), replacement)
    api.write(path, result)
    return { matchesUpdated: matches.length }
  },
  rm: ({ path }, api) => {
    log('rm', path)
    api.delete(path)
  },
  mv: ({ from, to }, api) => {
    log('mv', from, to)
    return api.mv(from, to)
  },
  search: async ({ query }, api) => {
    log('search', query, print(api.pid))

    // to start with, this function should just return all the file paths ?
    // or, read everything in, and make a call based on the contents of all ?

    // read all files and then pump into context, who cares about the price ?
    // or vector store them all based on dir hashes ?
    const ls = await api.ls()
    return ls.map((path) => ({ path, description: '' }))
  },
}
